"""Active Learning System for Continuous Model Improvement"""
import torch
from pathlib import Path
from typing import List, Dict
import json
from PIL import Image
from loguru import logger
from datetime import datetime
import numpy as np

class ActiveLearningPipeline:
    def __init__(self, 
                 data_dir: str = "data/active_learning",
                 min_samples: int = 100,
                 confidence_threshold: float = 0.7):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.min_samples = min_samples
        self.confidence_threshold = confidence_threshold
        self.queue_file = self.data_dir / "training_queue.json"
        self.load_queue()
    
    def load_queue(self):
        """Load training queue"""
        if self.queue_file.exists():
            with open(self.queue_file) as f:
                self.queue = json.load(f)
        else:
            self.queue = {"samples": [], "last_training": None}
    
    def save_queue(self):
        """Save training queue"""
        with open(self.queue_file, "w") as f:
            json.dump(self.queue, f, indent=2)
    
    def add_sample(self, image_path: str, metadata: Dict, priority: str = "normal"):
        """Add sample to training queue"""
        sample = {
            "image_path": image_path,
            "metadata": metadata,
            "priority": priority,
            "added_at": datetime.now().isoformat()
        }
        
        self.queue["samples"].append(sample)
        self.save_queue()
        
        logger.info(f"Added sample to queue: {len(self.queue['samples'])} total")
    
    def add_user_correction(self, image_path: str, predicted: Dict, corrected: Dict):
        """Add user-corrected prediction to queue (high priority)"""
        metadata = {
            "latitude": corrected["latitude"],
            "longitude": corrected["longitude"],
            "name": corrected.get("name"),
            "predicted_lat": predicted.get("latitude"),
            "predicted_lon": predicted.get("longitude"),
            "correction": True
        }
        
        self.add_sample(image_path, metadata, priority="high")
    
    def add_high_confidence_prediction(self, image_path: str, prediction: Dict):
        """Add high-confidence prediction to queue"""
        if prediction.get("confidence", 0) >= self.confidence_threshold:
            metadata = {
                "latitude": prediction["latitude"],
                "longitude": prediction["longitude"],
                "name": prediction.get("details", {}).get("building_name"),
                "confidence": prediction["confidence"],
                "method": prediction.get("method")
            }
            
            self.add_sample(image_path, metadata, priority="normal")
    
    def get_training_batch(self, batch_size: int = None) -> List[Dict]:
        """Get batch of samples for training"""
        if batch_size is None:
            batch_size = len(self.queue["samples"])
        
        # Prioritize high priority samples
        high_priority = [s for s in self.queue["samples"] if s["priority"] == "high"]
        normal_priority = [s for s in self.queue["samples"] if s["priority"] == "normal"]
        
        batch = high_priority[:batch_size]
        if len(batch) < batch_size:
            batch.extend(normal_priority[:batch_size - len(batch)])
        
        return batch
    
    def should_retrain(self) -> bool:
        """Check if model should be retrained"""
        total_samples = len(self.queue["samples"])
        high_priority = sum(1 for s in self.queue["samples"] if s["priority"] == "high")
        
        if total_samples >= self.min_samples:
            return True
        if high_priority >= 5:
            return True
        if total_samples >= 10:
            return True
        
        return False
    
    def prepare_training_data(self, output_dir: str = None):
        """Prepare data for retraining"""
        if output_dir is None:
            output_dir = self.data_dir / f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        output_dir = Path(output_dir)
        train_dir = output_dir / "train"
        train_dir.mkdir(parents=True, exist_ok=True)
        
        batch = self.get_training_batch()
        prepared = 0
        
        for idx, sample in enumerate(batch):
            try:
                # Copy image
                src_path = Path(sample["image_path"])
                if src_path.exists():
                    dst_path = train_dir / f"sample_{idx:05d}.jpg"
                    
                    img = Image.open(src_path)
                    img.save(dst_path, quality=95)
                    
                    # Save metadata
                    meta_path = train_dir / f"sample_{idx:05d}.json"
                    with open(meta_path, "w") as f:
                        json.dump(sample["metadata"], f, indent=2)
                    
                    prepared += 1
            except Exception as e:
                logger.error(f"Error preparing sample {idx}: {e}")
        
        logger.info(f"Prepared {prepared} samples in {output_dir}")
        return str(output_dir), prepared
    
    def mark_trained(self, samples: List[Dict]):
        """Mark samples as trained"""
        trained_ids = {s["image_path"] for s in samples}
        self.queue["samples"] = [
            s for s in self.queue["samples"] 
            if s["image_path"] not in trained_ids
        ]
        self.queue["last_training"] = datetime.now().isoformat()
        self.save_queue()
        
        logger.info(f"Marked {len(samples)} samples as trained. {len(self.queue['samples'])} remaining")
    
    def uncertainty_sampling(self, predictions: List[Dict], k: int = 10) -> List[Dict]:
        """Select most uncertain predictions for labeling"""
        # Sort by confidence (ascending)
        uncertain = sorted(predictions, key=lambda p: p.get("confidence", 1.0))
        return uncertain[:k]
    
    def diversity_sampling(self, embeddings: np.ndarray, k: int = 10) -> List[int]:
        """Select diverse samples using k-means clustering"""
        from sklearn.cluster import KMeans
        
        n_clusters = min(k, len(embeddings))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(embeddings)
        
        # Select closest to each centroid
        selected = []
        for i in range(n_clusters):
            cluster_points = np.where(kmeans.labels_ == i)[0]
            if len(cluster_points) > 0:
                centroid = kmeans.cluster_centers_[i]
                distances = np.linalg.norm(embeddings[cluster_points] - centroid, axis=1)
                closest = cluster_points[np.argmin(distances)]
                selected.append(int(closest))
        
        return selected

class ContinuousTrainer:
    def __init__(self, active_learning: ActiveLearningPipeline):
        self.active_learning = active_learning
    
    def run_training_cycle(self, model_trainer, base_data_dir: str):
        """Run one training cycle with active learning data"""
        if not self.active_learning.should_retrain():
            logger.info("Not enough samples for retraining")
            return None
        
        # Prepare data
        new_data_dir, count = self.active_learning.prepare_training_data()
        
        if count < 10:
            logger.warning("Too few samples prepared for training")
            return None
        
        # Combine with existing data
        from datetime import datetime
        version = f"active_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Starting training cycle with {count} new samples")
        
        # Train model (simplified - actual training would use your train_geolocation.py)
        try:
            # This would call your actual training function
            # train_geolocation_model(combined_data_dir, epochs=5, model_version=version)
            
            # Mark samples as trained
            batch = self.active_learning.get_training_batch()
            self.active_learning.mark_trained(batch)
            
            logger.info(f"Training cycle complete: {version}")
            return version
            
        except Exception as e:
            logger.error(f"Training cycle failed: {e}")
            return None
    
    def schedule_training(self, check_interval_hours: int = 24):
        """Schedule periodic training checks"""
        import schedule
        import time
        
        def check_and_train():
            if self.active_learning.should_retrain():
                logger.info("Triggering scheduled training")
                self.run_training_cycle(None, "data/geolocations")
        
        schedule.every(check_interval_hours).hours.do(check_and_train)
        
        logger.info(f"Scheduled training checks every {check_interval_hours} hours")
        
        while True:
            schedule.run_pending()
            time.sleep(3600)  # Check every hour
