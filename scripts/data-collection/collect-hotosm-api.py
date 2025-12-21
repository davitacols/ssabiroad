import os
import time
import json
import requests
from pathlib import Path

OUTPUT_DIR = r"D:\ssabiroad\data\hotosm_collected"
GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY')
ML_API_URL = 'http://34.224.33.158:8000/train'

# Major Nigerian cities with bounding boxes
CITIES = [
    {'name': 'Lagos', 'bbox': '3.1,6.4,3.6,6.7'},
    {'name': 'Abuja', 'bbox': '7.3,8.9,7.7,9.3'},
    {'name': 'Kano', 'bbox': '8.4,11.9,8.6,12.1'},
    {'name': 'Ibadan', 'bbox': '3.8,7.3,4.0,7.5'},
    {'name': 'Port Harcourt', 'bbox': '6.9,4.7,7.1,4.9'},
    {'name': 'Benin City', 'bbox': '5.5,6.3,5.7,6.4'},
    {'name': 'Kaduna', 'bbox': '7.4,10.5,7.5,10.6'},
    {'name': 'Enugu', 'bbox': '7.4,6.4,7.6,6.5'},
]

BUILDINGS_PER_CITY = 1250  # 1250 x 8 cities = 10,000 total
DELAY = 0.1

Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

def get_buildings_from_osm(bbox):
    """Get buildings from Overpass API"""
    query = f"""
    [out:json][timeout:60];
    (
      way["building"]({bbox});
    );
    out center;
    """
    
    url = 'https://overpass-api.de/api/interpreter'
    response = requests.post(url, data={'data': query}, timeout=120)
    data = response.json()
    
    buildings = []
    for element in data.get('elements', []):
        if 'center' in element:
            buildings.append({
                'lat': element['center']['lat'],
                'lng': element['center']['lon']
            })
    
    return buildings

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
            'source': 'hotosm_overpass',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
        })
    }
    requests.post(ML_API_URL, files=files, data=data, timeout=30)

def main():
    print('🚀 HOT OSM Nigeria Collection (via Overpass API)\n')
    
    total_collected = 0
    total_failed = 0
    
    for city in CITIES:
        print(f'\n📍 {city["name"]}...')
        
        try:
            buildings = get_buildings_from_osm(city['bbox'])
            print(f'  Found {len(buildings)} buildings')
            
            # Sample
            step = max(1, len(buildings) // BUILDINGS_PER_CITY)
            sampled = buildings[::step][:BUILDINGS_PER_CITY]
            
            collected = 0
            failed = 0
            
            for b in sampled:
                try:
                    image = get_streetview(b['lat'], b['lng'])
                    if not image:
                        failed += 1
                        continue
                    
                    address = reverse_geocode(b['lat'], b['lng'])
                    
                    filename = f"hotosm_{city['name']}_{int(time.time())}_{collected}.jpg"
                    with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
                        f.write(image)
                    
                    train_ml(image, b['lat'], b['lng'], address)
                    
                    collected += 1
                    total_collected += 1
                    print(f'  ✅ [{collected}/{len(sampled)}] {address[:50]}...')
                    
                    time.sleep(DELAY)
                    
                except Exception as e:
                    failed += 1
                    total_failed += 1
            
            print(f'  {city["name"]}: {collected} collected, {failed} failed')
            
        except Exception as e:
            print(f'  ❌ Error getting buildings: {e}')
    
    print(f'\n📊 Total Summary:')
    print(f'✅ Collected: {total_collected}')
    print(f'❌ Failed: {total_failed}')
    print(f'📁 Saved to: {OUTPUT_DIR}')

if __name__ == '__main__':
    main()
