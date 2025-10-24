import numpy as np
from landmark_classifier import LandmarkClassifier
from location_embeddings import LocationEmbedding
from gps_predictor import GPSPredictor
import json

class EnsembleLocationPredictor:
    """Ensemble model combining multiple approaches"""
    
    def __init__(self):
        self.landmark_model = LandmarkClassifier()
        self.embedding_model = LocationEmbedding()
        self.gps_model = GPSPredictor()
        self.location_database = {}
    
    def load_models(self, landmark_path, gps_path):
        """Load pre-trained models"""
        try:
            self.landmark_model.load(landmark_path)
            self.gps_model.model = keras.models.load_model(gps_path)
            print("Models loaded successfully")
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def predict_location(self, image, gps_hint=None):
        """Predict location using ensemble approach"""
        results = {}
        
        # 1. Landmark classification
        landmarks = self.landmark_model.predict(image, top_k=5)
        results['landmarks'] = landmarks
        
        # 2. GPS prediction
        if gps_hint is None:
            gps_pred = self.gps_model.predict_gps(image)
            results['predicted_gps'] = gps_pred
            confidence = 0.3  # Lower confidence without GPS hint
        else:
            gps_pred = gps_hint
            confidence = 0.8  # Higher confidence with GPS hint
        
        # 3. Find similar locations
        if gps_hint:
            embedding = self.embedding_model.get_embedding(image, 
                [gps_hint['latitude'], gps_hint['longitude']])
            similar = self.find_similar_locations(embedding, top_k=5)
            results['similar_locations'] = similar
        
        # 4. Combine predictions
        final_prediction = self.combine_predictions(
            landmarks, gps_pred, confidence
        )
        
        return {
            'location': final_prediction,
            'confidence': confidence,
            'details': results
        }
    
    def combine_predictions(self, landmarks, gps, confidence):
        """Combine multiple prediction sources"""
        # Weight landmark predictions
        if landmarks and landmarks[0]['confidence'] > 0.7:
            return {
                'source': 'landmark',
                'landmark_id': landmarks[0]['class_id'],
                'gps': gps,
                'confidence': landmarks[0]['confidence']
            }
        
        # Fall back to GPS prediction
        return {
            'source': 'gps',
            'gps': gps,
            'confidence': confidence
        }
    
    def find_similar_locations(self, embedding, top_k=5):
        """Find similar locations from database"""
        similarities = []
        for loc_id, loc_data in self.location_database.items():
            sim = self.embedding_model.compute_similarity(
                embedding, loc_data['embedding']
            )
            similarities.append({
                'location_id': loc_id,
                'similarity': float(sim),
                'name': loc_data.get('name', 'Unknown')
            })
        
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]
    
    def add_to_database(self, location_id, image, gps, metadata):
        """Add location to database"""
        embedding = self.embedding_model.get_embedding(image, 
            [gps['latitude'], gps['longitude']])
        
        self.location_database[location_id] = {
            'embedding': embedding,
            'gps': gps,
            'metadata': metadata,
            'name': metadata.get('name', 'Unknown')
        }
    
    def save_database(self, path):
        """Save location database"""
        db_data = {
            loc_id: {
                'embedding': loc_data['embedding'].tolist(),
                'gps': loc_data['gps'],
                'metadata': loc_data['metadata'],
                'name': loc_data['name']
            }
            for loc_id, loc_data in self.location_database.items()
        }
        
        with open(path, 'w') as f:
            json.dump(db_data, f)
    
    def load_database(self, path):
        """Load location database"""
        with open(path, 'r') as f:
            db_data = json.load(f)
        
        self.location_database = {
            loc_id: {
                'embedding': np.array(loc_data['embedding']),
                'gps': loc_data['gps'],
                'metadata': loc_data['metadata'],
                'name': loc_data['name']
            }
            for loc_id, loc_data in db_data.items()
        }

if __name__ == '__main__':
    predictor = EnsembleLocationPredictor()
    print("Ensemble predictor created")
    print("Ready for location prediction")
