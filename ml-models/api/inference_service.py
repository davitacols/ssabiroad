from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
from PIL import Image
import io
import numpy as np
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from models.global_geolocation import GlobalGeolocationModel, GlobalLocationPredictor, LocationPrediction
    from training.continuous_learning import ContinuousLearningTrainer
except ImportError:
    print("Warning: Global geolocation modules not fully loaded")
    GlobalGeolocationModel = None

app = FastAPI(title="Global Geolocation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = None
predictor = None
trainer = None

if GlobalGeolocationModel:
    try:
        model = GlobalGeolocationModel(device=device)
        predictor = GlobalLocationPredictor(model, "faiss_index/global_index.faiss")
        trainer = ContinuousLearningTrainer(model, device)
    except Exception as e:
        print(f"Model initialization error: {e}")

class PredictionResponse(BaseModel):
    predictions: List[dict]
    processing_time_ms: float
    model_version: str

class FeedbackRequest(BaseModel):
    image_id: str
    predicted_lat: float
    predicted_lon: float
    true_lat: float
    true_lon: float
    confidence: float
    user_corrected: bool = False

@app.post("/predict", response_model=PredictionResponse)
async def predict_location(
    file: UploadFile = File(...),
    top_k: int = 5,
    min_confidence: float = 0.1
):
    if not predictor:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    start_time = datetime.now()
    
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        predictions = predictor.predict_topk(image, k=top_k)
        predictions = [p for p in predictions if p.confidence >= min_confidence]
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return PredictionResponse(
            predictions=[{
                'latitude': p.lat,
                'longitude': p.lon,
                'confidence': round(p.confidence, 4),
                'method': p.method,
                'metadata': p.metadata
            } for p in predictions],
            processing_time_ms=round(processing_time, 2),
            model_version=f"v{trainer.version if trainer else 0}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    if not trainer:
        raise HTTPException(status_code=503, detail="Trainer not initialized")
    
    try:
        trainer.add_feedback(
            image=None,
            predicted_loc=(feedback.predicted_lat, feedback.predicted_lon),
            true_loc=(feedback.true_lat, feedback.true_lon),
            confidence=feedback.confidence,
            user_corrected=feedback.user_corrected
        )
        return {"status": "success", "message": "Feedback recorded", "buffer_size": len(trainer.feedback_buffer)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    return {
        "model_version": trainer.version if trainer else 0,
        "device": device,
        "feedback_buffer_size": len(trainer.feedback_buffer) if trainer else 0,
        "index_size": predictor.faiss_index.ntotal if predictor else 0,
        "supported_languages": ["en", "es", "fr", "de", "zh", "ja", "ar", "hi", "ru", "pt"],
        "status": "ready" if predictor else "initializing"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
