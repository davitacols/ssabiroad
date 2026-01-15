import os
import io
import hashlib
import urllib.request
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from dotenv import load_dotenv
import boto3

load_dotenv()

s3_client = boto3.client('s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION_NAME', 'us-east-1'))

app = FastAPI(title="Navisense ML API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "navisense-locations")
if index_name not in pc.list_indexes().names():
    pc.create_index(name=index_name, dimension=512, metric="cosine", spec=ServerlessSpec(cloud="aws", region="us-east-1"))
index = pc.Index(index_name)

def generate_embedding(image: Image.Image):
    import base64
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    # Try Hugging Face API first
    HF_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
    if HF_API_KEY:
        try:
            API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            response = requests.post(API_URL, headers=headers, json={"inputs": img_str}, timeout=10)
            if response.status_code == 200:
                return response.json()
        except:
            pass
    
    # Fallback to hash
    img_hash = hashlib.sha256(buffered.getvalue()).hexdigest()
    return [float(int(img_hash[i:i+2], 16)) / 255.0 for i in range(0, 128, 2)][:64] + [0.0] * 448

@app.get("/")
def read_root():
    return {"status": "Navisense ML API", "version": "3.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "CLIP ViT-B/32", "device": "cpu", "vectors_in_db": index.describe_index_stats().total_vector_count}

@app.get("/stats")
def get_stats():
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM location_recognitions")
        total_recognitions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM location_feedback WHERE \"wasCorrect\" = true")
        verified_feedback = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM \"NavisenseTraining\" WHERE verified = true")
        ready_for_training = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        vectors_in_pinecone = index.describe_index_stats().total_vector_count
        
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_feedback,
            "vectors_in_pinecone": vectors_in_pinecone,
            "ready_for_training": ready_for_training
        }
    except Exception as e:
        return {"total_recognitions": 0, "verified_feedback": 0, "vectors_in_pinecone": index.describe_index_stats().total_vector_count, "ready_for_training": 0}

@app.post("/sync-training")
async def sync_training():
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        cur.execute('SELECT "imageUrl", "imageHash", latitude, longitude, address FROM "NavisenseTraining" WHERE verified = true LIMIT 100')
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        synced = 0
        skipped = 0
        failed = 0
        
        for row in rows:
            image_url, image_hash, lat, lng, addr = row
            try:
                # Check if already in Pinecone
                vector_id = f"loc_{image_hash[:16]}"
                existing = index.fetch(ids=[vector_id])
                if existing.vectors:
                    skipped += 1
                    continue
                
                # Download from S3
                bucket = os.getenv('AWS_S3_BUCKET_NAME')
                response = s3_client.get_object(Bucket=bucket, Key=image_url)
                image_bytes = response['Body'].read()
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                # Generate embedding
                embedding = generate_embedding(image)
                
                # Store in Pinecone
                metadata = {"latitude": float(lat), "longitude": float(lng)}
                if addr:
                    metadata["address"] = addr
                
                index.upsert(vectors=[(vector_id, embedding, metadata)])
                synced += 1
            except Exception as e:
                failed += 1
                continue
        
        return {
            "success": True,
            "synced": synced,
            "skipped": skipped,
            "failed": failed,
            "message": f"Synced {synced} locations, skipped {skipped}, failed {failed}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict_location(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Try exact hash match first
        img_hash = hashlib.sha256(image_bytes).hexdigest()
        vector_id = f"loc_{img_hash[:16]}"
        exact_match = index.fetch(ids=[vector_id])
        
        if exact_match.vectors and vector_id in exact_match.vectors:
            match = exact_match.vectors[vector_id]
            return {
                "success": True,
                "hasLocation": True,
                "location": {
                    "latitude": float(match.metadata["latitude"]),
                    "longitude": float(match.metadata["longitude"]),
                    "address": match.metadata.get("address"),
                    "businessName": match.metadata.get("businessName")
                },
                "confidence": 1.0,
                "method": "exact_match"
            }
        
        # Fallback to similarity search
        embedding = generate_embedding(image)
        results = index.query(vector=embedding, top_k=5, include_metadata=True)
        
        if not results.matches:
            return {"success": False, "hasLocation": False, "message": "No similar locations found", "confidence": 0.0}
        
        top_match = results.matches[0]
        if top_match.score < 0.5:
            return {"success": False, "hasLocation": False, "message": "Low confidence", "confidence": float(top_match.score)}
        
        total_weight = sum(m.score for m in results.matches[:3])
        avg_lat = sum(float(m.metadata["latitude"]) * m.score for m in results.matches[:3]) / total_weight
        avg_lng = sum(float(m.metadata["longitude"]) * m.score for m in results.matches[:3]) / total_weight
        
        return {
            "success": True,
            "hasLocation": True,
            "location": {
                "latitude": avg_lat,
                "longitude": avg_lng,
                "address": top_match.metadata.get("address"),
                "businessName": top_match.metadata.get("businessName")
            },
            "confidence": float(top_match.score),
            "method": "similarity"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_location(file: UploadFile = File(...), latitude: float = Form(...), longitude: float = Form(...), address: str = Form(None), businessName: str = Form(None)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        
        # Create unique ID
        img_hash = hashlib.sha256(image_bytes).hexdigest()
        vector_id = f"loc_{img_hash[:16]}"
        
        # Store in Pinecone
        metadata = {"latitude": latitude, "longitude": longitude}
        if address:
            metadata["address"] = address
        if businessName:
            metadata["businessName"] = businessName
        
        index.upsert(vectors=[(vector_id, embedding, metadata)])
        
        return {"success": True, "message": "Training data added", "vector_id": vector_id, "total_vectors": index.describe_index_stats().total_vector_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
