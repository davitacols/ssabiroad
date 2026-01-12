"""Check FAISS index and metadata consistency"""
import faiss
import pickle
from pathlib import Path

index_path = Path("../faiss_index")

# Check FAISS index
if (index_path / "index.faiss").exists():
    index = faiss.read_index(str(index_path / "index.faiss"))
    print(f"✓ FAISS index found: {index.ntotal} vectors")
else:
    print("✗ FAISS index not found")

# Check metadata
if (index_path / "metadata.pkl").exists():
    with open(index_path / "metadata.pkl", "rb") as f:
        metadata = pickle.load(f)
    print(f"✓ Metadata found: {len(metadata)} entries")
    
    if len(metadata) != index.ntotal:
        print(f"⚠ MISMATCH: {index.ntotal} vectors but {len(metadata)} metadata entries")
else:
    print("✗ metadata.pkl not found - THIS IS THE PROBLEM")
    print("\nCreating placeholder metadata...")
    metadata = [{"name": f"building_{i}", "latitude": 0, "longitude": 0} for i in range(index.ntotal)]
    with open(index_path / "metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)
    print(f"✓ Created metadata.pkl with {len(metadata)} placeholder entries")
