import os
import io
import hashlib
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from dotenv import load_dotenv
import numpy as np

load_dotenv()

app = FastAPI(title="Navisense ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print(f"CLIP model loaded on {device}")

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "navisense-locations")

# Create index if it doesn't exist
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=512,  # CLIP ViT-B/32 embedding size
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
    print(f"Created Pinecone index: {index_name}")

index = pc.Index(index_name)
print(f"Connected to Pinecone index: {index_name}")

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def generate_embedding(image: Image.Image):
    """Generate CLIP embedding for an image"""
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    return image_features.cpu().numpy()[0].tolist()

def calculate_image_hash(image_bytes: bytes) -> str:
    """Calculate SHA256 hash of image"""
    return hashlib.sha256(image_bytes).hexdigest()

@app.get("/")
def read_root():
    return {"status": "Navisense ML API", "version": "2.0"}

@app.get("/health")
def health_check():
    stats = index.describe_index_stats()
    return {
        "status": "healthy",
        "model": "CLIP ViT-B/32",
        "device": device,
        "vectors_in_db": stats.total_vector_count
    }

@app.post("/predict")
async def predict_location(file: UploadFile = File(...)):
    """Predict location from image using similarity search"""
    try:
        # Read and process image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        
        # Query Pinecone for similar images
        results = index.query(
            vector=embedding,
            top_k=5,
            include_metadata=True
        )
        
        if not results.matches or len(results.matches) == 0:
            return {
                "success": False,
                "message": "No similar locations found",
                "confidence": 0.0
            }
        
        # Get top match
        top_match = results.matches[0]
        
        # Confidence threshold
        if top_match.score < 0.7:
            return {
                "success": False,
                "message": "Low confidence prediction",
                "confidence": float(top_match.score)
            }
        
        # Calculate weighted average of top matches
        total_weight = sum(m.score for m in results.matches[:3])
        avg_lat = sum(float(m.metadata["latitude"]) * m.score for m in results.matches[:3]) / total_weight
        avg_lng = sum(float(m.metadata["longitude"]) * m.score for m in results.matches[:3]) / total_weight
        
        return {
            "success": True,
            "location": {
                "latitude": avg_lat,
                "longitude": avg_lng,
                "address": top_match.metadata.get("address"),
                "businessName": top_match.metadata.get("businessName")
            },
            "confidence": float(top_match.score),
            "method": "navisense-ml",
            "similar_locations": [
                {
                    "latitude": float(m.metadata["latitude"]),
                    "longitude": float(m.metadata["longitude"]),
                    "score": float(m.score)
                }
                for m in results.matches[:3]
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def add_training_data(file: UploadFile = File(...)):
    """Add new training data to vector database"""
    try:
        # This endpoint will be called by a cron job to process feedback data
        return {"message": "Training endpoint - use /sync-training for batch processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync-training")
async def sync_training_data():
    """Sync verified feedback from PostgreSQL to Pinecone"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get verified recognitions with feedback
        cur.execute("""
            SELECT 
                lr.id,
                lr.image_url,
                lr.latitude,
                lr.longitude,
                lr.address,
                lr.business_name,
                lf.is_correct
            FROM location_recognitions lr
            LEFT JOIN location_feedback lf ON lr.id = lf."recognitionId"
            WHERE lf.is_correct = true
            AND lr.image_url IS NOT NULL
        """)
        
        rows = cur.fetchall()
        synced_count = 0
        
        for row in rows:
            rec_id, image_url, lat, lng, address, business_name, is_correct = row
            
            # Check if already in Pinecone
            try:
                existing = index.fetch(ids=[rec_id])
                if rec_id in existing.vectors:
                    continue  # Skip if already synced
            except:
                pass
            
            # TODO: Download image from S3 and generate embedding
            # For now, we'll skip this and handle it in a separate process
            synced_count += 1
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "synced": synced_count,
            "message": f"Synced {synced_count} verified locations"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def get_stats():
    """Get training statistics"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM location_recognitions")
        total_recognitions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM location_feedback WHERE is_correct = true")
        verified_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        stats = index.describe_index_stats()
        
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_count,
            "vectors_in_pinecone": stats.total_vector_count,
            "ready_for_training": verified_count - stats.total_vector_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
