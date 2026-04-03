import io
import os

import boto3
import numpy as np
import torch
import torch.nn as nn
from botocore.exceptions import ClientError
from typing import Dict, Optional, Tuple

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
    def __init__(self, device="cpu", embedding_dim: int = 512):
        self.device = device
        self.embedding_dim = int(embedding_dim)
        self.model = GeolocationEstimator(embedding_dim=self.embedding_dim).to(device)
        self.model.eval()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.loss_fn = nn.MSELoss()
        self.confidence_loss_fn = nn.BCELoss()
        self.confidence_scale_km = float(os.getenv("GEOLOCATION_CONFIDENCE_SCALE_KM", "25"))
        self.confidence_loss_weight = float(os.getenv("GEOLOCATION_CONFIDENCE_LOSS_WEIGHT", "0.25"))
        self.confidence_success_km = float(os.getenv("GEOLOCATION_CONFIDENCE_SUCCESS_KM", "25"))
        self.confidence_gate = float(os.getenv("GEOLOCATION_CONFIDENCE_GATE", "0.5"))
        self.confidence_calibration: Dict[str, float] = {
            "gate": self.confidence_gate,
            "success_km": self.confidence_success_km
        }
        
        # Load pre-trained weights if available
        self.model_path = os.getenv("GEOLOCATION_MODEL_PATH", "geolocation_model.pth")
        self.artifact_bucket = os.getenv("ML_ARTIFACTS_BUCKET") or os.getenv("AWS_S3_BUCKET_NAME")
        self.artifact_key = os.getenv(
            "GEOLOCATION_MODEL_S3_KEY",
            "navisense-ml-artifacts/geolocation_model.pth"
        )
        self.s3_client = self._build_s3_client()
        self.load_model()

    def _build_s3_client(self):
        if not self.artifact_bucket:
            return None

        try:
            return boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_S3_REGION_NAME", "us-east-1")
            )
        except Exception as e:
            print(f"Failed to initialize artifact S3 client: {e}")
            return None

    def reset_model(self):
        """Reinitialize the regressor before a clean retrain."""
        self.model = GeolocationEstimator(embedding_dim=self.embedding_dim).to(self.device)
        self.model.eval()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.confidence_gate = float(os.getenv("GEOLOCATION_CONFIDENCE_GATE", "0.5"))
        self.confidence_calibration = {
            "gate": self.confidence_gate,
            "success_km": self.confidence_success_km
        }
        
    def predict(self, embedding: np.ndarray) -> Tuple[float, float, float]:
        """Predict lat/lng from image embedding with confidence"""
        with torch.no_grad():
            emb_tensor = torch.FloatTensor(embedding).unsqueeze(0).to(self.device)
            lat, lng, confidence = self.model(emb_tensor)
            return float(lat[0]), float(lng[0]), float(confidence[0])

    def _distance_km_tensor(
        self,
        pred_lat: torch.Tensor,
        pred_lng: torch.Tensor,
        true_lat: torch.Tensor,
        true_lng: torch.Tensor
    ) -> torch.Tensor:
        pred_lat_rad = torch.deg2rad(pred_lat)
        pred_lng_rad = torch.deg2rad(pred_lng)
        true_lat_rad = torch.deg2rad(true_lat)
        true_lng_rad = torch.deg2rad(true_lng)

        dlat = true_lat_rad - pred_lat_rad
        dlng = true_lng_rad - pred_lng_rad
        a = (
            torch.sin(dlat / 2) ** 2
            + torch.cos(pred_lat_rad) * torch.cos(true_lat_rad) * torch.sin(dlng / 2) ** 2
        )
        a = torch.clamp(a, 0.0, 1.0)
        c = 2 * torch.atan2(torch.sqrt(a), torch.sqrt(torch.clamp(1 - a, min=1e-8)))
        return 6371.0 * c

    def _confidence_target(self, error_km: torch.Tensor) -> torch.Tensor:
        target = torch.exp(-error_km / max(self.confidence_scale_km, 1.0))
        return torch.clamp(target, 0.0, 1.0)
    
    def train_step(self, embedding: np.ndarray, lat: float, lng: float):
        """Update model with new verified location"""
        self.model.train()
        emb_tensor = torch.FloatTensor(embedding).unsqueeze(0).to(self.device)
        pred_lat, pred_lng, pred_conf = self.model(emb_tensor)
        target_lat = torch.FloatTensor([[lat]]).to(self.device)
        target_lng = torch.FloatTensor([[lng]]).to(self.device)
        
        # Calculate loss
        lat_loss = self.loss_fn(pred_lat, target_lat)
        lng_loss = self.loss_fn(pred_lng, target_lng)
        error_km = self._distance_km_tensor(
            pred_lat.squeeze(1),
            pred_lng.squeeze(1),
            target_lat.squeeze(1),
            target_lng.squeeze(1)
        )
        conf_target = self._confidence_target(error_km).unsqueeze(1).detach()
        conf_loss = self.confidence_loss_fn(pred_conf, conf_target)
        total_loss = lat_loss + lng_loss + (self.confidence_loss_weight * conf_loss)
        
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
        if not embeddings:
            return 0.0

        self.model.train()
        
        embeddings_tensor = torch.FloatTensor(embeddings).to(self.device)
        latitudes_tensor = torch.FloatTensor(latitudes).unsqueeze(1).to(self.device)
        longitudes_tensor = torch.FloatTensor(longitudes).unsqueeze(1).to(self.device)
        
        for epoch in range(epochs):
            pred_lat, pred_lng, pred_conf = self.model(embeddings_tensor)
            
            lat_loss = self.loss_fn(pred_lat, latitudes_tensor)
            lng_loss = self.loss_fn(pred_lng, longitudes_tensor)
            error_km = self._distance_km_tensor(
                pred_lat.squeeze(1),
                pred_lng.squeeze(1),
                latitudes_tensor.squeeze(1),
                longitudes_tensor.squeeze(1)
            )
            conf_target = self._confidence_target(error_km).unsqueeze(1).detach()
            conf_loss = self.confidence_loss_fn(pred_conf, conf_target)
            total_loss = lat_loss + lng_loss + (self.confidence_loss_weight * conf_loss)
            
            self.optimizer.zero_grad()
            total_loss.backward()
            self.optimizer.step()
            
            if epoch % 5 == 0:
                print(f"Epoch {epoch}, Loss: {total_loss.item():.4f}")
        
        self.model.eval()
        self.save_model()
        return float(total_loss.item())

    def calibrate_confidence(
        self,
        validation_embeddings: list,
        validation_lats: list,
        validation_lngs: list
    ) -> Optional[dict]:
        if not validation_embeddings:
            return None

        raw_confidences = []
        labels = []
        errors = []

        with torch.no_grad():
            for emb, true_lat, true_lng in zip(validation_embeddings, validation_lats, validation_lngs):
                pred_lat, pred_lng, raw_confidence = self.predict(emb)
                error_km = self._haversine_km(pred_lat, pred_lng, true_lat, true_lng)
                raw_confidences.append(raw_confidence)
                labels.append(error_km <= self.confidence_success_km)
                errors.append(error_km)

        best_threshold = self.confidence_gate
        best_score = -1.0
        thresholds = np.linspace(0.05, 0.95, 19)
        for threshold in thresholds:
            predictions = [value >= threshold for value in raw_confidences]
            tp = sum(pred and label for pred, label in zip(predictions, labels))
            fp = sum(pred and not label for pred, label in zip(predictions, labels))
            fn = sum((not pred) and label for pred, label in zip(predictions, labels))
            precision = tp / (tp + fp) if (tp + fp) else 0.0
            recall = tp / (tp + fn) if (tp + fn) else 0.0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
            if f1 > best_score:
                best_score = f1
                best_threshold = float(threshold)

        self.confidence_gate = best_threshold
        self.confidence_calibration = {
            "gate": self.confidence_gate,
            "success_km": self.confidence_success_km,
            "f1": float(best_score),
            "average_error_km": float(np.mean(errors)) if errors else 0.0,
            "median_error_km": float(np.median(errors)) if errors else 0.0
        }
        self.save_model()
        return dict(self.confidence_calibration)
    
    def save_model(self):
        """Save model weights"""
        try:
            checkpoint = {
                'model_state_dict': self.model.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'embedding_dim': self.embedding_dim,
                'confidence_gate': self.confidence_gate,
                'confidence_scale_km': self.confidence_scale_km,
                'confidence_success_km': self.confidence_success_km,
                'confidence_calibration': self.confidence_calibration
            }

            with open(self.model_path, "wb") as f:
                torch.save(checkpoint, f)

            if self.s3_client and self.artifact_bucket:
                buffer = io.BytesIO()
                torch.save(checkpoint, buffer)
                self.s3_client.put_object(
                    Bucket=self.artifact_bucket,
                    Key=self.artifact_key,
                    Body=buffer.getvalue(),
                    ContentType="application/octet-stream"
                )
        except Exception as e:
            print(f"Failed to save model: {e}")
    
    def load_model(self):
        """Load model weights if available"""
        try:
            checkpoint_bytes = None

            if self.s3_client and self.artifact_bucket:
                try:
                    checkpoint_bytes = self.s3_client.get_object(
                        Bucket=self.artifact_bucket,
                        Key=self.artifact_key
                    )["Body"].read()
                    print("Geolocation model loaded from S3 checkpoint")
                except ClientError as e:
                    error_code = e.response.get("Error", {}).get("Code")
                    if error_code not in {"NoSuchKey", "404"}:
                        print(f"Failed to load geolocation model from S3: {e}")
                except Exception as e:
                    print(f"Failed to load geolocation model from S3: {e}")

            if checkpoint_bytes is None and os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    checkpoint_bytes = f.read()
                print("Geolocation model loaded from local checkpoint")

            if checkpoint_bytes is not None:
                checkpoint = torch.load(io.BytesIO(checkpoint_bytes), map_location=self.device)
                checkpoint_embedding_dim = int(checkpoint.get('embedding_dim', self.embedding_dim))
                if checkpoint_embedding_dim != self.embedding_dim:
                    print(
                        "Skipping geolocation checkpoint because the embedding dimension changed: "
                        f"{checkpoint_embedding_dim} -> {self.embedding_dim}"
                    )
                    return
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                self.confidence_gate = float(checkpoint.get('confidence_gate', self.confidence_gate))
                self.confidence_scale_km = float(checkpoint.get('confidence_scale_km', self.confidence_scale_km))
                self.confidence_success_km = float(checkpoint.get('confidence_success_km', self.confidence_success_km))
                self.confidence_calibration = checkpoint.get(
                    'confidence_calibration',
                    {
                        "gate": self.confidence_gate,
                        "success_km": self.confidence_success_km
                    }
                )
        except Exception as e:
            print(f"Failed to load model: {e}")

    @staticmethod
    def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        lat1_rad = np.radians(lat1)
        lng1_rad = np.radians(lng1)
        lat2_rad = np.radians(lat2)
        lng2_rad = np.radians(lng2)

        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad

        a = (
            np.sin(dlat / 2) ** 2
            + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlng / 2) ** 2
        )
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return float(6371.0 * c)
    
    def evaluate_accuracy(self, test_embeddings: list, test_lats: list, test_lngs: list) -> dict:
        """Evaluate model accuracy on test data"""
        self.model.eval()
        errors = []
        predictions = []
        
        with torch.no_grad():
            for emb, true_lat, true_lng in zip(test_embeddings, test_lats, test_lngs):
                pred_lat, pred_lng, confidence = self.predict(emb)
                
                distance_error = self._haversine_km(pred_lat, pred_lng, true_lat, true_lng)
                
                errors.append(distance_error)
                predictions.append({
                    'predicted': [pred_lat, pred_lng],
                    'actual': [true_lat, true_lng],
                    'error_km': distance_error,
                    'confidence': confidence
                })
        
        avg_error = float(np.mean(errors)) if errors else 0.0
        median_error = float(np.median(errors)) if errors else 0.0
        within_1km = float(np.mean([error <= 1.0 for error in errors])) if errors else 0.0
        within_10km = float(np.mean([error <= 10.0 for error in errors])) if errors else 0.0
        within_50km = float(np.mean([error <= 50.0 for error in errors])) if errors else 0.0
        
        return {
            'average_error_km': avg_error,
            'median_error_km': median_error,
            'total_samples': len(test_embeddings),
            'within_1km': within_1km,
            'within_10km': within_10km,
            'within_50km': within_50km,
            'predictions': predictions[:5]  # Return first 5 for inspection
        }

