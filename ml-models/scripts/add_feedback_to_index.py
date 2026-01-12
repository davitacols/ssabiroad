"""Add feedback data directly to FAISS index"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from utils.clip_faiss import CLIPFAISSRetriever
from utils.active_learning import ActiveLearningPipeline
from PIL import Image
import json
from loguru import logger

def add_feedback_to_index():
    """Add all queued feedback samples to FAISS index"""
    try:
        # Load FAISS index
        retriever = CLIPFAISSRetriever(index_path="../faiss_index")
        logger.info(f"Loaded FAISS index with {retriever.index.ntotal} items")
        
        # Load active learning queue
        active_learning = ActiveLearningPipeline(data_dir="../data/active_learning")
        samples = active_learning.queue.get("samples", [])
        logger.info(f"Found {len(samples)} samples in queue")
        
        added = 0
        for sample in samples:
            try:
                # Get metadata
                meta = sample.get("metadata", {})
                lat = meta.get("latitude")
                lng = meta.get("longitude")
                
                if lat is None or lng is None:
                    continue
                
                # Check if image exists
                image_path = sample.get("image_path")
                if image_path and Path(image_path).exists():
                    # Load and encode image
                    image = Image.open(image_path).convert('RGB')
                    embedding = retriever.encode_image(image)
                    
                    # Add to index
                    metadata = {
                        "latitude": lat,
                        "longitude": lng,
                        "name": meta.get("businessName") or meta.get("address") or "User Feedback",
                        "address": meta.get("address"),
                        "source": "user_feedback"
                    }
                    
                    retriever.add_to_index(embedding, metadata)
                    added += 1
                    logger.info(f"Added sample {added}/{len(samples)}")
                else:
                    # No image, just add metadata with dummy embedding
                    logger.warning(f"No image for sample, skipping")
            
            except Exception as e:
                logger.error(f"Error adding sample: {e}")
                continue
        
        if added > 0:
            # Save updated index
            retriever.save_index()
            logger.info(f"✅ Added {added} samples to FAISS index")
            logger.info(f"New index size: {retriever.index.ntotal}")
            
            # Clear the queue
            active_learning.queue["samples"] = []
            active_learning.queue["last_training"] = str(Path(__file__).parent.parent / "data" / "active_learning")
            active_learning.save_queue()
            logger.info("✅ Cleared training queue")
        else:
            logger.warning("No samples added to index")
        
        return added
    
    except Exception as e:
        logger.error(f"Failed to add feedback to index: {e}")
        return 0

if __name__ == "__main__":
    added = add_feedback_to_index()
    print(f"\n✅ Successfully added {added} items to FAISS index")
