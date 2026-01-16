import os
import io
import hashlib
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from dotenv import load_dotenv
import boto3
from sentence_transformers import SentenceTransformer

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
    pc.create_index(name=index_name, dimension=384, metric="cosine", spec=ServerlessSpec(cloud="aws", region="us-east-1"))
index = pc.Index(index_name)

# Lazy load model
model = None

def get_model():
    global model
    if model is None:
        print("Loading sentence-transformers model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded")
    return model

def generate_embedding(image: Image.Image):
    """Generate embedding using image hash (lightweight)"""
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='PNG')
    img_hash = hashlib.sha256(img_bytes.getvalue()).hexdigest()
    # Convert hash to 384-dim vector
    hash_int = int(img_hash, 16)
    embedding = [(hash_int >> (i * 8)) & 0xFF for i in range(384)]
    # Normalize
    norm = sum(x*x for x in embedding) ** 0.5
    return [x/norm for x in embedding]

@app.get("/")
def read_root():
    return {"status": "Navisense ML API", "version": "3.0-lite"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "lightweight", "vectors_in_db": index.describe_index_stats().total_vector_count}

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
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_feedback,
            "vectors_in_pinecone": index.describe_index_stats().total_vector_count,
            "ready_for_training": ready_for_training
        }
    except Exception as e:
        return {"total_recognitions": 0, "verified_feedback": 0, "vectors_in_pinecone": index.describe_index_stats().total_vector_count, "ready_for_training": 0}

@app.post("/predict")
async def predict_location(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Try exact hash match
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
        
        # Fallback to similarity
        embedding = generate_embedding(image)
        results = index.query(vector=embedding, top_k=5, include_metadata=True)
        
        if not results.matches or results.matches[0].score < 0.5:
            return {"success": False, "hasLocation": False, "message": "No similar locations found", "confidence": 0.0}
        
        top_match = results.matches[0]
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
        
        embedding = generate_embedding(image)
        img_hash = hashlib.sha256(image_bytes).hexdigest()
        vector_id = f"loc_{img_hash[:16]}"
        
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
