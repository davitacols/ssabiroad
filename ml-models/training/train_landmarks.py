"""
Train Landmark Recognition Model on Google Landmarks Dataset v2
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import numpy as np

class LandmarkDataset(Dataset):
    def __init__(self, csv_path, img_dir, transform=None):
        self.data = pd.read_csv(csv_path)
        self.img_dir = Path(img_dir)
        self.transform = transform
        
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        img_id = row['id']
        landmark_id = row['landmark_id']
        
        # Construct image path: a/b/c/id.jpg
        img_path = self.img_dir / img_id[0] / img_id[1] / img_id[2] / f"{img_id}.jpg"
        
        try:
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            return image, landmark_id
        except:
            # Return dummy data if image not found
            return torch.zeros(3, 224, 224), landmark_id

def extract_features_batch(model, dataloader, device, save_dir):
    """Extract features for all training images"""
    model.eval()
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    
    features_dict = {}
    
    with torch.no_grad():
        for images, landmark_ids in tqdm(dataloader, desc="Extracting features"):
            images = images.to(device)
            features = model(images).squeeze()
            
            # Normalize features
            features = features / features.norm(dim=1, keepdim=True)
            features = features.cpu().numpy()
            
            # Group by landmark_id
            for feat, lid in zip(features, landmark_ids.numpy()):
                lid = int(lid)
                if lid not in features_dict:
                    features_dict[lid] = []
                features_dict[lid].append(feat)
    
    # Average features per landmark
    print("Averaging features per landmark...")
    for landmark_id, feats in tqdm(features_dict.items()):
        avg_feat = np.mean(feats, axis=0)
        np.save(save_dir / f"{landmark_id}.npy", avg_feat)
    
    print(f"Saved features for {len(features_dict)} landmarks")

def main():
    # Configuration
    BATCH_SIZE = 32
    NUM_WORKERS = 4
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    DATA_DIR = Path("data/google-landmarks-v2")
    TRAIN_CSV = DATA_DIR / "metadata/train.csv"
    TRAIN_IMG_DIR = DATA_DIR / "train"
    FEATURES_DIR = DATA_DIR / "features"
    
    print(f"Using device: {DEVICE}")
    
    # Data transforms
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    print("Loading dataset...")
    dataset = LandmarkDataset(TRAIN_CSV, TRAIN_IMG_DIR, transform=transform)
    dataloader = DataLoader(
        dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=False, 
        num_workers=NUM_WORKERS
    )
    
    # Load model
    print("Loading ResNet101 model...")
    from torchvision import models
    model = models.resnet101(pretrained=True)
    model = nn.Sequential(*list(model.children())[:-1])
    model = model.to(DEVICE)
    model.eval()
    
    # Extract features
    print("Extracting features...")
    extract_features_batch(model, dataloader, DEVICE, FEATURES_DIR)
    
    # Build FAISS index
    print("Building FAISS index...")
    from landmark_recognition import LandmarkRecognitionModel
    landmark_model = LandmarkRecognitionModel()
    landmark_model.build_index(FEATURES_DIR, save_path="data/landmark_index.faiss")
    
    print("Training complete!")

if __name__ == "__main__":
    main()
