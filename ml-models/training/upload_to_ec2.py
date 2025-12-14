"""Upload Nigeria buildings directly to EC2 ML server"""
import requests
from pathlib import Path
import json

ML_SERVER = "http://52.91.173.191:8000"

def upload_buildings():
    """Upload all buildings from data/nigeria_buildings to EC2"""
    data_dir = Path("data/nigeria_buildings")
    
    if not data_dir.exists():
        print("❌ No data found. Run: python training/scrape_nigeria_buildings.py first")
        return
    
    uploaded = 0
    for img_path in data_dir.glob("*.jpg"):
        json_path = img_path.with_suffix('.json')
        
        if not json_path.exists():
            continue
        
        try:
            with open(json_path) as f:
                metadata = json.load(f)
            
            with open(img_path, 'rb') as f:
                files = {'file': (img_path.name, f, 'image/jpeg')}
                data = {'metadata': json.dumps(metadata)}
                
                response = requests.post(f"{ML_SERVER}/add_to_index", files=files, data=data)
                
                if response.status_code == 200:
                    print(f"✅ Uploaded {metadata['name']}")
                    uploaded += 1
                else:
                    print(f"❌ Failed {metadata['name']}: {response.text}")
        
        except Exception as e:
            print(f"❌ Error with {img_path.name}: {e}")
    
    print(f"\n✅ Uploaded {uploaded} buildings to EC2")
    print(f"🔗 Check: {ML_SERVER}/stats")

if __name__ == "__main__":
    upload_buildings()
