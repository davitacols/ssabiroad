"""Test ML API endpoints"""
import requests
from pathlib import Path

API_URL = "http://localhost:8000"

def test_health():
    """Test API health"""
    response = requests.get(f"{API_URL}/")
    print("Health Check:", response.json())

def test_predict_location(image_path: str):
    """Test location prediction"""
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/predict_location", files=files)
        print("\nPredict Location:", response.json())

def test_search(image_path: str, k: int = 3):
    """Test similarity search"""
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/search?k={k}", files=files)
        print("\nSearch Results:", response.json())

def test_ocr(image_path: str):
    """Test OCR"""
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/ocr", files=files)
        print("\nOCR Results:", response.json())

def test_stats():
    """Test stats endpoint"""
    response = requests.get(f"{API_URL}/stats")
    print("\nStats:", response.json())

if __name__ == "__main__":
    # Replace with your test image path
    test_image = "test_building.jpg"
    
    if Path(test_image).exists():
        test_health()
        test_stats()
        test_predict_location(test_image)
        test_search(test_image)
        test_ocr(test_image)
    else:
        print(f"Test image not found: {test_image}")
        print("Please provide a test image")
