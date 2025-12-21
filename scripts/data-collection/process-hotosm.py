import os
import time
import json
import requests
from pathlib import Path

# pip install shapefile
import shapefile

SHAPEFILE_PATH = r"D:\ssabiroad\data\hotosm_nga\hotosm_nga_buildings_polygons_shp.shp"
OUTPUT_DIR = r"D:\ssabiroad\data\hotosm_collected"
GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY')
ML_API_URL = 'http://34.224.33.158:8000/train'

SAMPLE_SIZE = 10000
DELAY = 0.1
MAX_READ = 50000  # Only read first 50K buildings, not millions

Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

def read_buildings():
    print('📂 Reading shapefile (first 50K buildings only)...')
    sf = shapefile.Reader(SHAPEFILE_PATH)
    
    buildings = []
    for i, shape in enumerate(sf.shapes()):
        if i >= MAX_READ:
            break
            
        if i % 10000 == 0:
            print(f'  Read {i:,} buildings...')
        
        # Get centroid of polygon
        points = shape.points
        if points:
            lat = sum(p[1] for p in points) / len(points)
            lng = sum(p[0] for p in points) / len(points)
            buildings.append({'lat': lat, 'lng': lng})
    
    print(f'✅ Read: {len(buildings):,} buildings\n')
    
    # Sample evenly
    step = max(1, len(buildings) // SAMPLE_SIZE)
    sampled = buildings[::step][:SAMPLE_SIZE]
    print(f'✅ Sampled: {len(sampled):,} buildings\n')
    
    return sampled

def get_streetview(lat, lng):
    url = f'https://maps.googleapis.com/maps/api/streetview?size=640x640&location={lat},{lng}&key={GOOGLE_API_KEY}'
    r = requests.get(url, timeout=10)
    if r.ok and 'image' in r.headers.get('content-type', ''):
        return r.content
    return None

def reverse_geocode(lat, lng):
    url = f'https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={GOOGLE_API_KEY}'
    r = requests.get(url, timeout=10)
    data = r.json()
    return data['results'][0]['formatted_address'] if data.get('results') else f'{lat}, {lng}'

def train_ml(image_data, lat, lng, address):
    files = {'file': ('building.jpg', image_data, 'image/jpeg')}
    data = {
        'latitude': str(lat),
        'longitude': str(lng),
        'metadata': json.dumps({
            'address': address,
            'source': 'hotosm_nigeria',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
        })
    }
    requests.post(ML_API_URL, files=files, data=data, timeout=30)

def main():
    print('🚀 HOT OSM Nigeria Collection\n')
    
    buildings = read_buildings()
    collected = 0
    failed = 0
    
    for i, b in enumerate(buildings):
        try:
            image = get_streetview(b['lat'], b['lng'])
            if not image:
                failed += 1
                continue
            
            address = reverse_geocode(b['lat'], b['lng'])
            
            filename = f"hotosm_{int(time.time())}_{collected}.jpg"
            with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
                f.write(image)
            
            train_ml(image, b['lat'], b['lng'], address)
            
            collected += 1
            print(f'✅ [{collected}/{len(buildings)}] {address[:60]}...')
            
            time.sleep(DELAY)
            
        except Exception as e:
            failed += 1
            print(f'❌ [{i}] Error: {e}')
    
    print(f'\n📊 Summary:')
    print(f'✅ Collected: {collected}')
    print(f'❌ Failed: {failed}')
    print(f'📁 Saved to: {OUTPUT_DIR}')

if __name__ == '__main__':
    main()
