"""Automated Data Collection Pipeline"""
import requests
from pathlib import Path
import json
from PIL import Image
import io
from typing import List, Dict
from loguru import logger
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

class DataCollector:
    def __init__(self, output_dir: str = "data/collected"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def collect_from_overpass(self, bbox: tuple, building_types: List[str] = None):
        """Collect building data from OpenStreetMap Overpass API"""
        if building_types is None:
            building_types = ["bank", "mall", "church", "mosque", "school", "hospital"]
        
        south, west, north, east = bbox
        collected = []
        
        for building_type in building_types:
            query = f"""
            [out:json][timeout:25];
            (
              node["amenity"="{building_type}"]({south},{west},{north},{east});
              way["amenity"="{building_type}"]({south},{west},{north},{east});
            );
            out center;
            """
            
            try:
                response = requests.post(
                    "https://overpass-api.de/api/interpreter",
                    data=query,
                    timeout=30
                )
                data = response.json()
                
                for element in data.get("elements", []):
                    if "lat" in element and "lon" in element:
                        collected.append({
                            "name": element.get("tags", {}).get("name", f"Unknown {building_type}"),
                            "type": building_type,
                            "latitude": element["lat"],
                            "longitude": element["lon"],
                            "osm_id": element["id"]
                        })
                
                logger.info(f"Collected {len(data.get('elements', []))} {building_type}s")
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error collecting {building_type}: {e}")
        
        return collected
    
    def download_street_view(self, lat: float, lon: float, api_key: str, heading: int = 0):
        """Download Google Street View image"""
        url = f"https://maps.googleapis.com/maps/api/streetview"
        params = {
            "size": "640x640",
            "location": f"{lat},{lon}",
            "heading": heading,
            "pitch": 0,
            "key": api_key,
            "fov": 90
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200 and len(response.content) > 1000:
                return Image.open(io.BytesIO(response.content))
        except Exception as e:
            logger.error(f"Street View download error: {e}")
        return None
    
    def collect_building_images(self, buildings: List[Dict], api_key: str = None, headings: List[int] = None):
        """Collect images for buildings"""
        if headings is None:
            headings = [0, 90, 180, 270]  # 4 angles
        
        collected_count = 0
        
        for idx, building in enumerate(buildings):
            building_dir = self.output_dir / f"building_{idx:05d}"
            building_dir.mkdir(exist_ok=True)
            
            for heading in headings:
                if api_key:
                    img = self.download_street_view(
                        building["latitude"],
                        building["longitude"],
                        api_key,
                        heading
                    )
                    
                    if img:
                        img_path = building_dir / f"view_{heading}.jpg"
                        img.save(img_path, quality=95)
                        
                        # Save metadata
                        meta_path = building_dir / f"view_{heading}.json"
                        with open(meta_path, "w") as f:
                            json.dump({
                                "latitude": building["latitude"],
                                "longitude": building["longitude"],
                                "name": building["name"],
                                "type": building.get("type"),
                                "heading": heading,
                                "osm_id": building.get("osm_id")
                            }, f, indent=2)
                        
                        collected_count += 1
                        time.sleep(0.1)  # Rate limiting
            
            if (idx + 1) % 10 == 0:
                logger.info(f"Processed {idx + 1}/{len(buildings)} buildings, {collected_count} images")
        
        logger.info(f"Collection complete: {collected_count} images from {len(buildings)} buildings")
        return collected_count
    
    def collect_from_user_uploads(self, api_url: str):
        """Collect data from user uploads via API"""
        try:
            response = requests.get(f"{api_url}/api/detections/export")
            if response.status_code == 200:
                detections = response.json()
                
                for detection in detections:
                    if detection.get("latitude") and detection.get("image_url"):
                        # Download and save
                        img_response = requests.get(detection["image_url"])
                        if img_response.status_code == 200:
                            img = Image.open(io.BytesIO(img_response.content))
                            
                            filename = f"user_{detection['id']}"
                            img.save(self.output_dir / f"{filename}.jpg")
                            
                            with open(self.output_dir / f"{filename}.json", "w") as f:
                                json.dump({
                                    "latitude": detection["latitude"],
                                    "longitude": detection["longitude"],
                                    "name": detection.get("name"),
                                    "user_id": detection.get("user_id"),
                                    "confidence": detection.get("confidence")
                                }, f, indent=2)
                
                logger.info(f"Collected {len(detections)} user uploads")
                return len(detections)
        except Exception as e:
            logger.error(f"User upload collection error: {e}")
        return 0

def collect_nigerian_cities(api_key: str = None):
    """Collect data from major Nigerian cities"""
    cities = [
        {"name": "Lagos", "bbox": (6.4, 3.2, 6.7, 3.6)},
        {"name": "Abuja", "bbox": (8.9, 7.3, 9.2, 7.6)},
        {"name": "Kano", "bbox": (11.9, 8.4, 12.1, 8.6)},
        {"name": "Ibadan", "bbox": (7.3, 3.8, 7.5, 4.0)},
        {"name": "Port Harcourt", "bbox": (4.7, 6.9, 4.9, 7.1)},
    ]
    
    collector = DataCollector()
    
    for city in cities:
        logger.info(f"Collecting data for {city['name']}...")
        buildings = collector.collect_from_overpass(city["bbox"])
        
        if api_key and buildings:
            collector.collect_building_images(buildings[:50], api_key)  # Limit per city
        
        # Save building list
        with open(f"data/collected/{city['name'].lower()}_buildings.json", "w") as f:
            json.dump(buildings, f, indent=2)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--api_key", help="Google Street View API key")
    parser.add_argument("--mode", choices=["osm", "streetview", "users"], default="osm")
    args = parser.parse_args()
    
    if args.mode == "osm":
        collect_nigerian_cities(args.api_key)
    elif args.mode == "users":
        collector = DataCollector()
        collector.collect_from_user_uploads("http://localhost:3000")
