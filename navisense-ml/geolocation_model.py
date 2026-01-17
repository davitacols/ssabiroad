import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional
import json
import os

class GeolocationEstimator(nn.Module):
    """Enhanced Lat/Long regression model for unknown buildings"""
    def __init__(self, embedding_dim=512):
        super().__init__()
        # Feature extraction layers
        self.feature_extractor = nn.Sequential(
            nn.Linear(embedding_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU()
        )
        
        # Separate heads for latitude and longitude
        self.lat_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh()  # Output between -1 and 1, then scale to -90 to 90
        )
        
        self.lng_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh()  # Output between -1 and 1, then scale to -180 to 180
        )
        
        # Confidence estimation head
        self.confidence_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Output between 0 and 1
        )
        
    def forward(self, x):
        features = self.feature_extractor(x)
        lat = self.lat_head(features) * 90  # Scale to -90 to 90
        lng = self.lng_head(features) * 180  # Scale to -180 to 180
        confidence = self.confidence_head(features)
        return lat, lng, confidence

class GeolocationPredictor:
    def __init__(self, device="cpu"):
        self.device = device
        self.model = GeolocationEstimator().to(device)
        self.model.eval()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.loss_fn = nn.MSELoss()
        
        # Load pre-trained weights if available
        self.model_path = "geolocation_model.pth"
        self.load_model()
        
    def predict(self, embedding: np.ndarray) -> Tuple[float, float, float]:
        """Predict lat/lng from image embedding with confidence"""
        with torch.no_grad():
            emb_tensor = torch.FloatTensor(embedding).unsqueeze(0).to(self.device)
            lat, lng, confidence = self.model(emb_tensor)
            return float(lat[0]), float(lng[0]), float(confidence[0])
    
    def train_step(self, embedding: np.ndarray, lat: float, lng: float):
        """Update model with new verified location"""
        self.model.train()
        emb_tensor = torch.FloatTensor(embedding).unsqueeze(0).to(self.device)
        pred_lat, pred_lng, pred_conf = self.model(emb_tensor)
        
        # Calculate loss
        lat_loss = self.loss_fn(pred_lat, torch.FloatTensor([[lat]]).to(self.device))
        lng_loss = self.loss_fn(pred_lng, torch.FloatTensor([[lng]]).to(self.device))
        total_loss = lat_loss + lng_loss
        
        # Backpropagation
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()
        
        self.model.eval()
        
        # Save model periodically
        if np.random.random() < 0.1:  # Save 10% of the time
            self.save_model()
        
        return float(total_loss.item())
    
    def batch_train(self, embeddings: list, latitudes: list, longitudes: list, epochs: int = 10):
        """Train on a batch of data"""
        self.model.train()
        
        embeddings_tensor = torch.FloatTensor(embeddings).to(self.device)
        latitudes_tensor = torch.FloatTensor(latitudes).unsqueeze(1).to(self.device)
        longitudes_tensor = torch.FloatTensor(longitudes).unsqueeze(1).to(self.device)
        
        for epoch in range(epochs):
            pred_lat, pred_lng, pred_conf = self.model(embeddings_tensor)
            
            lat_loss = self.loss_fn(pred_lat, latitudes_tensor)
            lng_loss = self.loss_fn(pred_lng, longitudes_tensor)
            total_loss = lat_loss + lng_loss
            
            self.optimizer.zero_grad()
            total_loss.backward()
            self.optimizer.step()
            
            if epoch % 5 == 0:
                print(f"Epoch {epoch}, Loss: {total_loss.item():.4f}")
        
        self.model.eval()
        self.save_model()
        return float(total_loss.item())
    
    def save_model(self):
        """Save model weights"""
        try:
            torch.save({
                'model_state_dict': self.model.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict()
            }, self.model_path)
        except Exception as e:
            print(f"Failed to save model: {e}")
    
    def load_model(self):
        """Load model weights if available"""
        try:
            if os.path.exists(self.model_path):
                checkpoint = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                print("Geolocation model loaded from checkpoint")
        except Exception as e:
            print(f"Failed to load model: {e}")
    
    def evaluate_accuracy(self, test_embeddings: list, test_lats: list, test_lngs: list) -> dict:
        """Evaluate model accuracy on test data"""
        self.model.eval()
        total_error = 0
        predictions = []
        
        with torch.no_grad():
            for emb, true_lat, true_lng in zip(test_embeddings, test_lats, test_lngs):
                pred_lat, pred_lng, confidence = self.predict(emb)
                
                # Calculate distance error in km (approximate)
                lat_diff = pred_lat - true_lat
                lng_diff = pred_lng - true_lng
                distance_error = np.sqrt(lat_diff**2 + lng_diff**2) * 111  # Rough km conversion
                
                total_error += distance_error
                predictions.append({
                    'predicted': [pred_lat, pred_lng],
                    'actual': [true_lat, true_lng],
                    'error_km': distance_error,
                    'confidence': confidence
                })
        
        avg_error = total_error / len(test_embeddings) if test_embeddings else 0
        
        return {
            'average_error_km': avg_error,
            'total_samples': len(test_embeddings),
            'predictions': predictions[:5]  # Return first 5 for inspection
        }

