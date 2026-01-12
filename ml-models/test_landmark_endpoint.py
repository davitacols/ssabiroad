import requests
import sys

def test_landmark_endpoint():
    """Test the landmark recognition endpoint"""
    
    # Test with a sample image (you'll need to provide an actual image)
    url = "http://34.224.33.158:8000/recognize-landmark"
    
    # First, test if the endpoint exists
    try:
        response = requests.get("http://34.224.33.158:8000/landmark-stats")
        print(f"Landmark stats endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to landmark stats: {e}")
    
    # Test the main endpoint with an image
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                response = requests.post(url, files=files)
                print(f"\nLandmark recognition: {response.status_code}")
                if response.status_code == 200:
                    print(f"Response: {response.json()}")
                else:
                    print(f"Error: {response.text}")
        except Exception as e:
            print(f"Error testing landmark recognition: {e}")
    else:
        print("\nTo test landmark recognition, run:")
        print("python test_landmark_endpoint.py <path_to_image>")

if __name__ == "__main__":
    test_landmark_endpoint()
