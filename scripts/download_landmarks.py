#!/usr/bin/env python3
"""
Landmark-Recognition-50K Dataset Builder
Downloads landmark images from Google Landmarks Dataset v2
"""

import requests
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import csv
import time

OUTPUT_DIR = Path("./landmark_data")
OUTPUT_DIR.mkdir(exist_ok=True)

class LandmarkDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Landmark-Recognition-50K/1.0'})
        self.downloaded = 0
        
    def download_metadata(self):
        """Use existing downloaded metadata"""
        csv_path = OUTPUT_DIR / "landmarks_metadata.csv"
        
        if csv_path.exists():
            print(f"Using existing metadata: {csv_path}")
            return csv_path
        else:
            print("ERROR: Metadata file not found!")
            print(f"Expected location: {csv_path}")
            return None
    
    def parse_metadata(self, csv_path, limit=50000):
        """Parse CSV and extract landmark info with URLs"""
        print(f"Parsing metadata (limit: {limit})...")
        
        landmarks = []
        
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= limit:
                    break
                
                # Build image URL from ID
                img_id = row['id']
                url = f"https://s3.amazonaws.com/google-landmark/train/{img_id}.jpg"
                    
                landmarks.append({
                    'id': img_id,
                    'url': url,
                    'landmark_id': row.get('landmark_id', ''),
                })
                
                if (i + 1) % 10000 == 0:
                    print(f"Parsed {i + 1} landmarks...")
        
        print(f"Total parsed: {len(landmarks)} landmarks")
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
                
                response = self.session.get(landmark['url'], timeout=15)
                if response.status_code == 200:
                    img_path.write_bytes(response.content)
                    
                    # Save metadata
                    metadata = {
                        'id': img_id,
                        'landmark_id': landmark['landmark_id'],
                        'source': 'google_landmarks_v2',
                        'url': landmark['url']
                    }
                    
                    meta_path = output_path / f"{img_id}.json"
                    meta_path.write_text(json.dumps(metadata))
                    
                    self.downloaded += 1
                    return True
                    
            except Exception as e:
                return None
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            list(tqdm(executor.map(download_single, landmarks), 
                     total=len(landmarks), desc="Downloading landmarks"))
        
        print(f"Downloaded {self.downloaded} landmark images")

def main():
    downloader = LandmarkDownloader()
    
    print("Building Landmark-Recognition-50K Dataset")
    print("=" * 60)
    
    # Download metadata
    csv_path = downloader.download_metadata()
    
    if not csv_path:
        print("Failed to download metadata")
        return
    
    # Parse metadata
    landmarks = downloader.parse_metadata(csv_path, limit=50000)
    
    # Download images
    if landmarks:
        downloader.download_images(landmarks)
    
    print("=" * 60)
    print(f"Total downloaded: {downloader.downloaded} images")
    print(f"Output directory: {OUTPUT_DIR.absolute()}")

if __name__ == "__main__":
    main()
