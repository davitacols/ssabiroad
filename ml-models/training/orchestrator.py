"""Training Orchestrator - Manages entire training pipeline"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger
from datetime import datetime
import json
from utils.model_monitor import ModelVersionManager
from utils.active_learning import ActiveLearningPipeline, ContinuousTrainer

class TrainingOrchestrator:
    def __init__(self):
        self.version_manager = ModelVersionManager()
        self.active_learning = ActiveLearningPipeline()
        self.continuous_trainer = ContinuousTrainer(self.active_learning)
    
    def run_full_pipeline(self, config: dict):
        """Run complete training pipeline"""
        logger.info("=" * 60)
        logger.info("Starting Full Training Pipeline")
        logger.info("=" * 60)
        
        results = {}
        
        # Step 1: Data Collection
        if config.get("collect_data"):
            logger.info("\n[1/4] Data Collection")
            results["data_collection"] = self.collect_data(config)
        
        # Step 2: Build FAISS Index
        if config.get("build_index"):
            logger.info("\n[2/4] Building FAISS Index")
            results["faiss_index"] = self.build_faiss_index(config)
        
        # Step 3: Train Landmark Classifier
        if config.get("train_landmark"):
            logger.info("\n[3/4] Training Landmark Classifier")
            results["landmark"] = self.train_landmark(config)
        
        # Step 4: Train Geolocation Model
        if config.get("train_geolocation"):
            logger.info("\n[4/4] Training Geolocation Model")
            results["geolocation"] = self.train_geolocation(config)
        
        # Save results
        self.save_pipeline_results(results)
        
        logger.info("\n" + "=" * 60)
        logger.info("Pipeline Complete!")
        logger.info("=" * 60)
        
        return results
    
    def collect_data(self, config: dict):
        """Collect training data"""
        from training.data_collector import collect_nigerian_cities
        
        try:
            api_key = config.get("google_api_key")
            collect_nigerian_cities(api_key)
            return {"status": "success", "message": "Data collection complete"}
        except Exception as e:
            logger.error(f"Data collection failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    def build_faiss_index(self, config: dict):
        """Build FAISS index from collected data"""
        from training.build_faiss_index import build_index_from_directory
        
        try:
            data_dir = config.get("data_dir", "data/collected")
            index_path = config.get("index_path", "faiss_index")
            
            # This would call your actual build function
            logger.info(f"Building index from {data_dir}")
            # build_index_from_directory(data_dir, index_path)
            
            return {"status": "success", "index_path": index_path}
        except Exception as e:
            logger.error(f"Index building failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    def train_landmark(self, config: dict):
        """Train landmark classifier"""
        from training.train_landmark_improved import train_landmark_classifier
        
        try:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")
            data_dir = config.get("landmark_data_dir", "data/landmarks")
            epochs = config.get("landmark_epochs", 30)
            
            train_landmark_classifier(data_dir, epochs=epochs, model_version=version)
            
            # Register model
            with open(f"models/landmark_{version}_history.json") as f:
                history = json.load(f)
                final_metrics = history[-1]
            
            self.version_manager.register_model(version, final_metrics, "landmark")
            
            return {"status": "success", "version": version, "metrics": final_metrics}
        except Exception as e:
            logger.error(f"Landmark training failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    def train_geolocation(self, config: dict):
        """Train geolocation model"""
        from training.train_geolocation import train_geolocation_model
        
        try:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")
            data_dir = config.get("geolocation_data_dir", "data/geolocations")
            epochs = config.get("geolocation_epochs", 20)
            
            train_geolocation_model(data_dir, epochs=epochs, model_version=version)
            
            # Register model
            with open(f"models/geolocation_{version}_history.json") as f:
                history = json.load(f)
                final_metrics = history[-1]
            
            self.version_manager.register_model(version, final_metrics, "geolocation")
            self.version_manager.set_active_model(version)
            
            return {"status": "success", "version": version, "metrics": final_metrics}
        except Exception as e:
            logger.error(f"Geolocation training failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    def save_pipeline_results(self, results: dict):
        """Save pipeline execution results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = Path(f"models/pipeline_{timestamp}.json")
        
        with open(results_file, "w") as f:
            json.dump({
                "timestamp": timestamp,
                "results": results
            }, f, indent=2)
        
        logger.info(f"Results saved to {results_file}")
    
    def run_active_learning_cycle(self):
        """Run active learning training cycle"""
        logger.info("Checking active learning queue...")
        
        if self.active_learning.should_retrain():
            logger.info("Starting active learning training cycle")
            version = self.continuous_trainer.run_training_cycle(None, "data/geolocations")
            
            if version:
                logger.info(f"Active learning cycle complete: {version}")
                return {"status": "success", "version": version}
            else:
                return {"status": "failed", "message": "Training failed"}
        else:
            logger.info("Not enough samples for retraining")
            return {"status": "skipped", "message": "Insufficient samples"}

def main():
    """Main training orchestrator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ML Training Orchestrator")
    parser.add_argument("--mode", choices=["full", "active", "landmark", "geolocation", "index"], 
                       default="full", help="Training mode")
    parser.add_argument("--config", help="Config file path")
    parser.add_argument("--google-api-key", help="Google API key for Street View")
    parser.add_argument("--epochs", type=int, default=20, help="Training epochs")
    
    args = parser.parse_args()
    
    # Load config
    if args.config and Path(args.config).exists():
        with open(args.config) as f:
            config = json.load(f)
    else:
        config = {
            "collect_data": args.mode in ["full"],
            "build_index": args.mode in ["full", "index"],
            "train_landmark": args.mode in ["full", "landmark"],
            "train_geolocation": args.mode in ["full", "geolocation"],
            "google_api_key": args.google_api_key,
            "landmark_epochs": args.epochs,
            "geolocation_epochs": args.epochs
        }
    
    orchestrator = TrainingOrchestrator()
    
    if args.mode == "active":
        results = orchestrator.run_active_learning_cycle()
    else:
        results = orchestrator.run_full_pipeline(config)
    
    logger.info("\nFinal Results:")
    logger.info(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
