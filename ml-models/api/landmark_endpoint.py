"""
Landmark Recognition API Endpoint
Integrates Google Landmarks Dataset v2 with SSABIRoad
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
import io
import sys
from pathlib import Path

# Add models directory to path
sys.path.append(str(Path(__file__).parent.parent / 'models'))

from landmark_recognition import LandmarkRecognitionModel

router = APIRouter()

# Initialize model (load once)
landmark_model = None

def get_model():
    global landmark_model
    if landmark_model is None:
        landmark_model = LandmarkRecognitionModel()
        landmark_model.load_index("data/landmark_index.faiss")
    return landmark_model

@router.post("/recognize-landmark")
async def recognize_landmark(image: UploadFile = File(...)):
    """
    Recognize landmark in uploaded image
    """
    try:
        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        
        # Save temporarily
        temp_path = f"/tmp/{image.filename}"
        img.save(temp_path)
        
        # Get model and recognize
        model = get_model()
        result = model.recognize_landmark(temp_path, top_k=5)
        
        # Clean up
        Path(temp_path).unlink(missing_ok=True)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/landmark-stats")
async def landmark_stats():
    """
    Get landmark recognition statistics
    """
    model = get_model()
    
    return {
        "total_landmarks": model.landmark_index.ntotal if model.landmark_index else 0,
        "metadata_loaded": model.landmark_metadata is not None,
        "model_ready": model.landmark_index is not None,
        "dataset_version": "2.1"
    }
