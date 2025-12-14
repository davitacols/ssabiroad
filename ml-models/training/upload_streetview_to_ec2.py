"""Upload Nigeria Street View images to EC2 ML server"""
import requests
import json
from pathlib import Path
import base64

EC2_URL = "http://52.91.173.191:8000"

def upload_images():
    data_dir = Path("data/nigeria_streetview")
    json_files = list(data_dir.glob("*.json"))
    
    print(f"Found {len(json_files)} images to upload")
    print(f"Uploading to {EC2_URL}/add_to_index\n")
    
    success_count = 0
    error_count = 0
    
    for i, json_file in enumerate(json_files, 1):
        try:
            with open(json_file) as f:
                metadata = json.load(f)
            
            img_file = json_file.with_suffix('.jpg')
            
            if not img_file.exists():
                continue
            
            files = {'file': open(img_file, 'rb')}
            data = {'metadata': json.dumps(metadata)}
            
            response = requests.post(
                f"{EC2_URL}/add_to_index",
                files=files,
                data=data,
                timeout=30
            )
            files['file'].close()
            
            if response.status_code == 200:
                print(f"[{i}] Uploaded: {metadata['name']}")
                success_count += 1
            else:
                print(f"[{i}] Failed: {response.status_code}")
                error_count += 1
                
        except Exception as e:
            print(f"[{i}] Error: {e}")
            error_count += 1
    
    print(f"\nSuccess: {success_count}, Errors: {error_count}")
    
    # Check stats
    stats = requests.get(f"{EC2_URL}/stats").json()
    print(f"Total buildings in index: {stats.get('total_buildings', 0)}")

if __name__ == "__main__":
    upload_images()
