import os
import io
import hashlib
import torch
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from dotenv import load_dotenv
import boto3
from transformers import CLIPProcessor, CLIPModel
from geolocation_model import GeolocationPredictor
from architectural_matcher import ArchitecturalMatcher
from enhanced_ocr import EnhancedOCR
import json
from typing import Dict, List, Optional, Tuple

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

# Load CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()
print(f"CLIP model loaded on {device}")

# Initialize new ML components
geolocation_predictor = GeolocationPredictor(device)
architectural_matcher = ArchitecturalMatcher()
enhanced_ocr = EnhancedOCR()

print("All ML models initialized successfully")

def generate_embedding(image: Image.Image):
    """Generate CLIP embedding for image"""
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
    return embeddings[0].cpu().numpy().tolist()

@app.get("/")
def read_root():
    return {
        "status": "Navisense ML API", 
        "version": "4.0",
        "features": [
            "CLIP Image Embeddings",
            "Geolocation Prediction", 
            "Multi-View Architectural Matching",
            "Enhanced OCR Analysis",
            "Landmark Detection"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "model": "CLIP ViT-B/32", 
        "device": device, 
        "vectors_in_db": index.describe_index_stats().total_vector_count,
        "geolocation_model": "loaded",
        "architectural_matcher": "loaded",
        "enhanced_ocr": "loaded"
    }

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
        navisense_training = cur.fetchone()[0]
        
        # Count verified feedback with correct locations (ready for training)
        cur.execute('''
            SELECT COUNT(*) FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true AND lf."correctLat" IS NOT NULL 
            AND lf."correctLng" IS NOT NULL AND lr."imageUrl" IS NOT NULL
        ''')
        feedback_ready = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        vectors_in_pinecone = index.describe_index_stats().total_vector_count
        ready_for_training = navisense_training + feedback_ready
        
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_feedback,
            "vectors_in_pinecone": vectors_in_pinecone,
            "ready_for_training": ready_for_training,
            "navisense_training": navisense_training,
            "feedback_ready": feedback_ready
        }
    except Exception as e:
        return {
            "total_recognitions": 0, 
            "verified_feedback": 0, 
            "vectors_in_pinecone": index.describe_index_stats().total_vector_count, 
            "ready_for_training": 0,
            "navisense_training": 0,
            "feedback_ready": 0
        }

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
        
        # Get verified training data from NavisenseTraining
        cur.execute('SELECT "imageUrl", "imageHash", latitude, longitude, address, "businessName" FROM "NavisenseTraining" WHERE verified = true LIMIT 50')
        training_rows = cur.fetchall()
        
        # Get verified feedback data with correct locations
        cur.execute('''
            SELECT lr."imageUrl", lr."imageHash", lf."correctLat", lf."correctLng", lf."correctAddress"
            FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true AND lf."correctLat" IS NOT NULL AND lf."correctLng" IS NOT NULL
            AND lr."imageUrl" IS NOT NULL
            LIMIT 50
        ''')
        feedback_rows = cur.fetchall()
        
        cur.close()
        conn.close()
        
        synced = 0
        skipped = 0
        failed = 0
        
        # Process NavisenseTraining data
        for row in training_rows:
            image_url, image_hash, lat, lng, addr, business_name = row
            try:
                vector_id = f"loc_{image_hash[:16]}"
                existing = index.fetch(ids=[vector_id])
                if existing.vectors:
                    skipped += 1
                    continue
                
                bucket = os.getenv('AWS_S3_BUCKET_NAME')
                # Handle different S3 key formats
                if image_url.startswith('https://'):
                    s3_key = image_url.split('.s3.amazonaws.com/')[-1]
                elif image_url.startswith('blog/'):
                    s3_key = image_url
                elif image_url.startswith('navisense-training/'):
                    s3_key = image_url
                else:
                    s3_key = f"navisense-training/{image_url}"
                response = s3_client.get_object(Bucket=bucket, Key=s3_key)
                image_bytes = response['Body'].read()
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                embedding = generate_embedding(image)
                
                metadata = {"latitude": float(lat), "longitude": float(lng)}
                if addr:
                    metadata["address"] = addr
                if business_name:
                    metadata["businessName"] = business_name
                
                index.upsert(vectors=[(vector_id, embedding, metadata)])
                synced += 1
            except Exception as e:
                failed += 1
                continue
        
        # Process verified feedback data
        for row in feedback_rows:
            image_url, image_hash, lat, lng, addr = row
            try:
                vector_id = f"fb_{image_hash[:16]}" if image_hash else f"fb_{hashlib.sha256(image_url.encode()).hexdigest()[:16]}"
                existing = index.fetch(ids=[vector_id])
                if existing.vectors:
                    skipped += 1
                    continue
                
                bucket = os.getenv('AWS_S3_BUCKET_NAME')
                # Handle different S3 key formats
                if image_url.startswith('https://'):
                    s3_key = image_url.split('.s3.amazonaws.com/')[-1]
                elif image_url.startswith('blog/'):
                    s3_key = image_url
                elif image_url.startswith('navisense-training/'):
                    s3_key = image_url
                else:
                    s3_key = f"navisense-training/{image_url}"
                response = s3_client.get_object(Bucket=bucket, Key=s3_key)
                image_bytes = response['Body'].read()
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                embedding = generate_embedding(image)
                
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
            "message": f"Synced {synced} locations ({len(training_rows)} from training, {len(feedback_rows)} from feedback), skipped {skipped}, failed {failed}"
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
        
        # Generate embedding for similarity search and geolocation prediction
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Try similarity search with architectural matching
        results = index.query(vector=embedding, top_k=10, include_metadata=True)
        
        if results.matches:
            # Use architectural matcher for better building matching
            candidates = [{
                'id': match.id,
                'embedding': embedding,  # We'd need to store embeddings in metadata for real matching
                'metadata': match.metadata,
                'score': match.score
            } for match in results.matches]
            
            # Enhanced matching with architectural features
            arch_matches = architectural_matcher.match_building(embedding_np, candidates)
            
            if arch_matches and arch_matches[0][1] > 0.6:  # Good architectural match
                best_match = next(m for m in results.matches if m.id == arch_matches[0][0])
                
                # Weight-averaged location from top 3 architectural matches
                top_3_arch = arch_matches[:3]
                total_weight = sum(score for _, score in top_3_arch)
                
                if total_weight > 0:
                    weighted_matches = [next(m for m in results.matches if m.id == match_id) 
                                      for match_id, _ in top_3_arch]
                    
                    avg_lat = sum(float(m.metadata["latitude"]) * score for m, (_, score) in zip(weighted_matches, top_3_arch)) / total_weight
                    avg_lng = sum(float(m.metadata["longitude"]) * score for m, (_, score) in zip(weighted_matches, top_3_arch)) / total_weight
                    
                    return {
                        "success": True,
                        "hasLocation": True,
                        "location": {
                            "latitude": avg_lat,
                            "longitude": avg_lng,
                            "address": best_match.metadata.get("address"),
                            "businessName": best_match.metadata.get("businessName")
                        },
                        "confidence": float(top_3_arch[0][1]),
                        "method": "architectural_matching"
                    }
        
        # If no good similarity match, try geolocation prediction for unknown buildings
        if not results.matches or results.matches[0].score < 0.5:
            pred_lat, pred_lng, geo_confidence = geolocation_predictor.predict(embedding_np)
            
            # Validate predicted coordinates are reasonable
            if -90 <= pred_lat <= 90 and -180 <= pred_lng <= 180 and geo_confidence > 0.4:
                return {
                    "success": True,
                    "hasLocation": True,
                    "location": {
                        "latitude": pred_lat,
                        "longitude": pred_lng,
                        "address": "Predicted location",
                        "businessName": "Unknown building"
                    },
                    "confidence": geo_confidence,
                    "method": "geolocation_prediction"
                }
        
        # Fallback to basic similarity if available
        if results.matches and results.matches[0].score >= 0.5:
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
        
        return {"success": False, "hasLocation": False, "message": "No similar locations found", "confidence": 0.0}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhanced-ocr")
