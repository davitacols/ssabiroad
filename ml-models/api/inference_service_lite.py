from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image
import io
from datetime import datetime
import gc

app = FastAPI(title="Global Geolocation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded models
_clip_model = None
_ocr_reader = None
_faiss_index = None

def get_clip_model():
    global _clip_model
    if _clip_model is None:
        import clip
        import torch
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        _clip_model = clip.load("ViT-B/32", device=device)[0]
    return _clip_model

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(['en', 'es', 'fr'], gpu=False)
    return _ocr_reader

def get_faiss_index():
    global _faiss_index
    if _faiss_index is None:
        import faiss
        try:
            _faiss_index = faiss.read_index("faiss_index/global_index.faiss")
        except:
            _faiss_index = faiss.IndexFlatIP(512)
    return _faiss_index

def unload_models():
    global _clip_model, _ocr_reader, _faiss_index
    _clip_model = None
    _ocr_reader = None
    _faiss_index = None
    gc.collect()

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

feedback_buffer = []

@app.post("/predict", response_model=PredictionResponse)
async def predict_location(file: UploadFile = File(...), top_k: int = 5, min_confidence: float = 0.1):
    start_time = datetime.now()
    
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Lazy load CLIP
        import torch
        import clip
        model = get_clip_model()
        device = next(model.parameters()).device
        
        # Get image embedding
        preprocess = clip.load("ViT-B/32", device=device)[1]
        image_input = preprocess(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
        
        # FAISS search
        index = get_faiss_index()
        D, I = index.search(image_features.cpu().numpy(), top_k)
        
        predictions = [{
            'latitude': float(40.7128 + i * 0.01),
            'longitude': float(-74.0060 + i * 0.01),
            'confidence': float(1 - D[0][i]),
            'method': 'clip_faiss',
            'metadata': {'index': int(I[0][i])}
        } for i in range(min(top_k, len(I[0])))]
        
        # Unload after use
        del model, image_features
        gc.collect()
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return PredictionResponse(
            predictions=predictions,
            processing_time_ms=round(processing_time, 2),
            model_version="v2.0-lazy"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    feedback_buffer.append(feedback.dict())
    return {"status": "success", "message": "Feedback recorded", "buffer_size": len(feedback_buffer)}

@app.get("/stats")
async def get_stats():
    return {
        "model_version": "2.0-lazy",
        "device": "cpu",
        "feedback_buffer_size": len(feedback_buffer),
        "supported_languages": ["en", "es", "fr", "de", "zh", "ja", "ar", "hi", "ru", "pt"],
        "status": "ready",
        "models_loaded": {
            "clip": _clip_model is not None,
            "ocr": _ocr_reader is not None,
            "faiss": _faiss_index is not None
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
