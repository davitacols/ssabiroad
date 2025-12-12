"""Geolocation Estimation Model with Haversine Loss"""
import torch
import torch.nn as nn
import timm
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
from haversine import haversine
from typing import Tuple, Dict
from loguru import logger

class HaversineLoss(nn.Module):
    """Haversine distance loss for GPS coordinates"""
    def __init__(self):
        super().__init__()
    
    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        """pred, target: [batch, 2] (lat, lon)"""
        pred_lat, pred_lon = pred[:, 0], pred[:, 1]
        target_lat, target_lon = target[:, 0], target[:, 1]
        
        dlat = torch.abs(pred_lat - target_lat)
        dlon = torch.abs(pred_lon - target_lon)
        
        a = torch.sin(dlat/2)**2 + torch.cos(pred_lat) * torch.cos(target_lat) * torch.sin(dlon/2)**2
        c = 2 * torch.asin(torch.sqrt(a))
        return torch.mean(c * 6371)  # Earth radius in km

class GeolocationDataset(Dataset):
    def __init__(self, image_paths: list, coordinates: list, transform=None):
        self.image_paths = image_paths
        self.coordinates = np.array(coordinates, dtype=np.float32)
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img = Image.open(self.image_paths[idx]).convert('RGB')
        if self.transform:
            img = self.transform(img)
        coords = torch.tensor(self.coordinates[idx])
        return img, coords

class GeolocationModel(nn.Module):
    def __init__(self, backbone: str = "efficientnet_b0"):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=True, num_classes=0)
        num_features = self.backbone.num_features
        
        self.regressor = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 2),
            nn.Tanh()
        )
    
    def forward(self, x):
        features = self.backbone(x)
        coords = self.regressor(features)
        coords[:, 0] = coords[:, 0] * 90  # lat: [-90, 90]
        coords[:, 1] = coords[:, 1] * 180  # lon: [-180, 180]
        return coords

class GeolocationTrainer:
    def __init__(self, model: GeolocationModel, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.model = model.to(device)
        self.criterion = HaversineLoss()
        self.optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    
    def train_epoch(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0
        
        for images, coords in dataloader:
            images, coords = images.to(self.device), coords.to(self.device)
            
            self.optimizer.zero_grad()
            pred_coords = self.model(images)
            loss = self.criterion(pred_coords, coords)
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(dataloader)
    
    def validate(self, dataloader: DataLoader) -> Dict:
        self.model.eval()
        total_loss = 0
        distances = []
        
        with torch.no_grad():
            for images, coords in dataloader:
                images, coords = images.to(self.device), coords.to(self.device)
                pred_coords = self.model(images)
                loss = self.criterion(pred_coords, coords)
                total_loss += loss.item()
                
                for pred, true in zip(pred_coords.cpu().numpy(), coords.cpu().numpy()):
                    dist = haversine((pred[0], pred[1]), (true[0], true[1]))
                    distances.append(dist)
        
        return {
            "loss": total_loss / len(dataloader),
            "mean_distance_km": np.mean(distances),
            "median_distance_km": np.median(distances)
        }
    
    def predict(self, image: Image.Image, transform) -> Tuple[float, float]:
        """Predict lat/lon from image"""
        self.model.eval()
        with torch.no_grad():
            img_tensor = transform(image).unsqueeze(0).to(self.device)
            coords = self.model(img_tensor)
            return float(coords[0, 0]), float(coords[0, 1])
