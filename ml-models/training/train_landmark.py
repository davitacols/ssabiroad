"""Training script for landmark classifier"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import torch
from torch.utils.data import DataLoader
from torchvision import transforms
from utils.landmark_detector import LandmarkDetector, LandmarkDataset
from loguru import logger

def load_landmark_dataset(data_dir: str):
    """Load landmark dataset from directory structure"""
    data_dir = Path(data_dir)
    image_paths = []
    labels = []
    class_names = []
    
    for class_idx, class_dir in enumerate(sorted(data_dir.iterdir())):
        if class_dir.is_dir():
            class_names.append(class_dir.name)
            for img_path in class_dir.glob("*.jpg"):
                image_paths.append(str(img_path))
                labels.append(class_idx)
    
    logger.info(f"Loaded {len(image_paths)} images from {len(class_names)} classes")
    return image_paths, labels, class_names

def train_landmark_classifier(data_dir: str, epochs: int = 15, batch_size: int = 32):
    """Train landmark classification model"""
    
    # Load data
    train_paths, train_labels, class_names = load_landmark_dataset(f"{data_dir}/train")
    val_paths, val_labels, _ = load_landmark_dataset(f"{data_dir}/val")
    
    num_classes = len(class_names)
    
    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(0.3, 0.3, 0.3),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Datasets
    train_dataset = LandmarkDataset(train_paths, train_labels, train_transform)
    val_dataset = LandmarkDataset(val_paths, val_labels, val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4)
    
    # Model
    detector = LandmarkDetector(num_classes=num_classes)
    detector.class_names = class_names
    
    # Train
    detector.train(train_loader, val_loader, epochs=epochs)
    
    logger.info("Training complete!")

if __name__ == "__main__":
    train_landmark_classifier("data/landmarks", epochs=15)
