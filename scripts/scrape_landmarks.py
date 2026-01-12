"""
Landmark Dataset Scraper
Scrapes landmark images and metadata from legal, public sources
"""

import requests
import json
import time
import os
from pathlib import Path
from typing import List, Dict
import hashlib

class LandmarkScraper:
    def __init__(self, output_dir="landmark_dataset"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        self.metadata_file = self.output_dir / "metadata.json"
        self.metadata = []
        
    def scrape_wikimedia_commons(self, landmark_name: str, max_images: int = 50):
        """Scrape images from Wikimedia Commons (Public Domain/CC Licensed)"""
        print(f"Scraping Wikimedia Commons for: {landmark_name}")
        
        # Search for images
        search_url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"{landmark_name} landmark",
            "gsrnamespace": "6",  # File namespace
            "gsrlimit": max_images,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size",
            "iiurlwidth": 1024
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if "query" not in data or "pages" not in data["query"]:
            print(f"No images found for {landmark_name}")
            return []
        
        images = []
        for page_id, page in data["query"]["pages"].items():
            if "imageinfo" not in page:
                continue
                
            info = page["imageinfo"][0]
            
            # Extract metadata
            extmeta = info.get("extmetadata", {})
            
            image_data = {
                "landmark_name": landmark_name,
                "source": "wikimedia_commons",
                "url": info.get("url"),
                "thumb_url": info.get("thumburl"),
                "width": info.get("width"),
                "height": info.get("height"),
                "license": extmeta.get("LicenseShortName", {}).get("value", "Unknown"),
                "author": extmeta.get("Artist", {}).get("value", "Unknown"),
                "description": extmeta.get("ImageDescription", {}).get("value", ""),
                "gps_latitude": extmeta.get("GPSLatitude", {}).get("value"),
                "gps_longitude": extmeta.get("GPSLongitude", {}).get("value"),
            }
            
            images.append(image_data)
            
        print(f"Found {len(images)} images from Wikimedia Commons")
        return images
    
    def scrape_pexels(self, landmark_name: str, api_key: str, max_images: int = 50):
        """Scrape free images from Pexels (No premium required)"""
        print(f"Scraping Pexels for: {landmark_name}")
        
        search_url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": api_key}
        params = {
            "query": f"{landmark_name} landmark",
            "per_page": max_images,
            "orientation": "landscape"
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        data = response.json()
        
        if "photos" not in data:
            print(f"No Pexels images found for {landmark_name}")
            return []
        
        images = []
        for photo in data["photos"]:
            image_data = {
                "landmark_name": landmark_name,
                "source": "pexels",
                "url": photo["src"]["large2x"],
                "original_url": photo["src"]["original"],
                "photographer": photo["photographer"],
                "photographer_url": photo["photographer_url"],
                "license": "Pexels License (Free to use)",
                "pexels_id": photo["id"]
            }
            images.append(image_data)
        
        print(f"Found {len(images)} images from Pexels")
        return images
    
    def scrape_unsplash(self, landmark_name: str, access_key: str, max_images: int = 30):
        """Scrape free-to-use images from Unsplash"""
        print(f"Scraping Unsplash for: {landmark_name}")
        
        search_url = "https://api.unsplash.com/search/photos"
        headers = {"Authorization": f"Client-ID {access_key}"}
        params = {
            "query": f"{landmark_name} landmark",
            "per_page": max_images,
            "orientation": "landscape"
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        data = response.json()
        
        if "results" not in data:
            print(f"No Unsplash images found for {landmark_name}")
            return []
        
        images = []
        for photo in data["results"]:
            location = photo.get("location", {})
            
            image_data = {
                "landmark_name": landmark_name,
                "source": "unsplash",
                "url": photo["urls"]["regular"],
                "full_url": photo["urls"]["full"],
                "latitude": location.get("position", {}).get("latitude"),
                "longitude": location.get("position", {}).get("longitude"),
                "location_name": location.get("name"),
                "author": photo["user"]["name"],
                "author_url": photo["user"]["links"]["html"],
                "license": "Unsplash License (Free to use)",
                "description": photo.get("description") or photo.get("alt_description", "")
            }
            
            images.append(image_data)
        
        print(f"Found {len(images)} images from Unsplash")
        return images
    
    def scrape_google_landmarks_dataset(self):
        """Download Google Landmarks Dataset v2 (Open Source)"""
        print("Downloading Google Landmarks Dataset v2 metadata...")
        
        # Google Landmarks Dataset v2 is open source
        base_url = "https://s3.amazonaws.com/google-landmark"
        
        # Download train/test CSV files
        files = [
            "train.csv",
            "test.csv"
        ]
        
        for filename in files:
            url = f"{base_url}/{filename}"
            output_path = self.output_dir / filename
            
            print(f"Downloading {filename}...")
            response = requests.get(url, stream=True)
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded {filename}")
        
        return True
    
    def download_image(self, url: str, landmark_name: str, index: int) -> str:
        """Download image and save to disk"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Generate filename
            safe_name = "".join(c for c in landmark_name if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')
            
            # Get file extension
            ext = url.split('.')[-1].split('?')[0]
            if ext not in ['jpg', 'jpeg', 'png']:
                ext = 'jpg'
            
            filename = f"{safe_name}_{index:04d}.{ext}"
            filepath = self.images_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return str(filepath)
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return None
    
    def scrape_landmark(self, landmark_name: str, latitude: float = None, longitude: float = None,
                       flickr_key: str = None, unsplash_key: str = None):
        """Scrape all sources for a landmark"""
        print(f"\n{'='*60}")
        print(f"Scraping: {landmark_name}")
        print(f"{'='*60}")
        
        all_images = []
        
        # Wikimedia Commons (no API key needed)
        all_images.extend(self.scrape_wikimedia_commons(landmark_name, max_images=30))
        time.sleep(1)  # Rate limiting
        
        # Pexels (if API key provided)
        if flickr_key:  # Reuse flickr_key param for pexels
            all_images.extend(self.scrape_pexels(landmark_name, flickr_key, max_images=30))
            time.sleep(1)
        
        # Unsplash (if API key provided)
        if unsplash_key:
            all_images.extend(self.scrape_unsplash(landmark_name, unsplash_key, max_images=20))
            time.sleep(1)
        
        # Download images
        print(f"\nDownloading {len(all_images)} images...")
        for i, img_data in enumerate(all_images):
            if img_data.get("url"):
                filepath = self.download_image(img_data["url"], landmark_name, i)
                if filepath:
                    img_data["local_path"] = filepath
                    img_data["latitude"] = img_data.get("latitude") or latitude
                    img_data["longitude"] = img_data.get("longitude") or longitude
                    self.metadata.append(img_data)
                time.sleep(0.5)  # Rate limiting
        
        # Save metadata
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        print(f"✓ Scraped {len(all_images)} images for {landmark_name}")
        return len(all_images)

# Top 100 landmarks to scrape
TOP_LANDMARKS = [
    {"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945, "country": "France"},
    {"name": "Statue of Liberty", "lat": 40.6892, "lng": -74.0445, "country": "USA"},
    {"name": "Taj Mahal", "lat": 27.1751, "lng": 78.0421, "country": "India"},
    {"name": "Great Wall of China", "lat": 40.4319, "lng": 116.5704, "country": "China"},
    {"name": "Colosseum", "lat": 41.8902, "lng": 12.4922, "country": "Italy"},
    {"name": "Big Ben", "lat": 51.5007, "lng": -0.1246, "country": "UK"},
    {"name": "Sydney Opera House", "lat": -33.8568, "lng": 151.2153, "country": "Australia"},
    {"name": "Machu Picchu", "lat": -13.1631, "lng": -72.5450, "country": "Peru"},
    {"name": "Christ the Redeemer", "lat": -22.9519, "lng": -43.2105, "country": "Brazil"},
    {"name": "Pyramids of Giza", "lat": 29.9792, "lng": 31.1342, "country": "Egypt"},
    # Add 90 more landmarks...
]

if __name__ == "__main__":
    # Initialize scraper
    scraper = LandmarkScraper(output_dir="landmark_dataset")
    
    # API keys (optional but recommended)
    PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")  # Get from https://www.pexels.com/api/ (FREE)
    UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")  # Get from https://unsplash.com/developers
    
    # Scrape top landmarks
    total_images = 0
    for landmark in TOP_LANDMARKS[:10]:  # Start with first 10
        count = scraper.scrape_landmark(
            landmark["name"],
            latitude=landmark["lat"],
            longitude=landmark["lng"],
            flickr_key=PEXELS_API_KEY,
            unsplash_key=UNSPLASH_ACCESS_KEY
        )
        total_images += count
        time.sleep(2)  # Rate limiting between landmarks
    
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETE")
    print(f"Total images collected: {total_images}")
    print(f"Metadata saved to: {scraper.metadata_file}")
    print(f"Images saved to: {scraper.images_dir}")
    print(f"{'='*60}")
