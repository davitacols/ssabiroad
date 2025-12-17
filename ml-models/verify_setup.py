"""Verify ML system setup"""
print("=" * 60)
print("SSABIRoad ML System - Verification")
print("=" * 60)

# 1. Check Python
import sys
print(f"\n[OK] Python {sys.version.split()[0]}")

# 2. Check critical dependencies
deps = {
    "torch": "PyTorch",
    "PIL": "Pillow",
    "fastapi": "FastAPI",
    "uvicorn": "Uvicorn",
    "numpy": "NumPy"
}

missing = []
for module, name in deps.items():
    try:
        __import__(module)
        print(f"[OK] {name}")
    except ImportError:
        print(f"[MISSING] {name}")
        missing.append(name)

# 3. Check directories
from pathlib import Path
dirs = ["models", "faiss_index", "data/collected"]
for d in dirs:
    if Path(d).exists():
        print(f"[OK] Directory '{d}'")
    else:
        print(f"[MISSING] Directory '{d}'")

# 4. Check files
files = ["api/main.py", "utils/fusion_pipeline.py", "training/orchestrator.py"]
for f in files:
    if Path(f).exists():
        print(f"[OK] File '{f}'")
    else:
        print(f"[MISSING] File '{f}'")

print("\n" + "=" * 60)
if missing:
    print(f"WARNING: Missing dependencies: {', '.join(missing)}")
    print("Install with: pip install -r requirements.txt")
else:
    print("SUCCESS: All checks passed! System is ready.")
    print("\nNext: python start_server.py")
print("=" * 60)
