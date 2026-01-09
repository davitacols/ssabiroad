import requests
import json
from pathlib import Path
from typing import List, Dict
import time
from concurrent.futures import ThreadPoolExecutor
import numpy as np

class GlobalDataCollector:
    def __init__(self, output_dir="data/global"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Major cities worldwide for initial coverage
        self.seed_locations = [
            {"name": "New York", "lat": 40.7128, "lon": -74.0060, "country": "US"},
            {"name": "London", "lat": 51.5074, "lon": -0.1278, "country": "GB"},
            {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "country": "JP"},
            {"name": "Paris", "lat": 48.8566, "lon": 2.3522, "country": "FR"},
            {"name": "Dubai", "lat": 25.2048, "lon": 55.2708, "country": "AE"},
            {"name": "Sydney", "lat": -33.8688, "lon": 151.2093, "country": "AU"},
            {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "country": "IN"},
            {"name": "São Paulo", "lat": -23.5505, "lon": -46.6333, "country": "BR"},
            {"name": "Cairo", "lat": 30.0444, "lon": 31.2357, "country": "EG"},
            {"name": "Moscow", "lat": 55.7558, "lon": 37.6173, "country": "RU"},
            {"name": "Beijing", "lat": 39.9042, "lon": 116.4074, "country": "CN"},
            {"name": "Lagos", "lat": 6.5244, "lon": 3.3792, "country": "NG"},
        ]
    
    def collect_osm_buildings(self, lat, lon, radius_km=5):
        overpass_url = "http://overpass-api.de/api/interpreter"
        
        query = f"""
        [out:json];
        (
          way["building"](around:{radius_km*1000},{lat},{lon});
          relation["building"](around:{radius_km*1000},{lat},{lon});
        );
        out center;
        """
        
        try:
            response = requests.post(overpass_url, data={"data": query}, timeout=60)
            data = response.json()
            
            buildings = []
            for element in data.get('elements', []):
                if 'center' in element:
                    buildings.append({
                        'osm_id': element['id'],
                        'lat': element['center']['lat'],
                        'lon': element['center']['lon'],
                        'tags': element.get('tags', {}),
                        'type': element['type']
                    })
            
            return buildings
        
        except Exception as e:
            print(f"Error collecting OSM data: {e}")
            return []
    
    def collect_wikimedia_images(self, lat, lon, radius_km=5):
        # Wikimedia Commons geosearch
        url = "https://commons.wikimedia.org/w/api.php"
        params = {
            'action': 'query',
            'list': 'geosearch',
            'gscoord': f"{lat}|{lon}",
            'gsradius': radius_km * 1000,
            'gslimit': 50,
            'format': 'json'
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            data = response.json()
            
            images = []
            for page in data.get('query', {}).get('geosearch', []):
                images.append({
                    'title': page['title'],
                    'lat': page['lat'],
                    'lon': page['lon'],
                    'pageid': page['pageid']
                })
            
            return images
        
        except Exception as e:
            print(f"Error collecting Wikimedia data: {e}")
            return []
    
    def collect_global_dataset(self, samples_per_city=1000):
        all_data = []
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            for location in self.seed_locations:
                print(f"Collecting data for {location['name']}...")
                
                # Collect buildings
                buildings = self.collect_osm_buildings(
                    location['lat'], 
                    location['lon'], 
                    radius_km=10
                )
                
                # Collect images
                images = self.collect_wikimedia_images(
                    location['lat'], 
                    location['lon'], 
                    radius_km=10
                )
                
                # Combine
                for building in buildings[:samples_per_city]:
                    all_data.append({
                        'lat': building['lat'],
                        'lon': building['lon'],
                        'country': location['country'],
                        'city': location['name'],
                        'source': 'osm',
                        'metadata': building['tags']
                    })
                
                time.sleep(1)  # Rate limiting
        
        # Save dataset
        output_file = self.output_dir / f"global_dataset_{len(all_data)}.json"
        with open(output_file, 'w') as f:
            json.dump(all_data, f, indent=2)
        
        print(f"Collected {len(all_data)} samples")
        print(f"Saved to {output_file}")
        
        return all_data
    
    def generate_synthetic_coverage(self, num_samples=10000):
        """Generate synthetic samples for global coverage"""
        samples = []
        
        # Sample uniformly across continents
        continents = [
            {"name": "North America", "lat_range": (15, 70), "lon_range": (-170, -50)},
            {"name": "South America", "lat_range": (-55, 12), "lon_range": (-80, -35)},
            {"name": "Europe", "lat_range": (35, 70), "lon_range": (-10, 40)},
            {"name": "Africa", "lat_range": (-35, 37), "lon_range": (-18, 52)},
            {"name": "Asia", "lat_range": (-10, 70), "lon_range": (25, 150)},
            {"name": "Oceania", "lat_range": (-50, 0), "lon_range": (110, 180)},
        ]
        
        for continent in continents:
            n = num_samples // len(continents)
            lats = np.random.uniform(continent['lat_range'][0], continent['lat_range'][1], n)
            lons = np.random.uniform(continent['lon_range'][0], continent['lon_range'][1], n)
            
            for lat, lon in zip(lats, lons):
                samples.append({
                    'lat': float(lat),
                    'lon': float(lon),
                    'continent': continent['name'],
                    'source': 'synthetic'
                })
        
        output_file = self.output_dir / f"synthetic_coverage_{num_samples}.json"
        with open(output_file, 'w') as f:
            json.dump(samples, f, indent=2)
        
        print(f"Generated {len(samples)} synthetic samples")
        return samples

if __name__ == "__main__":
    collector = GlobalDataCollector()
    
    # Collect real data
    real_data = collector.collect_global_dataset(samples_per_city=500)
    
    # Generate synthetic coverage
    synthetic_data = collector.generate_synthetic_coverage(num_samples=10000)
    
    print(f"Total dataset size: {len(real_data) + len(synthetic_data)}")
