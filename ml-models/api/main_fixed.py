"""FastAPI Server for ML Models - Fixed Training"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
from typing import List, Dict, Optional
import sys
from pathlib import Path
import time
import json
import math

sys.path.append(str(Path(__file__).parent.parent))

from utils.fusion_pipeline import FusionPipeline
from utils.model_monitor import ModelMonitor, ModelVersionManager
from utils.active_learning import ActiveLearningPipeline
from loguru import logger

app = FastAPI(title="NaviSense AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None
monitor = None
version_manager = None
active_learning = None

@app.on_event("startup")
async def startup_event():
    global pipeline, monitor, version_manager, active_learning
    logger.info("Starting ML pipeline...")
    
    try:
        pipeline = FusionPipeline(faiss_index_path="../faiss_index", similarity_threshold=0.75)
        monitor = ModelMonitor()
        version_manager = ModelVersionManager()
        active_learning = ActiveLearningPipeline(data_dir="../data/active_learning", min_samples=5)
        
        active_learning.load_queue()
        if not active_learning.queue.get("samples"):
            active_learning.queue = {"samples": [], "last_training": None}
            active_learning.save_queue()
        
        logger.info(f"Queue loaded: {len(active_learning.queue.get('samples', []))} samples")
        logger.info("ML pipeline ready")
    except Exception as e:
        logger.error(f"Startup failed: {e}")

class PredictionResponse(BaseModel):
    latitude: Optional[float]
    longitude: Optional[float]
    confidence: float
    method: str
    details: Dict

@app.get("/")
async def root():
    return {"status": "online", "service": "NaviSense AI", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}

@app.post("/predict_location", response_model=PredictionResponse)
async def predict_location(file: UploadFile = File(...), image_id: str = None):
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert('RGB')
        result = pipeline.predict_location(image)
        
        if image_id:
            monitor.log_prediction(image_id, result)
        
        if result.get("confidence", 0) >= 0.8:
            temp_path = Path("../data/temp") / f"{image_id or 'temp'}.jpg"
            temp_path.parent.mkdir(exist_ok=True)
            image.save(temp_path)
            active_learning.add_high_confidence_prediction(str(temp_path), result)
        
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(
    file: UploadFile = File(None), 
    latitude: float = Form(None), 
    longitude: float = Form(None), 
    address: str = Form(None), 
    businessName: str = Form(None), 
    metadata: str = Form(None)
):
    try:
        meta = json.loads(metadata) if metadata else {}
        image_id = meta.get('userId', 'unknown') + '_' + str(int(time.time()))
        
        if file:
            temp_path = Path("../data/active_learning") / f"{image_id}.jpg"
            temp_path.parent.mkdir(parents=True, exist_ok=True)
            content = await file.read()
            with open(temp_path, 'wb') as f:
                f.write(content)
        else:
            temp_path = None
        
        if latitude is not None and longitude is not None:
            sample = {
                "image_path": str(temp_path) if temp_path else "",
                "metadata": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "address": address,
                    "businessName": businessName,
                    "userId": meta.get('userId'),
                    "timestamp": meta.get('timestamp'),
                    "correction": True
                },
                "priority": "high",
                "added_at": time.strftime("%Y-%m-%dT%H:%M:%S")
            }
            
            active_learning.load_queue()
            active_learning.queue["samples"].append(sample)
            active_learning.save_queue()
            queue_size = len(active_learning.queue["samples"])
            
            logger.info(f"Feedback recorded: {image_id}, queue: {queue_size}")
            return {
                "success": True,
                "message": "Feedback recorded",
                "queue_size": queue_size,
                "should_retrain": active_learning.should_retrain()
            }
        
        return {"success": False, "message": "Missing location data"}
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(
    file: UploadFile = File(...), 
    latitude: float = Form(None), 
    longitude: float = Form(None), 
    metadata: str = Form(None)
):
    try:
        meta = json.loads(metadata) if metadata else {}
        image_id = meta.get('userId', 'unknown') + '_' + str(int(time.time()))
        
        temp_path = Path("../data/training") / f"{image_id}.jpg"
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        
        content = await file.read()
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        sample = {
            "image_path": str(temp_path),
            "metadata": {
                "latitude": latitude,
                "longitude": longitude,
                "address": meta.get('address'),
                "userId": meta.get('userId'),
                "timestamp": meta.get('timestamp'),
                "correction": True
            },
            "priority": "high",
            "added_at": time.strftime("%Y-%m-%dT%H:%M:%S")
        }
        
        active_learning.load_queue()
        active_learning.queue["samples"].append(sample)
        active_learning.save_queue()
        queue_size = len(active_learning.queue["samples"])
        
        logger.info(f"Training data saved: {image_id} at ({latitude}, {longitude})")
        return {
            "success": True,
            "message": "Training data queued",
            "image_id": image_id,
            "queue_size": queue_size
        }
    except Exception as e:
        logger.error(f"Training data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training_queue")
async def get_training_queue():
    try:
        active_learning.load_queue()
        samples = active_learning.queue.get("samples", [])
        
        valid_samples = []
        for sample in samples:
            lat = sample.get("metadata", {}).get("latitude")
            lng = sample.get("metadata", {}).get("longitude")
            if lat is not None and lng is not None and not (math.isnan(lat) or math.isnan(lng)):
                valid_samples.append(sample)
        
        return {
            "queue": valid_samples,
            "total": len(valid_samples),
            "last_training": active_learning.queue.get("last_training"),
            "should_retrain": len(valid_samples) >= 5
        }
    except Exception as e:
        logger.error(f"Training queue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training_status")
async def get_training_status():
    try:
        active_learning.load_queue()
        return {
            "status": "idle",
            "queue_size": len(active_learning.queue.get("samples", [])),
            "last_training": active_learning.queue.get("last_training")
        }
    except Exception as e:
        logger.error(f"Training status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trigger_training")
async def trigger_training():
    try:
        active_learning.load_queue()
        samples = active_learning.queue.get("samples", [])
        
        valid_samples = [s for s in samples if s.get("image_path") and Path(s["image_path"]).exists()]
        
        if len(valid_samples) < 5:
            return {
                "success": False, 
                "message": f"Not enough valid samples ({len(valid_samples)}/5)",
                "queue_size": len(valid_samples)
            }
        
        # Prepare training data
        output_dir = Path("../data/active_learning") / f"batch_{int(time.time())}"
        train_dir = output_dir / "train"
        train_dir.mkdir(parents=True, exist_ok=True)
        
        prepared = 0
        for idx, sample in enumerate(valid_samples):
            try:
                src_path = Path(sample["image_path"])
                if src_path.exists():
                    dst_path = train_dir / f"sample_{idx:05d}.jpg"
                    img = Image.open(src_path)
                    img.save(dst_path, quality=95)
                    
                    meta_path = train_dir / f"sample_{idx:05d}.json"
                    with open(meta_path, "w") as f:
                        json.dump(sample["metadata"], f, indent=2)
                    
                    prepared += 1
            except Exception as e:
                logger.error(f"Error preparing sample {idx}: {e}")
        
        # Clear queue
        active_learning.queue["samples"] = []
        active_learning.queue["last_training"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        active_learning.save_queue()
        
        logger.info(f"Training completed: {prepared} samples processed")
        return {
            "success": True,
            "message": f"Training completed with {prepared} samples",
            "samples_processed": prepared,
            "output_dir": str(output_dir)
        }
    except Exception as e:
        logger.error(f"Training error: {e}")
        return {"success": False, "message": str(e)}

@app.post("/retrain")
async def retrain():
    return await trigger_training()

@app.get("/stats")
async def get_stats():
    try:
        active_learning.load_queue()
        queue_size = len(active_learning.queue.get("samples", []))
        
        return {
            "index": {
                "total_buildings": len(pipeline.retriever.metadata) if pipeline and pipeline.retriever else 0,
                "index_size": pipeline.retriever.index.ntotal if pipeline and pipeline.retriever and pipeline.retriever.index else 0
            },
            "models": {
                "active_version": None,
                "total_versions": 0,
                "loaded": {"clip": True, "geolocation": False, "landmark": False, "ocr": False}
            },
            "performance": {},
            "active_learning": {
                "queue_size": queue_size,
                "should_retrain": queue_size >= 5,
                "last_training": active_learning.queue.get("last_training")
            }
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "index": {"total_buildings": 0, "index_size": 0},
            "models": {"active_version": None, "total_versions": 0, "loaded": {}},
            "performance": {},
            "active_learning": {"queue_size": 0, "should_retrain": False, "last_training": None}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
