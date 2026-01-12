"""
Download landmark images from existing metadata
Processes 2.8M metadata entries and downloads images
"""

import pandas as pd
import requests
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from tqdm import tqdm
import hashlib

class MetadataDownloader:
    def __init__(self, metadata_file, output_dir="landmark_dataset", max_workers=10):
        self.metadata_file = metadata_file
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        self.max_workers = max_workers
        self.failed_log = self.output_dir / "failed_downloads.txt"
        self.success_log = self.output_dir / "downloaded.txt"
        
    def load_metadata(self, limit=None):
        """Load metadata CSV"""
        print(f"Loading metadata from {self.metadata_file}...")
        
        # Try different formats
        try:
            df = pd.read_csv(self.metadata_file, nrows=limit)
        except:
            df = pd.read_json(self.metadata_file, lines=True, nrows=limit)
        
        print(f"Loaded {len(df)} entries")
        return df
    
    def filter_top_landmarks(self, df, top_n=1000):
        """Filter for most common landmarks"""
        print(f"Filtering top {top_n} landmarks...")
        
        if 'landmark_id' in df.columns:
            landmark_counts = df['landmark_id'].value_counts()
            top_landmarks = landmark_counts.head(top_n).index
            df_filtered = df[df['landmark_id'].isin(top_landmarks)]
        elif 'landmark_name' in df.columns:
            landmark_counts = df['landmark_name'].value_counts()
            top_landmarks = landmark_counts.head(top_n).index
            df_filtered = df[df['landmark_name'].isin(top_landmarks)]
        else:
            df_filtered = df.head(50000)  # Just take first 50K
        
        print(f"Filtered to {len(df_filtered)} images from top landmarks")
        return df_filtered
    
    def download_image(self, row):
        """Download single image"""
        try:
            # Get URL from various possible column names
            url = row.get('url') or row.get('image_url') or row.get('src')
            if not url or pd.isna(url):
                return None, "No URL"
            
            # Get landmark info
            landmark_id = row.get('landmark_id', 'unknown')
            landmark_name = row.get('landmark_name', f'landmark_{landmark_id}')
            image_id = row.get('id', hashlib.md5(url.encode()).hexdigest()[:12])
            
            # Create landmark directory
            safe_name = "".join(c for c in str(landmark_name) if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')[:50]
            landmark_dir = self.images_dir / safe_name
            landmark_dir.mkdir(exist_ok=True)
            
            # Download image
            response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            
            # Save image
            ext = url.split('.')[-1].split('?')[0]
            if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                ext = 'jpg'
            
            filename = f"{image_id}.{ext}"
            filepath = landmark_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # Save metadata
            metadata = {
                'filepath': str(filepath),
                'landmark_id': landmark_id,
                'landmark_name': landmark_name,
                'latitude': row.get('latitude'),
                'longitude': row.get('longitude'),
                'url': url
            }
            
            return metadata, None
            
        except Exception as e:
            return None, str(e)
    
    def download_batch(self, df, max_images=50000):
        """Download images in parallel"""
        print(f"\nDownloading {min(len(df), max_images)} images with {self.max_workers} workers...")
        
        downloaded = []
        failed = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.download_image, row): idx 
                      for idx, row in df.head(max_images).iterrows()}
            
            with tqdm(total=len(futures), desc="Downloading") as pbar:
                for future in as_completed(futures):
                    metadata, error = future.result()
                    
                    if metadata:
                        downloaded.append(metadata)
                        with open(self.success_log, 'a') as f:
                            f.write(f"{metadata['filepath']}\n")
                    else:
                        failed.append({'index': futures[future], 'error': error})
                        with open(self.failed_log, 'a') as f:
                            f.write(f"{futures[future]}: {error}\n")
                    
                    pbar.update(1)
                    pbar.set_postfix({'success': len(downloaded), 'failed': len(failed)})
        
        return downloaded, failed
    
    def save_results(self, downloaded):
        """Save download results"""
        results_file = self.output_dir / "download_results.json"
        
        df_results = pd.DataFrame(downloaded)
        df_results.to_json(results_file, orient='records', lines=True)
        
        print(f"\nResults saved to {results_file}")
        
        # Print summary by landmark
        if 'landmark_name' in df_results.columns:
            summary = df_results.groupby('landmark_name').size().sort_values(ascending=False)
            print("\nTop 20 landmarks by image count:")
            print(summary.head(20))

def main():
    # Configuration
    METADATA_FILE = "scripts/landmark_data/landmarks_metadata.csv"  # Your metadata file
    OUTPUT_DIR = "landmark_dataset"
    MAX_IMAGES = 50000  # Download 50K images
    TOP_LANDMARKS = 1000  # Focus on top 1000 landmarks
    MAX_WORKERS = 20  # Parallel downloads
    
    # Initialize downloader
    downloader = MetadataDownloader(
        metadata_file=METADATA_FILE,
        output_dir=OUTPUT_DIR,
        max_workers=MAX_WORKERS
    )
    
    # Load metadata
    df = downloader.load_metadata()
    
    print(f"\nTotal metadata entries: {len(df):,}")
    
    # Filter for top landmarks
    df_filtered = downloader.filter_top_landmarks(df, top_n=TOP_LANDMARKS)
    
    # Download images
    downloaded, failed = downloader.download_batch(df_filtered, max_images=MAX_IMAGES)
    
    # Save results
    downloader.save_results(downloaded)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"DOWNLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"Total attempted: {len(downloaded) + len(failed):,}")
    print(f"Successfully downloaded: {len(downloaded):,}")
    print(f"Failed: {len(failed):,}")
    print(f"Success rate: {len(downloaded)/(len(downloaded)+len(failed))*100:.1f}%")
    print(f"\nImages saved to: {downloader.images_dir}")
    print(f"Failed downloads logged to: {downloader.failed_log}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
