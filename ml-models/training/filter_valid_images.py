"""Filter out invalid Street View images and get addresses"""
import requests
import json
from pathlib import Path
from PIL import Image
import numpy as np

GOOGLE_API_KEY = "AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho"

def is_valid_image(img_path):
    """Check if image has actual content (not 'no imagery' placeholder)"""
    try:
        img = Image.open(img_path)
        arr = np.array(img)
        # Check if image is mostly gray/uniform (placeholder)
        std = arr.std()
        return std > 20  # Valid images have more variation
    except:
        return False

def get_address(lat, lon):
    """Get address from coordinates"""
    url = f"https://maps.googleapis.com/maps/api/geocode/json"
    params = {"latlng": f"{lat},{lon}", "key": GOOGLE_API_KEY}
    try:
        r = requests.get(url, params=params, timeout=5)
        data = r.json()
        if data.get("results"):
            return data["results"][0]["formatted_address"]
    except:
        pass
    return "Unknown"

def filter_images():
    data_dir = Path("data/nigeria_cities")
    output_dir = Path("data/nigeria_cities_valid")
    output_dir.mkdir(exist_ok=True)
    
    json_files = list(data_dir.glob("*.json"))
    valid = 0
    invalid = 0
    
    print(f"Checking {len(json_files)} images...")
    
    for json_file in json_files:
        img_file = json_file.with_suffix('.jpg')
        
        if not img_file.exists():
            continue
            
        if is_valid_image(img_file):
            with open(json_file) as f:
                meta = json.load(f)
            
            address = get_address(meta["latitude"], meta["longitude"])
            meta["address"] = address
            
            # Copy to valid folder
            import shutil
            shutil.copy(img_file, output_dir / img_file.name)
            with open(output_dir / json_file.name, 'w') as f:
                json.dump(meta, f, indent=2)
            
            print(f"Valid: {meta['name']} - {address}")
            valid += 1
        else:
            invalid += 1
    
    print(f"\nValid: {valid}, Invalid: {invalid}")
    print(f"Saved to {output_dir}")

if __name__ == "__main__":
    filter_images()
