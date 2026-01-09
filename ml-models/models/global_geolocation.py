import torch
import torch.nn as nn
import clip
import open_clip
from transformers import AutoModel, AutoTokenizer
import easyocr
import numpy as np
from typing import List, Dict, Tuple
import faiss
from dataclasses import dataclass

@dataclass
class LocationPrediction:
    lat: float
    lon: float
    confidence: float
    method: str
    metadata: Dict

class GlobalGeolocationModel(nn.Module):
    def __init__(self, device='cuda' if torch.cuda.is_available() else 'cpu'):
        super().__init__()
        self.device = device
        
        # CLIP for visual embeddings
        self.clip_model, self.clip_preprocess = clip.load("ViT-L/14", device=device)
        
        # Multilingual CLIP for text
        self.mclip_model, _, self.mclip_preprocess = open_clip.create_model_and_transforms('xlm-roberta-large-ViT-H-14')
        self.mclip_tokenizer = open_clip.get_tokenizer('xlm-roberta-large-ViT-H-14')
        
        # Scene understanding
        self.scene_head = nn.Sequential(
            nn.Linear(768, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256)
        ).to(device)
        
        # Geo-aware reranking head
        self.geo_rerank = nn.Sequential(
            nn.Linear(256 + 2, 128),
            nn.ReLU(),
            nn.Linear(128, 1),
            nn.Sigmoid()
        ).to(device)
        
        # Multilingual OCR
        self.ocr_reader = easyocr.Reader(['en', 'es', 'fr', 'de', 'zh_sim', 'ja', 'ar', 'hi', 'ru', 'pt'], gpu=device=='cuda')
        
    def extract_visual_features(self, image):
        with torch.no_grad():
            image_input = self.clip_preprocess(image).unsqueeze(0).to(self.device)
            features = self.clip_model.encode_image(image_input)
            return features / features.norm(dim=-1, keepdim=True)
    
    def extract_text_features(self, texts: List[str]):
        with torch.no_grad():
            text_tokens = self.mclip_tokenizer(texts).to(self.device)
            features = self.mclip_model.encode_text(text_tokens)
            return features / features.norm(dim=-1, keepdim=True)
    
    def extract_ocr(self, image_np):
        results = self.ocr_reader.readtext(image_np)
        return [{'text': text, 'confidence': conf, 'bbox': bbox} for bbox, text, conf in results]
    
    def scene_understanding(self, visual_features):
        return self.scene_head(visual_features)
    
    def geo_rerank_score(self, scene_features, candidate_coords):
        combined = torch.cat([scene_features, torch.tensor(candidate_coords).to(self.device)], dim=-1)
        return self.geo_rerank(combined).item()

class GlobalLocationPredictor:
    def __init__(self, model: GlobalGeolocationModel, index_path: str):
        self.model = model
        self.faiss_index = faiss.read_index(index_path)
        self.location_db = []  # Load from database
        
    def predict_topk(self, image, k=5) -> List[LocationPrediction]:
        # Visual embedding
        visual_feat = self.model.extract_visual_features(image)
        
        # FAISS search
        D, I = self.faiss_index.search(visual_feat.cpu().numpy(), k*3)
        candidates = [self.location_db[i] for i in I[0]]
        
        # OCR extraction
        ocr_results = self.model.extract_ocr(np.array(image))
        
        # Scene understanding
        scene_feat = self.model.scene_understanding(visual_feat)
        
        # Geo-aware reranking
        reranked = []
        for idx, cand in enumerate(candidates):
            base_score = 1 - (D[0][idx] / D[0].max())
            geo_score = self.model.geo_rerank_score(scene_feat, [cand['lat'], cand['lon']])
            ocr_boost = self._ocr_match_score(ocr_results, cand.get('text_data', []))
            
            final_score = 0.5 * base_score + 0.3 * geo_score + 0.2 * ocr_boost
            reranked.append(LocationPrediction(
                lat=cand['lat'],
                lon=cand['lon'],
                confidence=final_score,
                method='multimodal_fusion',
                metadata={'ocr': ocr_results, 'scene': cand.get('scene_type')}
            ))
        
        return sorted(reranked, key=lambda x: x.confidence, reverse=True)[:k]
    
    def _ocr_match_score(self, ocr_results, reference_texts):
        if not ocr_results or not reference_texts:
            return 0.0
        ocr_texts = [r['text'].lower() for r in ocr_results]
        matches = sum(1 for ref in reference_texts if any(ref.lower() in ocr for ocr in ocr_texts))
        return matches / len(reference_texts) if reference_texts else 0.0