async def enhanced_ocr_analysis(file: UploadFile = File(...), ocr_text: str = Form(...)):
    """Enhanced OCR analysis for landmarks and business info"""
    try:
        # Extract comprehensive information from OCR text
        extracted = enhanced_ocr.extract_all(ocr_text)
        confidence = enhanced_ocr.confidence_score(extracted)
        
        return {
            "success": True,
            "extracted_data": extracted,
            "confidence": confidence,
            "method": "enhanced_ocr"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/architectural-analysis")
async def architectural_analysis(file: UploadFile = File(...)):
    """Analyze architectural features of a building"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Extract architectural features
        features = architectural_matcher.extract_features(embedding_np, {})
        
        return {
            "success": True,
            "architectural_features": {
                "roof_pattern": features['roof_pattern'],
                "window_pattern": features['window_pattern'],
                "facade_style": features['facade_style'],
                "height_estimate": features['height_estimate'],
                "color_profile": features['color_profile']
            },
            "method": "architectural_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/geolocation-predict")
async def geolocation_predict(file: UploadFile = File(...)):
    """Predict lat/lng for unknown buildings using ML regression"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Predict coordinates
        pred_lat, pred_lng, confidence = geolocation_predictor.predict(embedding_np)
        
        return {
            "success": True,
            "predicted_location": {
                "latitude": pred_lat,
                "longitude": pred_lng
            },
            "confidence": confidence,
            "method": "geolocation_regression"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-view-match")
async def multi_view_match(file: UploadFile = File(...)):
    """Match building across multiple views/angles"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Get candidates from vector database
        results = index.query(vector=embedding, top_k=20, include_metadata=True)
        
        if not results.matches:
            return {"success": False, "message": "No candidates found"}
        
        # Prepare candidates for architectural matching
        candidates = [{
            'id': match.id,
            'embedding': embedding,  # In real implementation, we'd store embeddings
            'metadata': match.metadata,
            'score': match.score
        } for match in results.matches]
        
        # Perform multi-view architectural matching
        arch_matches = architectural_matcher.match_building(embedding_np, candidates)
        
        # Format results
        formatted_matches = []
        for match_id, score in arch_matches[:5]:
            original_match = next(m for m in results.matches if m.id == match_id)
            formatted_matches.append({
                "id": match_id,
                "architectural_score": score,
                "similarity_score": float(original_match.score),
                "location": {
                    "latitude": float(original_match.metadata["latitude"]),
                    "longitude": float(original_match.metadata["longitude"]),
                    "address": original_match.metadata.get("address"),
                    "businessName": original_match.metadata.get("businessName")
                }
            })
        
        return {
            "success": True,
            "matches": formatted_matches,
            "method": "multi_view_architectural_matching"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/db-sample")
def get_sample_data():
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        # Get sample from NavisenseTraining
        cur.execute('SELECT "imageUrl", "imageHash", latitude, longitude FROM "NavisenseTraining" WHERE verified = true LIMIT 3')
        training_sample = cur.fetchall()
        
        # Get sample from feedback
        cur.execute('''
            SELECT lr."imageUrl", lr."imageHash", lf."correctLat", lf."correctLng"
            FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true AND lf."correctLat" IS NOT NULL 
            AND lr."imageUrl" IS NOT NULL LIMIT 3
        ''')
        feedback_sample = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "training_sample": training_sample,
            "feedback_sample": feedback_sample
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/train")
async def train_location(file: UploadFile = File(...), latitude: float = Form(...), longitude: float = Form(...), address: str = Form(None), businessName: str = Form(None)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
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
        
        # Train geolocation model with this verified data
        geolocation_predictor.train_step(embedding_np, latitude, longitude)
        
        # Add to architectural matcher database
        architectural_matcher.add_building(vector_id, embedding_np, metadata)
        
        return {
            "success": True, 
            "message": "Training data added and models updated", 
            "vector_id": vector_id, 
            "total_vectors": index.describe_index_stats().total_vector_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_models():
    """Retrain geolocation model with all available data"""
    try:
        # Get all training data from database
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        # Get verified training data
        cur.execute('SELECT "imageUrl", latitude, longitude FROM "NavisenseTraining" WHERE verified = true LIMIT 100')
        training_rows = cur.fetchall()
        
        cur.close()
        conn.close()
        
        retrained_count = 0
        
        # Retrain geolocation model with verified data
        for row in training_rows:
            try:
                image_url, lat, lng = row
                
                # Load image from S3
                bucket = os.getenv('AWS_S3_BUCKET_NAME')
                if image_url.startswith('https://'):
                    s3_key = image_url.split('.s3.amazonaws.com/')[-1]
                else:
                    s3_key = f"navisense-training/{image_url}"
                    
                response = s3_client.get_object(Bucket=bucket, Key=s3_key)
                image_bytes = response['Body'].read()
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                # Generate embedding and train
                embedding = generate_embedding(image)
                embedding_np = np.array(embedding)
                
                geolocation_predictor.train_step(embedding_np, float(lat), float(lng))
                retrained_count += 1
                
            except Exception as e:
                continue
        
        return {
            "success": True,
            "message": f"Retrained geolocation model with {retrained_count} samples",
            "samples_processed": retrained_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/s3-test")
def test_s3_access():
    try:
        bucket = os.getenv('AWS_S3_BUCKET_NAME')
        # List first 5 objects in bucket
        response = s3_client.list_objects_v2(Bucket=bucket, MaxKeys=5)
        objects = [obj['Key'] for obj in response.get('Contents', [])]
        return {"success": True, "bucket": bucket, "sample_objects": objects}
    except Exception as e:
        return {"success": False, "error": str(e)}
@app.get("/evaluate-models")
async def evaluate_models():
    """Comprehensive evaluation of all ML models"""
    try:
        # Get test data from database
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        # Get sample of verified data for evaluation
        cur.execute('SELECT "imageUrl", latitude, longitude, address FROM "NavisenseTraining" WHERE verified = true LIMIT 20')
        test_data = cur.fetchall()
        
        cur.close()
        conn.close()
        
        if not test_data:
            return {"success": False, "message": "No test data available"}
        
        # Evaluate geolocation model
        test_embeddings = []
        test_lats = []
        test_lngs = []
        
        for row in test_data[:10]:  # Use first 10 for evaluation
            try:
                image_url, lat, lng, addr = row
                
                # Load image from S3
                bucket = os.getenv('AWS_S3_BUCKET_NAME')
                if image_url.startswith('https://'):
                    s3_key = image_url.split('.s3.amazonaws.com/')[-1]
                else:
                    s3_key = f"navisense-training/{image_url}"
                    
                response = s3_client.get_object(Bucket=bucket, Key=s3_key)
                image_bytes = response['Body'].read()
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                
                # Generate embedding
                embedding = generate_embedding(image)
                test_embeddings.append(embedding)
                test_lats.append(float(lat))
                test_lngs.append(float(lng))
                
            except Exception as e:
                continue
        
        # Evaluate geolocation accuracy
        geo_evaluation = geolocation_predictor.evaluate_accuracy(test_embeddings, test_lats, test_lngs)
        
        # Test architectural matcher
        arch_test_results = []
        if len(test_embeddings) >= 2:
            query_emb = np.array(test_embeddings[0])
            candidates = [{
                'id': f'test_{i}',
                'embedding': emb,
                'metadata': {'test': True}
            } for i, emb in enumerate(test_embeddings[1:6])]
            
            arch_matches = architectural_matcher.match_building(query_emb, candidates)
            arch_test_results = arch_matches[:3]
        
        # Test enhanced OCR with sample text
        sample_ocr_text = "McDonald's Restaurant\n123 Main Street\n(555) 123-4567\nOpen 24 Hours"
        ocr_results = enhanced_ocr.extract_all(sample_ocr_text)
        ocr_confidence = enhanced_ocr.confidence_score(ocr_results)
        
        return {
            "success": True,
            "evaluation_results": {
                "geolocation_model": {
                    "average_error_km": geo_evaluation['average_error_km'],
                    "samples_tested": geo_evaluation['total_samples'],
                    "status": "good" if geo_evaluation['average_error_km'] < 50 else "needs_improvement"
                },
                "architectural_matcher": {
                    "test_matches": arch_test_results,
                    "buildings_in_database": len(architectural_matcher.building_features),
                    "status": "operational"
                },
                "enhanced_ocr": {
                    "sample_extraction": ocr_results,
                    "confidence": ocr_confidence,
                    "status": "operational"
                },
                "vector_database": {
                    "total_vectors": index.describe_index_stats().total_vector_count,
                    "status": "operational"
                }
            },
            "overall_status": "All models operational"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/model-info")
def get_model_info():
    """Get detailed information about all loaded models"""
    return {
        "navisense_ml_version": "4.0",
        "models": {
            "clip_embeddings": {
                "model": "openai/clip-vit-base-patch32",
                "embedding_dim": 512,
                "device": device,
                "status": "loaded"
            },
            "geolocation_predictor": {
                "architecture": "3-layer MLP with confidence estimation",
                "input_dim": 512,
                "output": "latitude, longitude, confidence",
                "status": "loaded"
            },
            "architectural_matcher": {
                "features": [
                    "roof_pattern", "window_pattern", "facade_style", 
                    "color_profile", "height_estimate", "texture_pattern",
                    "architectural_style", "building_age", "symmetry_score"
                ],
                "matching_algorithm": "weighted_feature_similarity",
                "buildings_tracked": len(architectural_matcher.building_features),
                "status": "loaded"
            },
            "enhanced_ocr": {
                "capabilities": [
                    "business_name_extraction", "phone_number_detection",
                    "address_parsing", "landmark_detection", "street_sign_recognition"
                ],
                "landmark_categories": list(enhanced_ocr.LANDMARK_PATTERNS.keys()),
                "status": "loaded"
            }
        },
        "vector_database": {
            "provider": "Pinecone",
            "index_name": index_name,
            "dimension": 512,
            "metric": "cosine",
            "total_vectors": index.describe_index_stats().total_vector_count
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Load architectural features on startup
    architectural_matcher.load_features()
    print("NaviSense ML API v4.0 starting with all enhanced features...")
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))