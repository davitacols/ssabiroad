import requests
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_stats():
    """Test stats endpoint"""
    print("\nTesting /stats endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict(image_path):
    """Test prediction endpoint"""
    print(f"\nTesting /predict endpoint with {image_path}...")
    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{BASE_URL}/predict", files=files)
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Navisense ML Service Test\n")
    print("=" * 50)
    
    # Test basic endpoints
    test_health()
    test_stats()
    
    # Test prediction if image provided
    if len(sys.argv) > 1:
        test_predict(sys.argv[1])
    else:
        print("\n💡 To test prediction, run: python test.py <image_path>")
    
    print("\n" + "=" * 50)
    print("✅ Tests complete!")
