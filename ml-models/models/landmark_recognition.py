"""
Landmark Recognition Model using Google Landmarks Dataset v2
Integrates with SSABIRoad location recognition system
"""

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import pandas as pd
import numpy as np
from pathlib import Path
import faiss
import pickle

class LandmarkRecognitionModel:
    """Landmark recognition using ResNet101-ArcFace baseline"""
    
    def __init__(self, model_path=None, metadata_path="data/google-landmarks-v2/metadata"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model()
        self.metadata_path = Path(metadata_path)
        self.landmark_index = None
        self.landmark_metadata = None
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        
        self._load_metadata()
        
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def _build_model(self):
        """Build ResNet101 feature extractor"""
        model = models.resnet101(pretrained=True)
        # Remove final classification layer
        model = nn.Sequential(*list(model.children())[:-1])
        model.eval()
        return model.to(self.device)
    
    def _load_metadata(self):
        """Load landmark metadata"""
        try:
            # Load hierarchical labels
            hier_file = self.metadata_path / "train_label_to_hierarchical.csv"
            if hier_file.exists():
                self.landmark_metadata = pd.read_csv(hier_file)
                print(f"Loaded {len(self.landmark_metadata)} landmark labels")
            
            # Load category mapping
            cat_file = self.metadata_path / "train_label_to_category.csv"
            if cat_file.exists():
                categories = pd.read_csv(cat_file)
                if self.landmark_metadata is not None:
                    self.landmark_metadata = self.landmark_metadata.merge(
                        categories, on='landmark_id', how='left'
                    )
        except Exception as e:
            print(f"Warning: Could not load metadata: {e}")
    
    def extract_features(self, image_path):
        """Extract features from image"""
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            features = self.model(image_tensor)
            features = features.squeeze().cpu().numpy()
            # L2 normalize
            features = features / np.linalg.norm(features)
        
        return features
    
    def build_index(self, features_dir, save_path="data/landmark_index.faiss"):
        """Build FAISS index from extracted features"""
        print("Building landmark index...")
        
        features_list = []
        landmark_ids = []
        
        # Load all feature files
        features_path = Path(features_dir)
        for feat_file in features_path.glob("*.npy"):
            features = np.load(feat_file)
            landmark_id = int(feat_file.stem)
            features_list.append(features)
            landmark_ids.append(landmark_id)
        
        if not features_list:
            print("No features found!")
            return
        
        # Create FAISS index
        features_array = np.vstack(features_list).astype('float32')
        dimension = features_array.shape[1]
        
        index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        index.add(features_array)
        
        # Save index
        faiss.write_index(index, save_path)
        
        # Save landmark IDs mapping
        with open(save_path.replace('.faiss', '_ids.pkl'), 'wb') as f:
            pickle.dump(landmark_ids, f)
        
        print(f"Index built with {len(features_list)} landmarks")
        self.landmark_index = index
    
    def load_index(self, index_path="data/landmark_index.faiss"):
        """Load pre-built FAISS index"""
        if not Path(index_path).exists():
            print(f"Index not found: {index_path}")
            return False
        
        self.landmark_index = faiss.read_index(index_path)
        
        # Load landmark IDs
        ids_path = index_path.replace('.faiss', '_ids.pkl')
        with open(ids_path, 'rb') as f:
            self.landmark_ids = pickle.load(f)
        
        print(f"Loaded index with {self.landmark_index.ntotal} landmarks")
        return True
    
    def recognize_landmark(self, image_path, top_k=5):
        """Recognize landmark in image"""
        if self.landmark_index is None:
            return {"error": "Index not loaded"}
        
        # Extract features
        features = self.extract_features(image_path)
        features = features.reshape(1, -1).astype('float32')
        
        # Search index
        distances, indices = self.landmark_index.search(features, top_k)
        
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            landmark_id = self.landmark_ids[idx]
            
            # Get metadata
            metadata = {}
            if self.landmark_metadata is not None:
                landmark_info = self.landmark_metadata[
                    self.landmark_metadata['landmark_id'] == landmark_id
                ]
                if not landmark_info.empty:
                    metadata = landmark_info.iloc[0].to_dict()
            
            results.append({
                'rank': i + 1,
                'landmark_id': int(landmark_id),
                'confidence': float(dist),
                'category': metadata.get('category', 'Unknown'),
                'hierarchical_label': metadata.get('hierarchical_label', ''),
                'type': metadata.get('natural_or_human_made', 'unknown')
            })
        
        return {
            'success': True,
            'landmarks': results,
            'top_match': results[0] if results else None
        }
    
    def save_model(self, path):
        """Save model weights"""
        torch.save(self.model.state_dict(), path)
    
    def load_model(self, path):
        """Load model weights"""
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.eval()

def integrate_with_location_recognition(landmark_result, location_data):
    """Integrate landmark recognition with location data"""
    if not landmark_result.get('success'):
        return location_data
    
    top_match = landmark_result.get('top_match')
    if not top_match:
        return location_data
    
    # Enhance location data with landmark info
    location_data['landmark_recognition'] = {
        'detected': True,
        'landmark_id': top_match['landmark_id'],
        'confidence': top_match['confidence'],
        'category': top_match['category'],
        'type': top_match['type'],
        'hierarchical_label': top_match['hierarchical_label']
    }
    
    # Boost confidence if landmark detected
    if top_match['confidence'] > 0.7:
        location_data['confidence'] = min(
            location_data.get('confidence', 0.5) * 1.2, 
            0.98
        )
        location_data['method'] = 'landmark_recognition'
    
    return location_data

if __name__ == "__main__":
    # Example usage
    model = LandmarkRecognitionModel()
    
    # Build index (run once)
    # model.build_index("data/google-landmarks-v2/features")
    
    # Load index
    if model.load_index():
        # Test recognition
        result = model.recognize_landmark("test_image.jpg")
        print(result)
