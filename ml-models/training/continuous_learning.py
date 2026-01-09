import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
import numpy as np
from pathlib import Path
import json
from datetime import datetime
from typing import List, Dict
import faiss

class FeedbackDataset(Dataset):
    def __init__(self, samples: List[Dict], transform=None):
        self.samples = samples
        self.transform = transform
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        image = self.transform(sample['image']) if self.transform else sample['image']
        return {
            'image': image,
            'lat': sample['lat'],
            'lon': sample['lon'],
            'text': sample.get('text', ''),
            'weight': sample.get('weight', 1.0)
        }

class ContinuousLearningTrainer:
    def __init__(self, model, device='cuda'):
        self.model = model
        self.device = device
        self.optimizer = AdamW(model.parameters(), lr=1e-5, weight_decay=0.01)
        self.scheduler = CosineAnnealingWarmRestarts(self.optimizer, T_0=10, T_mult=2)
        self.feedback_buffer = []
        self.version = 0
        
    def haversine_loss(self, pred_coords, true_coords, weights=None):
        lat1, lon1 = pred_coords[:, 0], pred_coords[:, 1]
        lat2, lon2 = true_coords[:, 0], true_coords[:, 1]
        
        R = 6371.0
        lat1, lon1, lat2, lon2 = map(torch.deg2rad, [lat1, lon1, lat2, lon2])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        
        a = torch.sin(dlat/2)**2 + torch.cos(lat1) * torch.cos(lat2) * torch.sin(dlon/2)**2
        c = 2 * torch.asin(torch.sqrt(a))
        distance = R * c
        
        if weights is not None:
            distance = distance * weights
        return distance.mean()
    
    def add_feedback(self, image, predicted_loc, true_loc, confidence, user_corrected=False):
        weight = 2.0 if user_corrected else (1.0 if confidence > 0.8 else 0.5)
        self.feedback_buffer.append({
            'image': image,
            'lat': true_loc[0],
            'lon': true_loc[1],
            'weight': weight,
            'timestamp': datetime.now().isoformat(),
            'corrected': user_corrected
        })
        
        # Trigger training if buffer is full
        if len(self.feedback_buffer) >= 100 or sum(s['corrected'] for s in self.feedback_buffer) >= 20:
            self.train_incremental()
    
    def train_incremental(self):
        if len(self.feedback_buffer) < 10:
            return
        
        dataset = FeedbackDataset(self.feedback_buffer, transform=self.model.clip_preprocess)
        loader = DataLoader(dataset, batch_size=16, shuffle=True)
        
        self.model.train()
        for epoch in range(5):
            total_loss = 0
            for batch in loader:
                images = batch['image'].to(self.device)
                coords = torch.stack([batch['lat'], batch['lon']], dim=1).to(self.device)
                weights = batch['weight'].to(self.device)
                
                # Forward pass
                visual_feat = self.model.clip_model.encode_image(images)
                scene_feat = self.model.scene_head(visual_feat)
                
                # Predict coordinates (simplified)
                pred_coords = scene_feat[:, :2]  # Use first 2 dims as coords
                
                loss = self.haversine_loss(pred_coords, coords, weights)
                
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                self.optimizer.step()
                
                total_loss += loss.item()
            
            self.scheduler.step()
            print(f"Epoch {epoch+1}/5, Loss: {total_loss/len(loader):.4f}")
        
        # Save checkpoint
        self.version += 1
        self.save_checkpoint()
        
        # Clear buffer (keep 20% for validation)
        keep_samples = int(len(self.feedback_buffer) * 0.2)
        self.feedback_buffer = self.feedback_buffer[-keep_samples:]
    
    def save_checkpoint(self):
        checkpoint_path = Path(f"checkpoints/model_v{self.version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pt")
        checkpoint_path.parent.mkdir(exist_ok=True)
        
        torch.save({
            'version': self.version,
            'model_state': self.model.state_dict(),
            'optimizer_state': self.optimizer.state_dict(),
            'feedback_count': len(self.feedback_buffer),
            'timestamp': datetime.now().isoformat()
        }, checkpoint_path)
        
        print(f"Saved checkpoint: {checkpoint_path}")

class FAISSIndexBuilder:
    def __init__(self, dimension=768):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        
    def add_embeddings(self, embeddings: np.ndarray, metadata: List[Dict]):
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        self.index.add(embeddings.astype('float32'))
        return metadata
    
    def save(self, path: str):
        faiss.write_index(self.index, path)
    
    def load(self, path: str):
        self.index = faiss.read_index(path)
