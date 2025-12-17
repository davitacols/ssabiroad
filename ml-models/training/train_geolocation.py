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

def train_geolocation_model(data_dir: str, epochs: int = 20, batch_size: int = 32, model_version: str = None):
    """Train geolocation estimation model"""
    
    if model_version is None:
        from datetime import datetime
        model_version = datetime.now().strftime("%Y%m%d_%H%M%S")
    
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
    
    # Learning rate scheduler
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(trainer.optimizer, T_max=epochs)
    
    # Training loop
    best_distance = float('inf')
    history = []
    
    for epoch in range(epochs):
        train_loss = trainer.train_epoch(train_loader)
        val_metrics = trainer.validate(val_loader)
        scheduler.step()
        
        logger.info(f"Epoch {epoch+1}/{epochs} | LR: {scheduler.get_last_lr()[0]:.6f}")
        logger.info(f"  Train Loss: {train_loss:.4f}")
        logger.info(f"  Val Loss: {val_metrics['loss']:.4f}")
        logger.info(f"  Mean Distance: {val_metrics['mean_distance_km']:.2f} km")
        logger.info(f"  Median Distance: {val_metrics['median_distance_km']:.2f} km")
        logger.info(f"  Acc@1km: {val_metrics['accuracy_1km']:.2%} | Acc@5km: {val_metrics['accuracy_5km']:.2%} | Acc@25km: {val_metrics['accuracy_25km']:.2%}")
        
        history.append({"epoch": epoch+1, "train_loss": train_loss, **val_metrics})
        
        if val_metrics['mean_distance_km'] < best_distance:
            best_distance = val_metrics['mean_distance_km']
            Path("models").mkdir(exist_ok=True)
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': trainer.optimizer.state_dict(),
                'epoch': epoch,
                'metrics': val_metrics,
                'version': model_version
            }, f"models/geolocation_{model_version}_best.pth")
            logger.info(f"  ✅ Saved best model!")
    
    # Save final model and history
    torch.save(model.state_dict(), f"models/geolocation_{model_version}_final.pth")
    import json
    with open(f"models/geolocation_{model_version}_history.json", "w") as f:
        json.dump(history, f, indent=2)
    
    logger.info(f"Training complete. Best mean distance: {best_distance:.2f} km")
    logger.info(f"Model version: {model_version}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="data/geolocations")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--version", default=None)
    args = parser.parse_args()
    
    train_geolocation_model(args.data_dir, args.epochs, args.batch_size, args.version)
