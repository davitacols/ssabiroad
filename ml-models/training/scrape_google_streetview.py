"""Download Nigeria building images from Google Street View"""
import requests
import json
from pathlib import Path
import time

# Get your API key from: https://console.cloud.google.com/apis/credentials
GOOGLE_API_KEY = "AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho"

# Generate grid of coordinates across Nigeria
def generate_nigeria_grid(spacing=0.05):
    """Generate grid of coordinates covering Nigeria"""
    locations = []
    # Nigeria bounds: lat 4-14, lon 3-15
    lat = 4.0
    while lat < 14.0:
        lon = 3.0
        while lon < 15.0:
            locations.append({"lat": lat, "lon": lon, "name": f"Nigeria_{lat:.2f}_{lon:.2f}"})
            lon += spacing
        lat += spacing
    return locations

# Use grid for comprehensive coverage (2000+ locations)
NIGERIA_LOCATIONS = generate_nigeria_grid(spacing=0.5)  # 0.5 degree spacing = ~500 locations
# For more coverage, use spacing=0.1 (10,000+ locations) but costs more API calls

def download_streetview_images():
    """Download Street View images for Nigerian locations"""
    output_dir = Path("data/nigeria_streetview")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if GOOGLE_API_KEY == "YOUR_GOOGLE_API_KEY":
        print("ERROR: Please set your Google API key in the script")
        print("Get it from: https://console.cloud.google.com/apis/credentials")
        return
    
    print(f"Downloading Street View images...")
    
    for location in NIGERIA_LOCATIONS:
        for i in range(4):  # 4 directions per location
            heading = i * 90  # 0, 90, 180, 270 degrees
            
            try:
                url = f"https://maps.googleapis.com/maps/api/streetview"
                params = {
                    "size": "640x640",
                    "location": f"{location['lat']},{location['lon']}",
                    "heading": heading,
                    "pitch": 0,
                    "key": GOOGLE_API_KEY
                }
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    filename = f"{location['name'].replace(' ', '_').lower()}_{heading}"
                    img_path = output_dir / f"{filename}.jpg"
                    json_path = output_dir / f"{filename}.json"
                    
                    with open(img_path, "wb") as f:
                        f.write(response.content)
                    
                    metadata = {
                        "name": f"{location['name']} - {heading}°",
                        "latitude": location["lat"],
                        "longitude": location["lon"],
                        "heading": heading,
                        "country": "Nigeria"
                    }
                    
                    with open(json_path, "w") as f:
                        json.dump(metadata, f, indent=2)
                    
                    print(f"Downloaded {location['name']} - {heading} degrees")
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error: {e}")
    
    print(f"\nDownloaded to {output_dir}")
    print(f"Run: python training/upload_to_ec2.py")

if __name__ == "__main__":
    download_streetview_images()
