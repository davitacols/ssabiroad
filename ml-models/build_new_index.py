"""Build new FAISS index from feedback samples"""
import sys
from pathlib import Path
sys.path.append('/home/ubuntu/ssabiroad/ml-models')

from utils.clip_faiss import CLIPFAISSRetriever
from PIL import Image
import json
import faiss
import pickle

def build_new_index():
    print("Building new FAISS index from feedback samples...")
    
    # Load queue
    queue_file = Path("/home/ubuntu/ssabiroad/ml-models/data/active_learning/training_queue.json")
    with open(queue_file) as f:
        queue = json.load(f)
    
    samples = queue.get("samples", [])
    print(f"Found {len(samples)} samples in queue")
    
    # Initialize retriever
    retriever = CLIPFAISSRetriever()
    
    # Create new index
    dimension = 512  # CLIP ViT-B-32 dimension
    retriever.index = faiss.IndexFlatL2(dimension)
    retriever.metadata = []
    
    added = 0
    for i, sample in enumerate(samples):
        try:
            meta = sample.get("metadata", {})
            lat = meta.get("latitude")
            lng = meta.get("longitude")
            
            if lat is None or lng is None:
                continue
            
            image_path = sample.get("image_path")
            if image_path and Path(image_path).exists():
                # Load and encode
                image = Image.open(image_path).convert('RGB')
                embedding = retriever.encode_image(image)
                
                # Add to index
                metadata = {
                    "latitude": float(lat),
                    "longitude": float(lng),
                    "name": meta.get("businessName") or meta.get("address") or "Feedback",
                    "address": meta.get("address"),
                    "source": "user_feedback"
                }
                
                retriever.add_to_index(embedding, metadata)
                added += 1
                print(f"Added {added}/{len(samples)}: {metadata['name']}")
        except Exception as e:
            print(f"Error: {e}")
            continue
    
    if added > 0:
        # Save new index
        index_dir = Path("/home/ubuntu/ssabiroad/ml-models/faiss_index")
        index_dir.mkdir(exist_ok=True)
        
        faiss.write_index(retriever.index, str(index_dir / "index.faiss"))
        with open(index_dir / "metadata.pkl", "wb") as f:
            pickle.dump(retriever.metadata, f)
        
        print(f"\n✅ Created new index with {added} samples")
        print(f"Index size: {retriever.index.ntotal}")
        
        # Clear queue
        queue["samples"] = []
        queue["last_training"] = "2026-01-10T13:50:00"
        with open(queue_file, "w") as f:
            json.dump(queue, f, indent=2)
        print("✅ Cleared queue")
    else:
        print("❌ No samples added")

if __name__ == "__main__":
    build_new_index()
