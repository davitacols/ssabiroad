"""Improved Landmark Classifier Training with Focal Loss"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
import timm
from PIL import Image
from loguru import logger
from datetime import datetime
import json

class FocalLoss(nn.Module):
    """Focal Loss for handling class imbalance"""
    def __init__(self, alpha=1, gamma=2):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        
    def forward(self, inputs, targets):
        ce_loss = nn.CrossEntropyLoss(reduction='none')(inputs, targets)
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss.mean()

class LandmarkDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.samples = []
        self.classes = sorted([d.name for d in self.root_dir.iterdir() if d.is_dir()])
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        
        for class_name in self.classes:
            class_dir = self.root_dir / class_name
            for img_path in class_dir.glob("*.jpg"):
                self.samples.append((str(img_path), self.class_to_idx[class_name]))
        
        logger.info(f"Loaded {len(self.samples)} images from {len(self.classes)} classes")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, label

class LandmarkClassifier(nn.Module):
    def __init__(self, num_classes, backbone="efficientnet_b0", pretrained=True):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=pretrained, num_classes=0)
        num_features = self.backbone.num_features
        
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        features = self.backbone(x)
        return self.classifier(features)

def train_landmark_classifier(data_dir: str, epochs: int = 30, batch_size: int = 32, model_version: str = None):
    """Train landmark classifier with improvements"""
    
    if model_version is None:
        model_version = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Data augmentation
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Datasets
    train_dataset = LandmarkDataset(f"{data_dir}/train", train_transform)
    val_dataset = LandmarkDataset(f"{data_dir}/val", val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4)
    
    # Model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = LandmarkClassifier(len(train_dataset.classes)).to(device)
    
    # Loss and optimizer
    criterion = FocalLoss(alpha=1, gamma=2)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    scaler = torch.cuda.amp.GradScaler() if torch.cuda.is_available() else None
    
    # Training loop
    best_acc = 0.0
    history = []
    
    for epoch in range(epochs):
        # Train
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            
            if scaler:
                with torch.cuda.amp.autocast():
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
        
        train_acc = train_correct / train_total
        
        # Validate
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        top5_correct = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
                
                # Top-5 accuracy
                _, top5_pred = outputs.topk(5, 1, True, True)
                top5_correct += top5_pred.eq(labels.view(-1, 1).expand_as(top5_pred)).sum().item()
        
        val_acc = val_correct / val_total
        top5_acc = top5_correct / val_total
        scheduler.step()
        
        logger.info(f"Epoch {epoch+1}/{epochs} | LR: {scheduler.get_last_lr()[0]:.6f}")
        logger.info(f"  Train Loss: {train_loss/len(train_loader):.4f} | Acc: {train_acc:.4f}")
        logger.info(f"  Val Loss: {val_loss/len(val_loader):.4f} | Acc: {val_acc:.4f} | Top-5: {top5_acc:.4f}")
        
        history.append({
            "epoch": epoch + 1,
            "train_loss": train_loss / len(train_loader),
            "train_acc": train_acc,
            "val_loss": val_loss / len(val_loader),
            "val_acc": val_acc,
            "top5_acc": top5_acc
        })
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            Path("models").mkdir(exist_ok=True)
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'epoch': epoch,
                'val_acc': val_acc,
                'top5_acc': top5_acc,
                'classes': train_dataset.classes,
                'version': model_version
            }, f"models/landmark_{model_version}_best.pth")
            logger.info(f"  ✅ Saved best model!")
    
    # Save final model and history
    torch.save(model.state_dict(), f"models/landmark_{model_version}_final.pth")
    with open(f"models/landmark_{model_version}_history.json", "w") as f:
        json.dump(history, f, indent=2)
    
    # Save class mapping
    with open(f"models/landmark_{model_version}_classes.json", "w") as f:
        json.dump(train_dataset.classes, f, indent=2)
    
    logger.info(f"Training complete. Best accuracy: {best_acc:.4f}")
    logger.info(f"Model version: {model_version}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="data/landmarks")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--version", default=None)
    args = parser.parse_args()
    
    train_landmark_classifier(args.data_dir, args.epochs, args.batch_size, args.version)
