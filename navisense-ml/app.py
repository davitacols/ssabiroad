import os
import io
import hashlib
import ssl
import urllib.request
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
import boto3
from botocore.exceptions import ClientError

load_dotenv()

# Download AWS RDS CA certificate if not exists
RDS_CA_CERT_PATH = "rds-ca-2019-root.pem"
if not os.path.exists(RDS_CA_CERT_PATH):
    print("Downloading AWS RDS CA certificate...")
    url = "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
    urllib.request.urlretrieve(url, RDS_CA_CERT_PATH)
    print("AWS RDS CA certificate downloaded")

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
)
S3_BUCKET = os.getenv('AWS_S3_BUCKET_NAME', 'pic2nav-blog-2025')

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
    db_url = os.getenv("DATABASE_URL")
    db_url = db_url.replace('?sslmode=require', '').replace('&sslmode=require', '')
    return psycopg2.connect(db_url, sslmode='require', sslrootcert=RDS_CA_CERT_PATH)

def download_image_from_s3(image_url: str) -> Optional[Image.Image]:
    """Download image from S3 URL"""
    try:
        # Extract S3 key from URL
        # Format: https://pic2nav-blog-2025.s3.amazonaws.com/path/to/image.jpg
        if '.s3.amazonaws.com/' in image_url:
            s3_key = image_url.split('.s3.amazonaws.com/')[-1]
        elif '.s3.' in image_url and '.amazonaws.com/' in image_url:
            s3_key = image_url.split('.amazonaws.com/')[-1]
        else:
            print(f"Invalid S3 URL format: {image_url}")
            return None
        
        # Download from S3
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
        image_bytes = response['Body'].read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return image
    except ClientError as e:
        print(f"S3 download error: {e}")
        return None
    except Exception as e:
        print(f"Image processing error: {e}")
        return None

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
        # Read and process image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        
        # Generate unique ID from image hash
        image_hash = calculate_image_hash(image_bytes)
        
        # Store in Pinecone (metadata should be provided via form data in production)
        index.upsert(
            vectors=[{
                "id": image_hash,
                "values": embedding,
                "metadata": {
                    "imageHash": image_hash,
                    "source": "manual_upload"
                }
            }]
        )
        
        return {
            "success": True,
            "imageHash": image_hash,
            "message": "Training data added successfully"
        }
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
                lr."imageUrl",
                lr.latitude,
                lr.longitude,
                lr."detectedAddress",
                lr."businessName",
                lf."wasCorrect"
            FROM location_recognitions lr
            LEFT JOIN location_feedback lf ON lr.id = lf."recognitionId"
            WHERE lf."wasCorrect" = true
            AND lr."imageUrl" IS NOT NULL
        """)
        
        rows = cur.fetchall()
        synced_count = 0
        failed_count = 0
        skipped_count = 0
        
        for row in rows:
            rec_id, image_url, lat, lng, address, business_name, was_correct = row
            
            # Check if already in Pinecone
            try:
                existing = index.fetch(ids=[str(rec_id)])
                if str(rec_id) in existing.vectors:
                    skipped_count += 1
                    continue
            except:
                pass
            
            # Download image from S3
            image = download_image_from_s3(image_url)
            if image is None:
                print(f"Failed to download image for {rec_id}")
                failed_count += 1
                continue
            
            # Generate embedding
            try:
                embedding = generate_embedding(image)
                
                # Store in Pinecone
                index.upsert(
                    vectors=[{
                        "id": str(rec_id),
                        "values": embedding,
                        "metadata": {
                            "latitude": str(lat),
                            "longitude": str(lng),
                            "address": address or "",
                            "businessName": business_name or "",
                            "imageUrl": image_url
                        }
                    }]
                )
                synced_count += 1
                print(f"Synced {rec_id}: {business_name or address}")
            except Exception as e:
                print(f"Failed to process {rec_id}: {e}")
                failed_count += 1
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "synced": synced_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "message": f"Synced {synced_count} locations, skipped {skipped_count}, failed {failed_count}"
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in sync_training_data: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def get_stats():
    """Get training statistics"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM location_recognitions")
        total_recognitions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM location_feedback WHERE \"wasCorrect\" = true")
        verified_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        stats = index.describe_index_stats()
        
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_count,
            "vectors_in_pinecone": stats.total_vector_count,
            "ready_for_training": max(0, verified_count - stats.total_vector_count)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
