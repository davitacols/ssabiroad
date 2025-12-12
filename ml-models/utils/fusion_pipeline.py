"""Fusion Pipeline - Combines all ML models"""
from PIL import Image
import torch
from torchvision import transforms
from typing import Dict, Optional
from loguru import logger
from .clip_faiss import CLIPFAISSRetriever
from .geolocation_model import GeolocationModel, GeolocationTrainer
from .ocr_pipeline import OCRPipeline
from .landmark_detector import LandmarkDetector

class FusionPipeline:
    def __init__(self, 
                 faiss_index_path: str = "faiss_index",
                 geoloc_model_path: str = None,
                 landmark_model_path: str = None,
                 similarity_threshold: float = 0.75):
        
        self.similarity_threshold = similarity_threshold
        
        # Initialize components
        logger.info("Initializing CLIP+FAISS retriever...")
        self.retriever = CLIPFAISSRetriever()
        try:
            self.retriever.load(faiss_index_path)
        except:
            logger.warning("No existing FAISS index found")
        
        logger.info("Initializing OCR pipeline...")
        self.ocr = OCRPipeline()
        
        logger.info("Initializing geolocation model...")
        self.geoloc_model = GeolocationModel()
        self.geoloc_trainer = GeolocationTrainer(self.geoloc_model)
        if geoloc_model_path:
            self.geoloc_model.load_state_dict(torch.load(geoloc_model_path))
        
        logger.info("Initializing landmark detector...")
        self.landmark_detector = LandmarkDetector(model_path=landmark_model_path)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def predict_location(self, image: Image.Image) -> Dict:
        """
        Main fusion pipeline:
        1. Query FAISS with CLIP
        2. If match found -> return
        3. Else -> OCR + geocoding
        4. Else -> Geolocation model
        5. Return best result with confidence
        """
        results = {
            "latitude": None,
            "longitude": None,
            "confidence": 0.0,
            "method": None,
            "details": {}
        }
        
        # Step 1: CLIP + FAISS similarity search
        logger.info("Step 1: CLIP+FAISS search")
        faiss_results = self.retriever.search(image, k=3)
        
        if faiss_results and faiss_results[0]['similarity'] >= self.similarity_threshold:
            best_match = faiss_results[0]
            results.update({
                "latitude": best_match.get('latitude'),
                "longitude": best_match.get('longitude'),
                "confidence": best_match['similarity'],
                "method": "faiss_match",
                "details": {
                    "building_name": best_match.get('name'),
                    "matches": faiss_results[:3]
                }
            })
            logger.info(f"FAISS match found with confidence {results['confidence']:.3f}")
            return results
        
        # Step 2: OCR + Geocoding
        logger.info("Step 2: OCR + Geocoding")
        ocr_result = self.ocr.process_image(image)
        
        if ocr_result['success'] and ocr_result['locations']:
            best_location = ocr_result['locations'][0]
            results.update({
                "latitude": float(best_location['latitude']),
                "longitude": float(best_location['longitude']),
                "confidence": float(best_location['confidence']),
                "method": "ocr_geocoding",
                "details": {
                    "extracted_text": str(best_location['source_text']),
                    "address": str(best_location.get('address', '')),
                    "all_texts": [str(t.get('text', '')) for t in ocr_result['texts'][:5]]
                }
            })
            logger.info(f"OCR match found: {best_location['source_text']}")
            return results
        
        # Step 3: Landmark Detection
        logger.info("Step 3: Landmark detection")
        landmarks = self.landmark_detector.predict(image, self.transform, top_k=3)
        
        if landmarks and landmarks[0]['confidence'] > 0.6:
            results['details']['landmarks'] = landmarks
            logger.info(f"Landmark detected: {landmarks[0]['class_name']}")
        
        # Step 4: Geolocation Model
        logger.info("Step 4: Geolocation estimation")
        try:
            lat, lon = self.geoloc_trainer.predict(image, self.transform)
            
            # Calculate confidence based on model uncertainty
            confidence = 0.5 if landmarks else 0.3
            
            results.update({
                "latitude": lat,
                "longitude": lon,
                "confidence": confidence,
                "method": "geolocation_model",
                "details": {
                    **results['details'],
                    "model_prediction": True
                }
            })
            logger.info(f"Geolocation predicted: ({lat:.4f}, {lon:.4f})")
        except Exception as e:
            logger.error(f"Geolocation prediction failed: {e}")
            results['method'] = "failed"
        
        return results
    
    def add_building_to_index(self, image: Image.Image, metadata: Dict):
        """Add new building to FAISS index"""
        self.retriever.add_to_index(image, metadata)
        logger.info(f"Added building to index: {metadata.get('name', 'Unknown')}")
    
    def save_index(self, path: str = "faiss_index"):
        """Save FAISS index"""
        self.retriever.save(path)
