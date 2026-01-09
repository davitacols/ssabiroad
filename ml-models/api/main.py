"""FastAPI Server for ML Models"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
from typing import List, Dict, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.fusion_pipeline import FusionPipeline
from utils.model_monitor import ModelMonitor, ModelVersionManager, auto_model_selection
from utils.active_learning import ActiveLearningPipeline
from loguru import logger
import time

app = FastAPI(title="NaviSense AI - Intelligent Location Recognition", version="1.0.0", description="Powered by SSABIRoad")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
pipeline = None
monitor = None
version_manager = None
active_learning = None

@app.on_event("startup")
async def startup_event():
    global pipeline, monitor, version_manager, active_learning
    logger.info("Starting ML pipeline...")
    
    try:
        pipeline = FusionPipeline(
            faiss_index_path="../faiss_index",
            similarity_threshold=0.75
        )
        monitor = ModelMonitor()
        version_manager = ModelVersionManager()
        active_learning = ActiveLearningPipeline(data_dir="../data/active_learning", min_samples=5)
        
        # Ensure queue file exists
        active_learning.load_queue()
        if not active_learning.queue.get("samples"):
            active_learning.queue = {"samples": [], "last_training": None}
            active_learning.save_queue()
        
        logger.info(f"Active learning queue loaded: {len(active_learning.queue.get('samples', []))} samples")
        
        best_model = version_manager.get_best_model()
        if best_model:
            logger.info(f"Loaded best model: {best_model['version']}")
        
        logger.info("ML pipeline ready")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        logger.warning("Running in degraded mode")

class BuildingMetadata(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    building_type: Optional[str] = None

class PredictionResponse(BaseModel):
    latitude: Optional[float]
    longitude: Optional[float]
    confidence: float
    method: str
    details: Dict

@app.get("/")
async def root():
    return {
        "status": "online", 
        "service": "NaviSense AI",
        "description": "Intelligent Location Recognition System",
        "version": "1.0.0",
        "powered_by": "SSABIRoad",
        "pipeline_loaded": pipeline is not None
    }

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}

@app.post("/embed", response_model=Dict)
async def embed_image(file: UploadFile = File(...)):
    """Extract CLIP embedding from image"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        embedding = pipeline.retriever.encode_image(image)
        
        return {
            "success": True,
            "embedding": embedding.tolist(),
            "dimension": embedding.shape[1]
        }
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=Dict)
async def search_similar(file: UploadFile = File(...), k: int = 5):
    """Search for similar buildings in FAISS index"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        results = pipeline.retriever.search(image, k=k)
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_location", response_model=PredictionResponse)
async def predict_location(file: UploadFile = File(...), image_id: str = None):
    """Predict location from image using fusion pipeline"""
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert('RGB')
        result = pipeline.predict_location(image)
        
        # Log prediction for monitoring
        if image_id:
            monitor.log_prediction(image_id, result)
        
        # Add to active learning if high confidence
        if result.get("confidence", 0) >= 0.8:
            # Save image temporarily
            temp_path = Path("../data/temp") / f"{image_id or 'temp'}.jpg"
            temp_path.parent.mkdir(exist_ok=True)
            image.save(temp_path)
            active_learning.add_high_confidence_prediction(str(temp_path), result)
        
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add_to_index")
async def add_to_index(file: UploadFile = File(...), metadata: str = None):
    """Add new building image to FAISS index"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        
        import json
        meta_dict = json.loads(metadata) if metadata else {}
        pipeline.add_building_to_index(image, meta_dict)
        pipeline.save_index()
        
        return {
            "success": True,
            "message": "Building added to index",
            "total_buildings": len(pipeline.retriever.metadata)
        }
    except Exception as e:
        logger.error(f"Add to index error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from image using OCR"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        result = pipeline.ocr.process_image(image)
        
        return result
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect_landmark")
async def detect_landmark(file: UploadFile = File(...), top_k: int = 5):
    """Detect landmarks in image"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        results = pipeline.landmark_detector.predict(image, pipeline.transform, top_k=top_k)
        
        return {
            "success": True,
            "landmarks": results
        }
    except Exception as e:
        logger.error(f"Landmark detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(file: UploadFile = File(None), latitude: float = Form(None), longitude: float = Form(None), address: str = Form(None), businessName: str = Form(None), metadata: str = Form(None)):
    """Submit user feedback for prediction"""
    try:
        import json
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
            # Ensure queue directory exists
            queue_dir = Path("../data/active_learning")
            queue_dir.mkdir(parents=True, exist_ok=True)
            
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
            
            # Load existing queue
            active_learning.load_queue()
            active_learning.queue["samples"].append(sample)
            active_learning.save_queue()
            queue_size = len(active_learning.queue["samples"])
            
            logger.info(f"Feedback recorded: {image_id} at ({latitude}, {longitude}), queue size: {queue_size}")
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

@app.get("/stats")
async def get_stats():
    """Get comprehensive statistics"""
    try:
        # Reload queue from disk to get latest data
        if active_learning:
            active_learning.load_queue()
            queue_size = len(active_learning.queue.get("samples", []))
            should_retrain = active_learning.should_retrain()
        else:
            queue_size = 0
            should_retrain = False
        
        return {
            "index": {
                "total_buildings": len(pipeline.retriever.metadata) if pipeline and pipeline.retriever else 0,
                "index_size": pipeline.retriever.index.ntotal if pipeline and pipeline.retriever and pipeline.retriever.index else 0
            },
            "models": {
                "active_version": None,
                "total_versions": 0,
                "loaded": {
                    "clip": True,
                    "geolocation": False,
                    "landmark": False,
                    "ocr": False
                }
            },
            "performance": {},
            "active_learning": {
                "queue_size": queue_size,
                "should_retrain": should_retrain,
                "last_training": active_learning.queue.get("last_training") if active_learning else None
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

@app.post("/trigger_training")
async def trigger_training():
    """Manually trigger model retraining"""
    try:
        if not active_learning.should_retrain():
            return {"success": False, "message": "Not enough samples for training"}
        
        from utils.active_learning import ContinuousTrainer
        trainer = ContinuousTrainer(active_learning)
        version = trainer.run_training_cycle(None, "data/geolocations")
        
        if version:
            return {"success": True, "version": version, "message": "Training started"}
        else:
            return {"success": False, "message": "Training failed"}
    except Exception as e:
        logger.error(f"Training trigger error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain():
    """Force retrain regardless of sample count"""
    try:
        from utils.active_learning import ContinuousTrainer
        trainer = ContinuousTrainer(active_learning)
        version = trainer.run_training_cycle(None, "data/geolocations")
        
        if version:
            return {"success": True, "version": version, "message": "Training started", "queue_size": len(active_learning.queue["samples"])}
        else:
            return {"success": False, "message": "Training failed", "queue_size": len(active_learning.queue["samples"])}
    except Exception as e:
        logger.error(f"Retrain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List all model versions"""
    return {
        "models": version_manager.list_models(),
        "active": version_manager.get_active_model(),
        "best": version_manager.get_best_model()
    }

@app.post("/models/{version}/activate")
async def activate_model(version: str):
    """Activate a specific model version"""
    try:
        version_manager.set_active_model(version)
        return {"success": True, "message": f"Model {version} activated"}
    except Exception as e:
        logger.error(f"Model activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training_queue")
async def get_training_queue():
    """Get current training queue"""
    try:
        import math
        samples = active_learning.queue.get("samples", [])
        # Filter out samples with NaN values
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
            "should_retrain": active_learning.should_retrain()
        }
    except Exception as e:
        logger.error(f"Training queue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training_status")
async def get_training_status():
    """Get training status"""
    try:
        return {
            "status": "idle",
            "queue_size": len(active_learning.queue.get("samples", [])),
            "last_training": active_learning.queue.get("last_training")
        }
    except Exception as e:
        logger.error(f"Training status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(file: UploadFile = File(...), latitude: float = Form(None), longitude: float = Form(None), metadata: str = Form(None)):
    """Add training data to active learning queue"""
    try:
        import json
        meta = json.loads(metadata) if metadata else {}
        image_id = meta.get('userId', 'unknown') + '_' + str(int(time.time()))
        
        temp_path = Path("../data/training") / f"{image_id}.jpg"
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        
        content = await file.read()
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        # Add to queue with proper metadata
        try:
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
            active_learning.queue["samples"].append(sample)
            active_learning.save_queue()
            queue_size = len(active_learning.queue["samples"])
        except Exception as e:
            logger.error(f"Queue error: {e}")
            queue_size = 0
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
