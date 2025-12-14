"""Download Street View from major Nigerian cities with known coverage"""
import requests
import json
from pathlib import Path
import time

GOOGLE_API_KEY = "AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho"

# Major cities with Street View coverage
CITIES = [
    {"name": "Lagos_VI", "lat": 6.4281, "lon": 3.4219},
    {"name": "Lagos_Ikeja", "lat": 6.6018, "lon": 3.3515},
    {"name": "Lagos_Lekki", "lat": 6.4474, "lon": 3.4739},
    {"name": "Abuja_Central", "lat": 9.0579, "lon": 7.4951},
    {"name": "Abuja_Wuse", "lat": 9.0643, "lon": 7.4892},
    {"name": "Kano_City", "lat": 12.0022, "lon": 8.5919},
    {"name": "Port_Harcourt", "lat": 4.8156, "lon": 7.0498},
    {"name": "Ibadan", "lat": 7.3775, "lon": 3.9470},
    {"name": "Benin_City", "lat": 6.3350, "lon": 5.6037},
    {"name": "Enugu", "lat": 6.4403, "lon": 7.4914},
    {"name": "Kaduna", "lat": 10.5105, "lon": 7.4165},
    {"name": "Jos", "lat": 9.8965, "lon": 8.8583},
]

# Generate points around each city
def generate_city_points(city, radius=0.05, points=20):
    """Generate points in a grid around city center"""
    locs = []
    step = radius / (points ** 0.5)
    for i in range(points):
        lat_offset = (i % int(points ** 0.5)) * step - radius/2
        lon_offset = (i // int(points ** 0.5)) * step - radius/2
        locs.append({
            "name": f"{city['name']}_{i}",
            "lat": city["lat"] + lat_offset,
            "lon": city["lon"] + lon_offset
        })
    return locs

def download_images():
    output_dir = Path("data/nigeria_cities")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    all_locations = []
    for city in CITIES:
        all_locations.extend(generate_city_points(city, radius=0.05, points=25))
    
    print(f"Downloading {len(all_locations)} locations from {len(CITIES)} cities...")
    
    for loc in all_locations:
        for heading in [0, 90, 180, 270]:
            try:
                url = "https://maps.googleapis.com/maps/api/streetview"
                params = {
                    "size": "640x640",
                    "location": f"{loc['lat']},{loc['lon']}",
                    "heading": heading,
                    "pitch": 0,
                    "key": GOOGLE_API_KEY
                }
                
                r = requests.get(url, params=params, timeout=10)
                
                if r.status_code == 200:
                    filename = f"{loc['name']}_{heading}"
                    img_path = output_dir / f"{filename}.jpg"
                    json_path = output_dir / f"{filename}.json"
                    
                    with open(img_path, "wb") as f:
                        f.write(r.content)
                    
                    meta = {
                        "name": f"{loc['name']} - {heading}°",
                        "latitude": loc["lat"],
                        "longitude": loc["lon"],
                        "heading": heading,
                        "country": "Nigeria"
                    }
                    
                    with open(json_path, "w") as f:
                        json.dump(meta, f, indent=2)
                    
                    print(f"Downloaded {loc['name']} - {heading}°")
                
                time.sleep(0.3)
                
            except Exception as e:
                print(f"Error: {e}")
    
    print(f"\nDownloaded to {output_dir}")

if __name__ == "__main__":
    download_images()
