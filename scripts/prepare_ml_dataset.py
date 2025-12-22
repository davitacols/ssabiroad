import json
import os
from pathlib import Path
import numpy as np
from datetime import datetime

VERIFIED_PATH = Path(__file__).parent.parent / 'data' / 'verified'
ML_TRAINING_PATH = Path(__file__).parent.parent / 'data' / 'ml-training'
DAILY_COLLECTION_PATH = Path(__file__).parent.parent / 'data' / 'daily-collection'

def load_verified_data():
    """Load all verified image metadata"""
    all_data = []
    for json_file in VERIFIED_PATH.glob('verified_*.json'):
        with open(json_file, 'r') as f:
            data = json.load(f)
            all_data.extend(data)
    return all_data

def create_training_splits(data, train_ratio=0.8, val_ratio=0.1):
    """Split data into train/val/test sets"""
    np.random.shuffle(data)
    n = len(data)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    
    return {
        'train': data[:train_end],
        'val': data[train_end:val_end],
        'test': data[val_end:]
    }

def generate_labels(data):
    """Generate labels for different ML tasks"""
    location_labels = {item['location']: idx for idx, item in enumerate(
        sorted(set(d['location'] for d in data), key=str.lower)
    )}
    
    state_labels = {item['state']: idx for idx, item in enumerate(
        sorted(set(d['state'] for d in data), key=str.lower)
    )}
    
    return {
        'location_to_id': location_labels,
        'state_to_id': state_labels,
        'id_to_location': {v: k for k, v in location_labels.items()},
        'id_to_state': {v: k for k, v in state_labels.items()}
    }

def prepare_ml_dataset():
    """Prepare complete ML training dataset"""
    print("Loading verified data...")
    data = load_verified_data()
    print(f"Loaded {len(data)} verified images")
    
    print("Creating train/val/test splits...")
    splits = create_training_splits(data)
    
    print("Generating labels...")
    labels = generate_labels(data)
    
    ML_TRAINING_PATH.mkdir(parents=True, exist_ok=True)
    
    # Save splits
    for split_name, split_data in splits.items():
        output_file = ML_TRAINING_PATH / f'{split_name}_set.json'
        with open(output_file, 'w') as f:
            json.dump(split_data, f, indent=2)
        print(f"Saved {len(split_data)} samples to {split_name}_set.json")
    
    # Save labels
    labels_file = ML_TRAINING_PATH / 'labels.json'
    with open(labels_file, 'w') as f:
        json.dump(labels, f, indent=2)
    print(f"Saved labels: {len(labels['location_to_id'])} locations, {len(labels['state_to_id'])} states")
    
    # Save metadata
    metadata = {
        'created_at': datetime.now().isoformat(),
        'total_samples': len(data),
        'train_samples': len(splits['train']),
        'val_samples': len(splits['val']),
        'test_samples': len(splits['test']),
        'num_locations': len(labels['location_to_id']),
        'num_states': len(labels['state_to_id']),
        'locations': list(labels['location_to_id'].keys()),
        'states': list(labels['state_to_id'].keys())
    }
    
    metadata_file = ML_TRAINING_PATH / 'dataset_metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved dataset metadata")
    
    return metadata

def create_training_manifest():
    """Create manifest file for ML training pipeline"""
    metadata_file = ML_TRAINING_PATH / 'dataset_metadata.json'
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)
    
    manifest = {
        'dataset_name': 'nigerian_buildings_daily',
        'version': '1.0',
        'created_at': metadata['created_at'],
        'statistics': {
            'total_images': metadata['total_samples'],
            'train_images': metadata['train_samples'],
            'val_images': metadata['val_samples'],
            'test_images': metadata['test_samples']
        },
        'classes': {
            'locations': metadata['locations'],
            'states': metadata['states']
        },
        'tasks': [
            'location_classification',
            'state_classification',
            'building_detection',
            'architectural_style_recognition'
        ],
        'data_paths': {
            'images': str(DAILY_COLLECTION_PATH),
            'train_set': str(ML_TRAINING_PATH / 'train_set.json'),
            'val_set': str(ML_TRAINING_PATH / 'val_set.json'),
            'test_set': str(ML_TRAINING_PATH / 'test_set.json'),
            'labels': str(ML_TRAINING_PATH / 'labels.json')
        }
    }
    
    manifest_file = ML_TRAINING_PATH / 'training_manifest.json'
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"Created training manifest")
    
    return manifest

if __name__ == '__main__':
    print("=" * 60)
    print("Nigerian Buildings ML Dataset Preparation")
    print("=" * 60)
    
    metadata = prepare_ml_dataset()
    manifest = create_training_manifest()
    
    print("\n" + "=" * 60)
    print("Dataset Summary:")
    print(f"  Total samples: {metadata['total_samples']}")
    print(f"  Train: {metadata['train_samples']}")
    print(f"  Val: {metadata['val_samples']}")
    print(f"  Test: {metadata['test_samples']}")
    print(f"  Locations: {metadata['num_locations']}")
    print(f"  States: {metadata['num_states']}")
    print("=" * 60)
    print("\nReady for ML training!")
