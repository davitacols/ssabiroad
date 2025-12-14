"""Scrape Nigeria building data for training"""
import requests
import json
from pathlib import Path
import time

# Famous Nigerian landmarks and buildings
NIGERIA_BUILDINGS = [
    {"name": "National Mosque Abuja", "lat": 9.0579, "lon": 7.4951, "city": "Abuja"},
    {"name": "Aso Rock", "lat": 9.0643, "lon": 7.4892, "city": "Abuja"},
    {"name": "National Stadium Lagos", "lat": 6.4698, "lon": 3.3792, "city": "Lagos"},
    {"name": "Lekki Conservation Centre", "lat": 6.4474, "lon": 3.5080, "city": "Lagos"},
    {"name": "Eko Atlantic", "lat": 6.4167, "lon": 3.4000, "city": "Lagos"},
    {"name": "Third Mainland Bridge", "lat": 6.4698, "lon": 3.3792, "city": "Lagos"},
    {"name": "National Theatre Lagos", "lat": 6.4698, "lon": 3.3792, "city": "Lagos"},
    {"name": "Zuma Rock", "lat": 9.1333, "lon": 7.2167, "city": "Niger State"},
    {"name": "Kano City Wall", "lat": 12.0022, "lon": 8.5919, "city": "Kano"},
    {"name": "Ibadan Cocoa House", "lat": 7.3775, "lon": 3.9470, "city": "Ibadan"},
    {"name": "Port Harcourt Pleasure Park", "lat": 4.8156, "lon": 7.0498, "city": "Port Harcourt"},
    {"name": "Calabar Drill Ranch", "lat": 4.9517, "lon": 8.3417, "city": "Calabar"},
    {"name": "Yankari National Park", "lat": 9.7500, "lon": 10.5000, "city": "Bauchi"},
    {"name": "Millennium Park Abuja", "lat": 9.0765, "lon": 7.4986, "city": "Abuja"},
    {"name": "Jabi Lake Mall", "lat": 9.0765, "lon": 7.4986, "city": "Abuja"},
]

def download_building_images():
    """Download images from Wikimedia Commons"""
    output_dir = Path("data/nigeria_buildings")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📥 Downloading {len(NIGERIA_BUILDINGS)} Nigerian buildings...")
    
    for building in NIGERIA_BUILDINGS:
        try:
            # Search Wikimedia Commons
            search_url = f"https://commons.wikimedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": building["name"],
                "srnamespace": "6",
                "srlimit": "1"
            }
            
            response = requests.get(search_url, params=params, timeout=10)
            data = response.json()
            
            if not data.get("query", {}).get("search"):
                print(f"❌ No image found for {building['name']}")
                continue
            
            # Get image URL
            title = data["query"]["search"][0]["title"]
            image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{title.replace('File:', '')}"
            
            # Download image
            img_response = requests.get(image_url, timeout=10)
            if img_response.status_code == 200:
                filename = building["name"].replace(" ", "_").lower()
                img_path = output_dir / f"{filename}.jpg"
                json_path = output_dir / f"{filename}.json"
                
                with open(img_path, "wb") as f:
                    f.write(img_response.content)
                
                # Save metadata
                metadata = {
                    "name": building["name"],
                    "latitude": building["lat"],
                    "longitude": building["lon"],
                    "city": building["city"],
                    "country": "Nigeria"
                }
                
                with open(json_path, "w") as f:
                    json.dump(metadata, f, indent=2)
                
                print(f"✅ Downloaded {building['name']}")
            
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"❌ Error with {building['name']}: {e}")
    
    print(f"\n✅ Downloaded to {output_dir}")
    print(f"📊 Run: python training/build_faiss_index.py")

if __name__ == "__main__":
    download_building_images()
