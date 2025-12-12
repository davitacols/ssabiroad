"""Landmark Detection Model"""
import torch
import torch.nn as nn
import timm
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
from typing import List, Dict, Tuple
from loguru import logger

class LandmarkDataset(Dataset):
    def __init__(self, image_paths: list, labels: list, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img = Image.open(self.image_paths[idx]).convert('RGB')
        if self.transform:
            img = self.transform(img)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return img, label

class LandmarkClassifier(nn.Module):
    def __init__(self, num_classes: int, backbone: str = "efficientnet_b0"):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=True, num_classes=num_classes)
    
    def forward(self, x):
        return self.backbone(x)

class LandmarkDetector:
    def __init__(self, model_path: str = None, num_classes: int = 100, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.model = LandmarkClassifier(num_classes).to(self.device)
        self.class_names = []
        
        if model_path:
            self.load(model_path)
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader, epochs: int = 10):
        """Train landmark classifier"""
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, epochs)
        
        best_acc = 0
        for epoch in range(epochs):
            self.model.train()
            train_loss = 0
            
            for images, labels in train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
            
            val_acc = self.validate(val_loader)
            scheduler.step()
            
            logger.info(f"Epoch {epoch+1}/{epochs} - Loss: {train_loss/len(train_loader):.4f}, Val Acc: {val_acc:.4f}")
            
            if val_acc > best_acc:
                best_acc = val_acc
                self.save("models/landmark_best.pth")
    
    def validate(self, dataloader: DataLoader) -> float:
        """Validate model"""
        self.model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in dataloader:
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = self.model(images)
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        return correct / total
    
    def predict(self, image: Image.Image, transform, top_k: int = 5) -> List[Dict]:
        """Predict landmark from image"""
        self.model.eval()
        
        with torch.no_grad():
            img_tensor = transform(image).unsqueeze(0).to(self.device)
            outputs = self.model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            top_probs, top_indices = torch.topk(probs, min(top_k, probs.size(1)))
            
            results = []
            for prob, idx in zip(top_probs[0], top_indices[0]):
                results.append({
                    "class_id": int(idx),
                    "class_name": self.class_names[int(idx)] if idx < len(self.class_names) else f"Class_{idx}",
                    "confidence": float(prob)
                })
            
            return results
    
    def save(self, path: str):
        """Save model"""
        torch.save({
            'model_state': self.model.state_dict(),
            'class_names': self.class_names
        }, path)
        logger.info(f"Saved model to {path}")
    
    def load(self, path: str):
        """Load model"""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state'])
        self.class_names = checkpoint.get('class_names', [])
        logger.info(f"Loaded model from {path}")
