"""
Google Landmarks Dataset v2 - Metadata and Sample Downloader
Downloads metadata files and a sample of training images for landmark recognition
"""

import os
import requests
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import tarfile
import hashlib

BASE_URL = "https://s3.amazonaws.com/google-landmark"
DATA_DIR = Path("data/google-landmarks-v2")
METADATA_DIR = DATA_DIR / "metadata"
TRAIN_DIR = DATA_DIR / "train"
INDEX_DIR = DATA_DIR / "index"

# Create directories
METADATA_DIR.mkdir(parents=True, exist_ok=True)
TRAIN_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url, dest_path):
    """Download file with progress bar"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(dest_path, 'wb') as f, tqdm(
        desc=dest_path.name,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as pbar:
        for data in response.iter_content(chunk_size=1024):
            size = f.write(data)
            pbar.update(size)

def download_metadata():
    """Download all metadata files"""
    print("Downloading metadata files...")
    
    metadata_files = [
        "train.csv",
        "train_clean.csv",
        "train_attribution.csv",
        "train_label_to_category.csv",
        "train_label_to_hierarchical.csv",
        "index.csv",
        "index_image_to_landmark.csv",
        "index_label_to_category.csv",
        "index_label_to_hierarchical.csv",
        "test.csv",
    ]
    
    for filename in metadata_files:
        url = f"{BASE_URL}/metadata/{filename}"
        dest = METADATA_DIR / filename
        
        if dest.exists():
            print(f"✓ {filename} already exists")
            continue
            
        print(f"Downloading {filename}...")
        try:
            download_file(url, dest)
            print(f"✓ Downloaded {filename}")
        except Exception as e:
            print(f"✗ Failed to download {filename}: {e}")

def download_ground_truth():
    """Download ground truth files"""
    print("\nDownloading ground truth files...")
    
    gt_files = [
        "recognition_solution_v2.1.csv",
        "retrieval_solution_v2.1.csv",
    ]
    
    for filename in gt_files:
        url = f"{BASE_URL}/ground_truth/{filename}"
        dest = METADATA_DIR / filename
        
        if dest.exists():
            print(f"✓ {filename} already exists")
            continue
            
        print(f"Downloading {filename}...")
        try:
            download_file(url, dest)
            print(f"✓ Downloaded {filename}")
        except Exception as e:
            print(f"✗ Failed to download {filename}: {e}")

def download_sample_images(num_files=5):
    """Download first N tar files from train set"""
    print(f"\nDownloading sample training images ({num_files} files)...")
    
    for i in range(num_files):
        file_num = f"{i:03d}"
        tar_file = f"images_{file_num}.tar"
        url = f"{BASE_URL}/train/{tar_file}"
        dest = TRAIN_DIR / tar_file
        
        if dest.exists():
            print(f"✓ {tar_file} already exists")
            continue
        
        print(f"Downloading {tar_file}...")
        try:
            download_file(url, dest)
            
            # Extract tar file
            print(f"Extracting {tar_file}...")
            with tarfile.open(dest, 'r') as tar:
                tar.extractall(path=TRAIN_DIR)
            
            # Remove tar file to save space
            dest.unlink()
            print(f"✓ Extracted and removed {tar_file}")
            
        except Exception as e:
            print(f"✗ Failed to download {tar_file}: {e}")

def analyze_metadata():
    """Analyze downloaded metadata"""
    print("\n" + "="*50)
    print("METADATA ANALYSIS")
    print("="*50)
    
    # Train metadata
    train_csv = METADATA_DIR / "train.csv"
    if train_csv.exists():
        df = pd.read_csv(train_csv)
        print(f"\nTrain Set:")
        print(f"  Total images: {len(df):,}")
        print(f"  Unique landmarks: {df['landmark_id'].nunique():,}")
        print(f"  Columns: {list(df.columns)}")
    
    # Hierarchical labels
    hier_csv = METADATA_DIR / "train_label_to_hierarchical.csv"
    if hier_csv.exists():
        df = pd.read_csv(hier_csv)
        print(f"\nHierarchical Labels:")
        print(f"  Total landmarks: {len(df):,}")
        if 'natural_or_human_made' in df.columns:
            print(f"  Natural: {(df['natural_or_human_made'] == 'natural').sum():,}")
            print(f"  Human-made: {(df['natural_or_human_made'] == 'human-made').sum():,}")
    
    # Index metadata
    index_csv = METADATA_DIR / "index.csv"
    if index_csv.exists():
        df = pd.read_csv(index_csv)
        print(f"\nIndex Set:")
        print(f"  Total images: {len(df):,}")

def main():
    print("Google Landmarks Dataset v2 - Downloader")
    print("="*50)
    
    # Download metadata
    download_metadata()
    
    # Download ground truth
    download_ground_truth()
    
    # Download sample images (first 5 tar files = ~5GB)
    download_sample_images(num_files=5)
    
    # Analyze metadata
    analyze_metadata()
    
    print("\n" + "="*50)
    print("Download complete!")
    print(f"Data saved to: {DATA_DIR.absolute()}")
    print("="*50)

if __name__ == "__main__":
    main()
