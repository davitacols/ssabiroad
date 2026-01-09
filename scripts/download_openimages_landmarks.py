#!/usr/bin/env python3
"""
Landmark-Recognition-50K from OpenImages
Downloads landmark images with working URLs
"""

import requests
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import csv

OUTPUT_DIR = Path("./landmark_data")
OUTPUT_DIR.mkdir(exist_ok=True)

class OpenImagesLandmarkDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Landmark-Recognition-50K/1.0'})
        self.downloaded = 0
        
    def download_metadata(self):
        """Download OpenImages landmark annotations"""
        print("Downloading OpenImages landmark metadata...")
        
        # OpenImages has direct Flickr URLs that work
        url = "https://storage.googleapis.com/openimages/v6/oidv6-train-annotations-human-imagelabels.csv"
        
        csv_path = OUTPUT_DIR / "openimages_labels.csv"
        
        try:
            response = self.session.get(url, stream=True, timeout=60)
            with open(csv_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Metadata downloaded: {csv_path}")
            return csv_path
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def parse_landmarks(self, csv_path, limit=50000):
        """Parse and filter landmark images"""
        print("Parsing landmark images...")
        
        landmarks = []
        landmark_classes = ['Building', 'Tower', 'Castle', 'Church', 'Temple', 
                          'Mosque', 'Lighthouse', 'Monument', 'Fountain', 'Bridge']
        
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if len(landmarks) >= limit:
                    break
                
                # Filter for landmarks with confidence 1
                if row['Confidence'] == '1' and row['LabelName'] in landmark_classes:
                    img_id = row['ImageID']
                    # OpenImages uses Flickr URLs
                    url = f"https://farm{img_id[0]}.staticflickr.com/{img_id[1:4]}/{img_id}.jpg"
                    
                    landmarks.append({
                        'id': img_id,
                        'url': url,
                        'label': row['LabelName']
                    })
                
                if len(landmarks) % 1000 == 0 and len(landmarks) > 0:
                    print(f"Found {len(landmarks)} landmarks...")
        
        print(f"Total landmarks: {len(landmarks)}")
        return landmarks
    
    def download_images(self, landmarks):
        """Download landmark images"""
        output_path = OUTPUT_DIR / 'images'
        output_path.mkdir(exist_ok=True)
        
        def download_single(landmark):
            try:
                img_id = landmark['id']
                img_path = output_path / f"{img_id}.jpg"
                
                if img_path.exists():
                    return None
                
                response = self.session.get(landmark['url'], timeout=10)
                if response.status_code == 200:
                    img_path.write_bytes(response.content)
                    
                    metadata = {
                        'id': img_id,
                        'label': landmark['label'],
                        'source': 'openimages',
                        'url': landmark['url']
                    }
                    
                    meta_path = output_path / f"{img_id}.json"
                    meta_path.write_text(json.dumps(metadata))
                    
                    self.downloaded += 1
                    return True
            except:
                return None
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            list(tqdm(executor.map(download_single, landmarks), 
                     total=len(landmarks), desc="Downloading"))
        
        print(f"Downloaded {self.downloaded} images")

def main():
    downloader = OpenImagesLandmarkDownloader()
    
    print("Building Landmark-Recognition-50K from OpenImages")
    print("=" * 60)
    
    csv_path = downloader.download_metadata()
    
    if csv_path:
        landmarks = downloader.parse_landmarks(csv_path, limit=50000)
        if landmarks:
            downloader.download_images(landmarks)
    
    print("=" * 60)
    print(f"Downloaded: {downloader.downloaded} images")
    print(f"Location: {OUTPUT_DIR.absolute()}")

if __name__ == "__main__":
    main()
