import os
import io
import hashlib
import urllib.request
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
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
    return {"status": "healthy", "vectors_in_db": index.describe_index_stats().total_vector_count}

@app.post("/predict")
async def predict_location(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        embedding = generate_embedding(image)
        results = index.query(vector=embedding, top_k=5, include_metadata=True)
        if not results.matches:
            return {"success": False, "message": "No similar locations found", "confidence": 0.0}
        top_match = results.matches[0]
        if top_match.score < 0.7:
            return {"success": False, "message": "Low confidence", "confidence": float(top_match.score)}
        total_weight = sum(m.score for m in results.matches[:3])
        avg_lat = sum(float(m.metadata["latitude"]) * m.score for m in results.matches[:3]) / total_weight
        avg_lng = sum(float(m.metadata["longitude"]) * m.score for m in results.matches[:3]) / total_weight
        return {"success": True, "location": {"latitude": avg_lat, "longitude": avg_lng, "address": top_match.metadata.get("address"), "businessName": top_match.metadata.get("businessName")}, "confidence": float(top_match.score)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
