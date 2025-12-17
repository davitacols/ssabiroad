"""Model Performance Monitoring and Versioning"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import numpy as np
from loguru import logger

class ModelMonitor:
    def __init__(self, log_dir: str = "models/monitoring"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.predictions_file = self.log_dir / "predictions.jsonl"
        self.metrics_file = self.log_dir / "metrics.json"
        
    def log_prediction(self, image_id: str, prediction: Dict, ground_truth: Dict = None, user_feedback: Dict = None):
        """Log a single prediction"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "image_id": image_id,
            "prediction": prediction,
            "ground_truth": ground_truth,
            "user_feedback": user_feedback
        }
        
        with open(self.predictions_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def calculate_metrics(self, window_hours: int = 24) -> Dict:
        """Calculate metrics from recent predictions"""
        if not self.predictions_file.exists():
            return {}
        
        cutoff_time = datetime.now().timestamp() - (window_hours * 3600)
        predictions = []
        
        with open(self.predictions_file, "r") as f:
            for line in f:
                entry = json.loads(line)
                entry_time = datetime.fromisoformat(entry["timestamp"]).timestamp()
                if entry_time >= cutoff_time:
                    predictions.append(entry)
        
        if not predictions:
            return {}
        
        # Calculate metrics
        total = len(predictions)
        with_ground_truth = [p for p in predictions if p.get("ground_truth")]
        with_feedback = [p for p in predictions if p.get("user_feedback")]
        
        metrics = {
            "total_predictions": total,
            "predictions_with_ground_truth": len(with_ground_truth),
            "predictions_with_feedback": len(with_feedback),
            "window_hours": window_hours
        }
        
        # Accuracy metrics
        if with_ground_truth:
            from haversine import haversine
            distances = []
            for p in with_ground_truth:
                pred = p["prediction"]
                truth = p["ground_truth"]
                if pred.get("latitude") and truth.get("latitude"):
                    dist = haversine(
                        (pred["latitude"], pred["longitude"]),
                        (truth["latitude"], truth["longitude"])
                    )
                    distances.append(dist)
            
            if distances:
                distances = np.array(distances)
                metrics.update({
                    "mean_error_km": float(np.mean(distances)),
                    "median_error_km": float(np.median(distances)),
                    "accuracy_1km": float((distances < 1).mean()),
                    "accuracy_5km": float((distances < 5).mean()),
                    "accuracy_25km": float((distances < 25).mean())
                })
        
        # User feedback metrics
        if with_feedback:
            positive = sum(1 for p in with_feedback if p["user_feedback"].get("correct"))
            metrics["user_satisfaction"] = positive / len(with_feedback)
        
        # Method distribution
        methods = {}
        for p in predictions:
            method = p["prediction"].get("method", "unknown")
            methods[method] = methods.get(method, 0) + 1
        metrics["method_distribution"] = methods
        
        # Save metrics
        with open(self.metrics_file, "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "metrics": metrics
            }, f, indent=2)
        
        return metrics
    
    def get_retraining_candidates(self, min_confidence: float = 0.8, limit: int = 1000) -> List[Dict]:
        """Get high-confidence predictions for retraining"""
        if not self.predictions_file.exists():
            return []
        
        candidates = []
        with open(self.predictions_file, "r") as f:
            for line in f:
                entry = json.loads(line)
                pred = entry["prediction"]
                
                # High confidence or user-verified
                if (pred.get("confidence", 0) >= min_confidence or 
                    entry.get("user_feedback", {}).get("correct")):
                    candidates.append(entry)
        
        return candidates[-limit:]  # Most recent
    
    def compare_models(self, model_versions: List[str]) -> Dict:
        """Compare performance across model versions"""
        comparison = {}
        
        for version in model_versions:
            history_file = Path(f"models/geolocation_{version}_history.json")
            if history_file.exists():
                with open(history_file) as f:
                    history = json.load(f)
                    final_metrics = history[-1] if history else {}
                    comparison[version] = final_metrics
        
        return comparison

class ModelVersionManager:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        self.registry_file = self.models_dir / "registry.json"
        self.load_registry()
    
    def load_registry(self):
        """Load model registry"""
        if self.registry_file.exists():
            with open(self.registry_file) as f:
                self.registry = json.load(f)
        else:
            self.registry = {"models": [], "active": None}
    
    def save_registry(self):
        """Save model registry"""
        with open(self.registry_file, "w") as f:
            json.dump(self.registry, f, indent=2)
    
    def register_model(self, version: str, metrics: Dict, model_type: str = "geolocation"):
        """Register a new model version"""
        model_entry = {
            "version": version,
            "type": model_type,
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics,
            "path": f"{model_type}_{version}_best.pth"
        }
        
        self.registry["models"].append(model_entry)
        self.save_registry()
        logger.info(f"Registered model {version}")
    
    def set_active_model(self, version: str):
        """Set active model version"""
        self.registry["active"] = version
        self.save_registry()
        logger.info(f"Set active model to {version}")
    
    def get_active_model(self) -> Dict:
        """Get active model info"""
        active_version = self.registry.get("active")
        if active_version:
            for model in self.registry["models"]:
                if model["version"] == active_version:
                    return model
        return None
    
    def get_best_model(self, metric: str = "mean_distance_km") -> Dict:
        """Get best performing model"""
        models = [m for m in self.registry["models"] if metric in m.get("metrics", {})]
        if not models:
            return None
        
        # Lower is better for distance metrics
        return min(models, key=lambda m: m["metrics"][metric])
    
    def list_models(self) -> List[Dict]:
        """List all registered models"""
        return self.registry["models"]

def auto_model_selection(monitor: ModelMonitor, version_manager: ModelVersionManager):
    """Automatically select best model based on recent performance"""
    recent_metrics = monitor.calculate_metrics(window_hours=24)
    
    if not recent_metrics or "mean_error_km" not in recent_metrics:
        logger.warning("Insufficient data for auto model selection")
        return
    
    current_performance = recent_metrics["mean_error_km"]
    best_model = version_manager.get_best_model()
    
    if best_model:
        best_performance = best_model["metrics"].get("mean_distance_km", float('inf'))
        
        # Switch if current is significantly worse
        if current_performance > best_performance * 1.2:
            logger.warning(f"Current model degraded: {current_performance:.2f}km vs {best_performance:.2f}km")
            logger.info(f"Switching to best model: {best_model['version']}")
            version_manager.set_active_model(best_model["version"])
            return best_model["version"]
    
    return None
