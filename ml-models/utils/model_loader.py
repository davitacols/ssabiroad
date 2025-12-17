"""Model download and loading utilities"""
import os
import torch
from pathlib import Path
from loguru import logger

def download_models_if_needed():
    """Download required models if not present"""
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    required_models = {
        "geolocation": models_dir / "geolocation_best.pth",
        "landmark": models_dir / "landmark_best.pth",
    }
    
    for name, path in required_models.items():
        if not path.exists():
            logger.warning(f"{name} model not found at {path}")
            logger.info(f"Please train {name} model or download from backup")
        else:
            logger.info(f"✓ {name} model found")
    
    # Check FAISS index
    faiss_dir = Path("faiss_index")
    if not faiss_dir.exists() or not list(faiss_dir.glob("*.index")):
        logger.warning("FAISS index not found - will be created on first use")
    else:
        logger.info("✓ FAISS index found")

def get_device():
    """Get available device"""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")
