"""CLIP + FAISS Image Retrieval System"""
import torch
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
import open_clip
from PIL import Image
import pickle
from loguru import logger

class CLIPFAISSRetriever:
    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "openai"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
        self.model = self.model.to(self.device).eval()
        self.index = None
        self.metadata = []
        self.dimension = 512
        
    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Extract CLIP embedding from image"""
        with torch.no_grad():
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)
            embedding = self.model.encode_image(image_input)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            return embedding.cpu().numpy().astype('float32')
    
    def build_index(self, images: List[Image.Image], metadata: List[Dict]):
        """Build FAISS index from images"""
        embeddings = []
        for img in images:
            emb = self.encode_image(img)
            embeddings.append(emb)
        
        embeddings = np.vstack(embeddings)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)
        self.metadata = metadata
        logger.info(f"Built index with {len(metadata)} images")
    
    def add_to_index(self, image: Image.Image, metadata: Dict):
        """Add single image to existing index"""
        if self.index is None:
            self.index = faiss.IndexFlatIP(self.dimension)
        
        embedding = self.encode_image(image)
        self.index.add(embedding)
        self.metadata.append(metadata)
    
    def search(self, query_image: Image.Image, k: int = 5) -> List[Dict]:
        """Search for similar images"""
        if self.index is None or self.index.ntotal == 0:
            return []
        
        query_emb = self.encode_image(query_image)
        distances, indices = self.index.search(query_emb, min(k, self.index.ntotal))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.metadata):
                results.append({
                    **self.metadata[idx],
                    "similarity": float(dist),
                    "confidence": float(dist)
                })
        return results
    
    def save(self, path: str):
        """Save index and metadata"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        
        if self.index:
            faiss.write_index(self.index, str(path / "index.faiss"))
        with open(path / "metadata.pkl", "wb") as f:
            pickle.dump(self.metadata, f)
        logger.info(f"Saved index to {path}")
    
    def load(self, path: str):
        """Load index and metadata"""
        path = Path(path)
        if (path / "index.faiss").exists():
            self.index = faiss.read_index(str(path / "index.faiss"))
            logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
        if (path / "metadata.pkl").exists():
            with open(path / "metadata.pkl", "rb") as f:
                self.metadata = pickle.load(f)
            logger.info(f"Loaded metadata with {len(self.metadata)} entries")
        else:
            logger.warning(f"metadata.pkl not found at {path}")
            self.metadata = []
