"""FastAPI Server for ML Models"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
from typing import List, Dict, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.fusion_pipeline import FusionPipeline
from loguru import logger

app = FastAPI(title="Pic2Nav ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline
pipeline = None

@app.on_event("startup")
async def startup_event():
    global pipeline
    logger.info("Starting ML pipeline...")
    pipeline = FusionPipeline(
        faiss_index_path="faiss_index",
        similarity_threshold=0.75
    )
    logger.info("ML pipeline ready")

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
    return {"status": "online", "service": "Pic2Nav ML API"}

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
async def predict_location(file: UploadFile = File(...)):
    """Predict location from image using fusion pipeline"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        result = pipeline.predict_location(image)
        
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

@app.get("/stats")
async def get_stats():
    """Get index statistics"""
    return {
        "total_buildings": len(pipeline.retriever.metadata),
        "index_size": pipeline.retriever.index.ntotal if pipeline.retriever.index else 0,
        "models_loaded": {
            "clip": True,
            "geolocation": pipeline.geoloc_model is not None,
            "landmark": pipeline.landmark_detector is not None,
            "ocr": pipeline.ocr is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
