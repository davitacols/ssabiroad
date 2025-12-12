"""Training script for geolocation model"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import torch
from torch.utils.data import DataLoader
from torchvision import transforms
from utils.geolocation_model import GeolocationModel, GeolocationDataset, GeolocationTrainer
from loguru import logger
import json

def load_dataset(data_dir: str):
    """Load image paths and coordinates from directory"""
    data_dir = Path(data_dir)
    image_paths = []
    coordinates = []
    
    for img_path in data_dir.glob("**/*.jpg"):
        json_path = img_path.with_suffix('.json')
        if json_path.exists():
            with open(json_path) as f:
                data = json.load(f)
                image_paths.append(str(img_path))
                coordinates.append([data['latitude'], data['longitude']])
    
    logger.info(f"Loaded {len(image_paths)} images with GPS data")
    return image_paths, coordinates

def train_geolocation_model(data_dir: str, epochs: int = 20, batch_size: int = 32):
    """Train geolocation estimation model"""
    
    # Load data
    train_paths, train_coords = load_dataset(f"{data_dir}/train")
    val_paths, val_coords = load_dataset(f"{data_dir}/val")
    
    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Datasets
    train_dataset = GeolocationDataset(train_paths, train_coords, train_transform)
    val_dataset = GeolocationDataset(val_paths, val_coords, val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4)
    
    # Model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = GeolocationModel(backbone="efficientnet_b0")
    trainer = GeolocationTrainer(model, device)
    
    # Training loop
    best_distance = float('inf')
    
    for epoch in range(epochs):
        train_loss = trainer.train_epoch(train_loader)
        val_metrics = trainer.validate(val_loader)
        
        logger.info(f"Epoch {epoch+1}/{epochs}")
        logger.info(f"  Train Loss: {train_loss:.4f}")
        logger.info(f"  Val Loss: {val_metrics['loss']:.4f}")
        logger.info(f"  Mean Distance: {val_metrics['mean_distance_km']:.2f} km")
        logger.info(f"  Median Distance: {val_metrics['median_distance_km']:.2f} km")
        
        if val_metrics['mean_distance_km'] < best_distance:
            best_distance = val_metrics['mean_distance_km']
            torch.save(model.state_dict(), "models/geolocation_best.pth")
            logger.info(f"  Saved best model!")
    
    logger.info(f"Training complete. Best mean distance: {best_distance:.2f} km")

if __name__ == "__main__":
    train_geolocation_model("data/geolocations", epochs=20)
