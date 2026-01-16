import requests

# Test health endpoint
print("Testing /health endpoint...")
response = requests.get("https://ssabiroad.onrender.com/health")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test with a sample image
print("Testing /predict endpoint...")
with open("test-image.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("https://ssabiroad.onrender.com/predict", files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
