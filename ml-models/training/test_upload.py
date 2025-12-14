"""Test uploading sample data to EC2 ML server"""
import requests
import json
from pathlib import Path

EC2_URL = "http://52.91.173.191:8000"

def test_add_building():
    """Test adding a building with sample data"""
    
    # Test data
    test_building = {
        "name": "Test Building Lagos",
        "latitude": 6.5244,
        "longitude": 3.3792,
        "image_url": "https://example.com/test.jpg"
    }
    
    print(f"Testing add building to {EC2_URL}/add_to_index")
    
    try:
        response = requests.post(
            f"{EC2_URL}/add_to_index",
            json=test_building,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\nSuccess! Now checking stats...")
            stats_response = requests.get(f"{EC2_URL}/stats")
            print(f"Stats: {stats_response.json()}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_add_building()
