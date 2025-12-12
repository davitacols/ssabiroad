"""Build FAISS index from building images"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from PIL import Image
import json
from utils.clip_faiss import CLIPFAISSRetriever
from loguru import logger

def build_index_from_directory(data_dir: str, output_path: str = "faiss_index"):
    """Build FAISS index from directory of building images"""
    data_dir = Path(data_dir)
    
    retriever = CLIPFAISSRetriever()
    
    images = []
    metadata = []
    
    logger.info(f"Loading images from {data_dir}")
    
    for img_path in data_dir.glob("**/*.jpg"):
        json_path = img_path.with_suffix('.json')
        
        if json_path.exists():
            try:
                img = Image.open(img_path).convert('RGB')
                
                with open(json_path) as f:
                    meta = json.load(f)
                
                images.append(img)
                metadata.append(meta)
                
                if len(images) % 100 == 0:
                    logger.info(f"Loaded {len(images)} images...")
                    
            except Exception as e:
                logger.warning(f"Failed to load {img_path}: {e}")
    
    logger.info(f"Building FAISS index with {len(images)} images...")
    retriever.build_index(images, metadata)
    
    logger.info(f"Saving index to {output_path}")
    retriever.save(output_path)
    
    logger.info("Done!")

if __name__ == "__main__":
    build_index_from_directory("data/buildings", "faiss_index")
