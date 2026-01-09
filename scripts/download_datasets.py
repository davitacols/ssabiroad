#!/usr/bin/env python3
"""
GeoVision-10M Dataset Downloader
Downloads geotagged images from Wikimedia Commons (100% FREE)
"""

import requests
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import time

# Configuration
OUTPUT_DIR = Path("./geovision_data")
OUTPUT_DIR.mkdir(exist_ok=True)

class WikimediaDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'GeoVision-10M/1.0 (Research Project)'})
        self.downloaded = 0
        self.api_url = "https://commons.wikimedia.org/w/api.php"
        
    def search_geotagged(self, limit=10000):
        """Search for geotagged images on Wikimedia Commons"""
        print(f"Searching Wikimedia Commons for geotagged images...")
        
        images = []
        continue_token = None
        
        # Search in categories with geotagged images
        categories = [
            'Category:Images_with_coordinates',
            'Category:Photographs_by_country',
            'Category:Buildings_by_country',
            'Category:Landmarks_by_country'
        ]
        
        for category in categories:
            if len(images) >= limit:
                break
                
            print(f"Searching in {category}...")
            continue_token = None
            
            while len(images) < limit:
                try:
                    params = {
                        'action': 'query',
                        'list': 'categorymembers',
                        'cmtitle': category,
                        'cmtype': 'file',
                        'cmlimit': 500,
                        'format': 'json'
                    }
                    
                    if continue_token:
                        params['cmcontinue'] = continue_token
                    
                    response = self.session.get(self.api_url, params=params, timeout=30)
                    data = response.json()
                    
                    if 'query' not in data or 'categorymembers' not in data['query']:
                        break
                    
                    # Get file details with coordinates
                    for member in data['query']['categorymembers']:
                        if len(images) >= limit:
                            break
                            
                        file_info = self._get_file_info(member['title'])
                        if file_info:
                            images.append(file_info)
                            print(f"Found {len(images)} images...", end='\r')
                    
                    if 'continue' not in data:
                        break
                        
                    continue_token = data['continue'].get('cmcontinue')
                    time.sleep(0.5)
                    
                except Exception as e:
                    print(f"Error: {e}")
                    break
        
        print(f"\nTotal found: {len(images)} geotagged images")
        return images[:limit]
    
    def _get_file_info(self, title):
        """Get file info including coordinates"""
        try:
            params = {
                'action': 'query',
                'titles': title,
                'prop': 'imageinfo|coordinates',
                'iiprop': 'url|size',
                'iiurlwidth': 1024,
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params, timeout=10)
            data = response.json()
            
            if 'query' in data and 'pages' in data['query']:
                for page_id, page in data['query']['pages'].items():
                    if 'coordinates' in page and 'imageinfo' in page:
                        return {
                            'id': page['pageid'],
                            'title': page['title'],
                            'url': page['imageinfo'][0].get('thumburl', page['imageinfo'][0].get('url')),
                            'latitude': page['coordinates'][0]['lat'],
                            'longitude': page['coordinates'][0]['lon']
                        }
        except:
            pass
        return None
    
    def download_images(self, images):
        """Download images with metadata"""
        output_path = OUTPUT_DIR / 'wikimedia'
        output_path.mkdir(exist_ok=True)
        
        def download_single(img):
            try:
                img_id = img['id']
                img_path = output_path / f"{img_id}.jpg"
                
                if img_path.exists():
                    return None
                
                response = self.session.get(img['url'], timeout=15)
                if response.status_code == 200:
                    img_path.write_bytes(response.content)
                    
                    metadata = {
                        'id': img_id,
                        'latitude': img['latitude'],
                        'longitude': img['longitude'],
                        'source': 'wikimedia',
                        'title': img['title'],
                        'url': img['url']
                    }
                    
                    meta_path = output_path / f"{img_id}.json"
                    meta_path.write_text(json.dumps(metadata))
                    
                    self.downloaded += 1
                    return True
                    
            except Exception as e:
                return None
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            list(tqdm(executor.map(download_single, images), 
                     total=len(images), desc="Downloading images"))
        
        print(f"Downloaded {self.downloaded} images")

def main():
    downloader = WikimediaDownloader()
    
    print("Starting GeoVision-10M dataset collection...")
    print("Source: Wikimedia Commons (100% FREE)")
    print("=" * 60)
    
    images = downloader.search_geotagged(limit=1000)  # Start with 1000
    
    if images:
        downloader.download_images(images)
    else:
        print("No geotagged images found. This may be due to API limitations.")
        print("\nRECOMMENDATION: Use your crowdsourcing approach (/contribute page)")
        print("It's more reliable for building a custom dataset.")
    
    print("=" * 60)
    print(f"Total downloaded: {downloader.downloaded} images")
    print(f"Output directory: {OUTPUT_DIR.absolute()}")

if __name__ == "__main__":
    main()
