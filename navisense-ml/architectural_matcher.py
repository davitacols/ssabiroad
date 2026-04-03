import json
import os
from typing import Dict, List, Tuple

import boto3
import numpy as np
from botocore.exceptions import ClientError
from sklearn.metrics.pairwise import cosine_similarity

class ArchitecturalMatcher:
    """Enhanced multi-view matching for buildings from different angles"""
    def __init__(self):
        self.building_features = {}
        self.feature_weights = {
            'embedding': 0.35,
            'roof_pattern': 0.15,
            'window_pattern': 0.15,
            'facade_style': 0.15,
            'height_estimate': 0.05,
            'color_profile': 0.10,
            'texture_pattern': 0.05
        }
        self.artifact_path = os.getenv("ARCHITECTURAL_FEATURES_PATH", "architectural_features.json")
        self.artifact_bucket = os.getenv("ML_ARTIFACTS_BUCKET") or os.getenv("AWS_S3_BUCKET_NAME")
        self.artifact_key = os.getenv(
            "ARCHITECTURAL_FEATURES_S3_KEY",
            "navisense-ml-artifacts/architectural_features.json"
        )
        self.s3_client = self._build_s3_client()

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
            print(f"Failed to initialize architectural artifact S3 client: {e}")
            return None
        
    def extract_features(self, embedding: np.ndarray, metadata: dict) -> Dict:
        """Extract comprehensive architectural features from embedding"""
        return {
            'embedding': embedding,
            'roof_pattern': self._detect_roof(embedding),
            'window_pattern': self._detect_windows(embedding),
            'facade_style': self._detect_facade(embedding),
            'color_profile': self._extract_colors(embedding),
            'height_estimate': self._estimate_height(embedding),
            'texture_pattern': self._detect_texture(embedding),
            'architectural_style': self._detect_style(embedding),
            'building_age': self._estimate_age(embedding),
            'symmetry_score': self._calculate_symmetry(embedding)
        }

    @staticmethod
    def _slice_by_ratio(emb: np.ndarray, start_ratio: float, end_ratio: float, minimum_width: int = 8) -> np.ndarray:
        embedding_length = max(int(len(emb)), 1)
        start_index = min(int(embedding_length * start_ratio), embedding_length - 1)
        end_index = max(start_index + minimum_width, int(np.ceil(embedding_length * end_ratio)))
        end_index = min(end_index, embedding_length)

        segment = emb[start_index:end_index]
        if segment.size == 0:
            return emb
        return segment
    
    def _detect_roof(self, emb: np.ndarray) -> str:
        """Detect roof type from embedding features"""
        roof_features = self._slice_by_ratio(emb, 0.0, 0.1)
        roof_score = np.mean(roof_features)
        
        if roof_score < -0.3: return 'flat'
        elif roof_score < -0.1: return 'pitched'
        elif roof_score < 0.1: return 'gabled'
        elif roof_score < 0.3: return 'hipped'
        else: return 'dome'
    
    def _detect_windows(self, emb: np.ndarray) -> str:
        """Detect window pattern and style"""
        window_features = self._slice_by_ratio(emb, 0.1, 0.2)
        pattern_variance = np.var(window_features)
        pattern_mean = np.mean(window_features)
        
        if pattern_variance > 0.5:
            return 'irregular'
        elif pattern_mean > 0.2:
            return 'large_modern'
        elif pattern_mean > 0.0:
            return 'grid_traditional'
        elif pattern_mean > -0.2:
            return 'arched_classical'
        else:
            return 'small_windows'
    
    def _detect_facade(self, emb: np.ndarray) -> str:
        """Detect facade material and style"""
        facade_features = self._slice_by_ratio(emb, 0.2, 0.3)
        texture_intensity = np.std(facade_features)
        color_intensity = np.mean(np.abs(facade_features))
        
        if texture_intensity > 0.4:
            return 'textured_stone'
        elif texture_intensity > 0.3:
            return 'brick'
        elif color_intensity > 0.3:
            return 'painted_concrete'
        elif color_intensity > 0.1:
            return 'glass_modern'
        else:
            return 'smooth_concrete'
    
    def _extract_colors(self, emb: np.ndarray) -> List[float]:
        """Extract dominant color profile with more precision"""
        color_region = self._slice_by_ratio(emb, 0.39, 0.43, minimum_width=6)
        # Normalize to 0-1 range for color representation
        normalized_colors = (color_region - np.min(color_region)) / (np.max(color_region) - np.min(color_region) + 1e-8)
        return normalized_colors[:3].tolist()
    
    def _estimate_height(self, emb: np.ndarray) -> str:
        """Estimate building height category"""
        height_features = self._slice_by_ratio(emb, 0.59, 0.63)
        height_score = np.mean(height_features)
        
        if height_score < -0.3: return 'single_story'
        elif height_score < -0.1: return 'low_rise'
        elif height_score < 0.1: return 'mid_rise'
        elif height_score < 0.3: return 'high_rise'
        else: return 'skyscraper'
    
    def _detect_texture(self, emb: np.ndarray) -> str:
        """Detect surface texture patterns"""
        texture_features = self._slice_by_ratio(emb, 0.78, 0.88)
        texture_complexity = np.std(texture_features)
        
        if texture_complexity > 0.4: return 'highly_textured'
        elif texture_complexity > 0.2: return 'moderately_textured'
        else: return 'smooth'
    
    def _detect_style(self, emb: np.ndarray) -> str:
        """Detect architectural style"""
        style_features = self._slice_by_ratio(emb, 0.88, 0.98)
        style_score = np.mean(style_features)
        
        if style_score > 0.3: return 'modern'
        elif style_score > 0.1: return 'contemporary'
        elif style_score > -0.1: return 'traditional'
        elif style_score > -0.3: return 'classical'
        else: return 'historical'
    
    def _estimate_age(self, emb: np.ndarray) -> str:
        """Estimate building age category"""
        age_indicators = self._slice_by_ratio(emb, 0.68, 0.78)
        wear_score = np.mean(np.abs(age_indicators))
        
        if wear_score > 0.4: return 'very_old'
        elif wear_score > 0.3: return 'old'
        elif wear_score > 0.2: return 'mature'
        elif wear_score > 0.1: return 'recent'
        else: return 'new'
    
    def _calculate_symmetry(self, emb: np.ndarray) -> float:
        """Calculate architectural symmetry score"""
        midpoint = max(len(emb) // 2, 1)
        left_half = emb[:midpoint]
        right_half = emb[midpoint:]
        
        # Pad if necessary
        if len(right_half) < len(left_half):
            right_half = np.pad(right_half, (0, len(left_half) - len(right_half)))
        
        symmetry = 1.0 - np.mean(np.abs(left_half - right_half))
        return max(0.0, min(1.0, symmetry))
    
    def match_building(self, query_emb: np.ndarray, candidates: List[Dict]) -> List[Tuple[str, float]]:
        """Enhanced building matching across multiple views"""
        query_features = self.extract_features(query_emb, {})
        matches = []
        
        for cand in candidates:
            cand_values = cand.get('embedding')
            if cand_values is None:
                continue

            cand_emb = np.array(cand_values)
            if cand_emb.shape != query_emb.shape:
                continue

            cand_features = self.extract_features(cand_emb, {})
            
            # Calculate individual feature similarities
            similarities = {}
            
            # Embedding similarity (semantic)
            similarities['embedding'] = cosine_similarity([query_emb], [cand_emb])[0][0]
            
            # Categorical feature matching
            similarities['roof_pattern'] = 1.0 if query_features['roof_pattern'] == cand_features['roof_pattern'] else 0.0
            similarities['window_pattern'] = 1.0 if query_features['window_pattern'] == cand_features['window_pattern'] else 0.3
            similarities['facade_style'] = 1.0 if query_features['facade_style'] == cand_features['facade_style'] else 0.2
            similarities['height_estimate'] = 1.0 if query_features['height_estimate'] == cand_features['height_estimate'] else 0.5
            similarities['texture_pattern'] = 1.0 if query_features['texture_pattern'] == cand_features['texture_pattern'] else 0.4
            
            # Color similarity (continuous)
            color_diff = np.linalg.norm(
                np.array(query_features['color_profile']) - np.array(cand_features['color_profile'])
            )
            similarities['color_profile'] = max(0.0, 1.0 - color_diff / np.sqrt(3))
            
            # Weighted final score
            final_score = sum(
                similarities[feature] * weight 
                for feature, weight in self.feature_weights.items()
                if feature in similarities
            )
            
            # Bonus for architectural consistency
            style_bonus = 0.05 if query_features['architectural_style'] == cand_features['architectural_style'] else 0.0
            age_bonus = 0.03 if query_features['building_age'] == cand_features['building_age'] else 0.0
            
            final_score += style_bonus + age_bonus
            
            matches.append((cand.get('id', 'unknown'), float(final_score)))
        
        return sorted(matches, key=lambda x: x[1], reverse=True)
    
    def add_building(self, building_id: str, embedding: np.ndarray, metadata: dict):
        """Add building to architectural database with features"""
        features = self.extract_features(embedding, metadata)
        if building_id not in self.building_features:
            self.building_features[building_id] = []
        self.building_features[building_id].append(features)
        
        # Save to disk periodically
        if len(self.building_features) % 10 == 0:
            self.save_features()
    
    def save_features(self):
        """Save architectural features to disk"""
        try:
            # Convert numpy arrays to lists for JSON serialization
            serializable_features = {}
            for building_id, feature_list in self.building_features.items():
                serializable_features[building_id] = []
                for features in feature_list:
                    serializable_feature = {}
                    for key, value in features.items():
                        if isinstance(value, np.ndarray):
                            serializable_feature[key] = value.tolist()
                        else:
                            serializable_feature[key] = value
                    serializable_features[building_id].append(serializable_feature)
            
            payload = json.dumps(serializable_features)

            with open(self.artifact_path, 'w') as f:
                f.write(payload)

            if self.s3_client and self.artifact_bucket:
                self.s3_client.put_object(
                    Bucket=self.artifact_bucket,
                    Key=self.artifact_key,
                    Body=payload.encode("utf-8"),
                    ContentType="application/json"
                )
        except Exception as e:
            print(f"Failed to save architectural features: {e}")
    
    def load_features(self):
        """Load architectural features from disk"""
        try:
            serializable_features = None

            if self.s3_client and self.artifact_bucket:
                try:
                    payload = self.s3_client.get_object(
                        Bucket=self.artifact_bucket,
                        Key=self.artifact_key
                    )["Body"].read().decode("utf-8")
                    serializable_features = json.loads(payload)
                    print("Loaded architectural features from S3 artifact")
                except ClientError as e:
                    error_code = e.response.get("Error", {}).get("Code")
                    if error_code not in {"NoSuchKey", "404"}:
                        print(f"Failed to load architectural features from S3: {e}")
                except Exception as e:
                    print(f"Failed to load architectural features from S3: {e}")

            if serializable_features is None and os.path.exists(self.artifact_path):
                with open(self.artifact_path, 'r') as f:
                    serializable_features = json.load(f)
                print("Loaded architectural features from local artifact")

            if serializable_features:
                
                # Convert lists back to numpy arrays
                for building_id, feature_list in serializable_features.items():
                    self.building_features[building_id] = []
                    for features in feature_list:
                        restored_features = {}
                        for key, value in features.items():
                            if key == 'embedding' and isinstance(value, list):
                                restored_features[key] = np.array(value)
                            else:
                                restored_features[key] = value
                        self.building_features[building_id].append(restored_features)
                        
                print(f"Loaded architectural features for {len(self.building_features)} buildings")
        except Exception as e:
            print(f"Failed to load architectural features: {e}")
    
    def get_building_summary(self, building_id: str) -> Dict:
        """Get architectural summary for a building"""
        if building_id not in self.building_features:
            return {"error": "Building not found"}
        
        features_list = self.building_features[building_id]
        if not features_list:
            return {"error": "No features available"}
        
        # Aggregate features across all views
        summary = {
            "total_views": len(features_list),
            "roof_patterns": list(set(f['roof_pattern'] for f in features_list)),
            "window_patterns": list(set(f['window_pattern'] for f in features_list)),
            "facade_styles": list(set(f['facade_style'] for f in features_list)),
            "architectural_styles": list(set(f['architectural_style'] for f in features_list)),
            "height_estimates": list(set(f['height_estimate'] for f in features_list)),
            "building_ages": list(set(f['building_age'] for f in features_list)),
            "average_symmetry": np.mean([f['symmetry_score'] for f in features_list])
        }
        
        return summary

