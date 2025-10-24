import tensorflow as tf
from landmark_classifier import LandmarkClassifier
from gps_predictor import GPSPredictor
import os

def download_and_save_models():
    """Download pretrained models and save"""
    
    print("Creating models with pretrained weights...")
    
    # Landmark classifier
    print("\n1. Creating landmark classifier...")
    landmark_model = LandmarkClassifier(num_classes=1000)
    os.makedirs('models', exist_ok=True)
    landmark_model.save('models/landmark_classifier.h5')
    print("✓ Saved to models/landmark_classifier.h5")
    
    # GPS predictor
    print("\n2. Creating GPS predictor...")
    gps_model = GPSPredictor()
    gps_model.model.save('models/gps_predictor.h5')
    print("✓ Saved to models/gps_predictor.h5")
    
    print("\n✓ All models ready!")
    print("\nTo start inference server:")
    print("  python scripts/inference_server.py")

if __name__ == '__main__':
    download_and_save_models()
