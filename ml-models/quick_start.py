"""Quick Start Script - Get ML models running in minutes"""
import sys
from pathlib import Path
from loguru import logger
import json

def check_dependencies():
    """Check if all dependencies are installed"""
    logger.info("Checking dependencies...")
    
    required = [
        "torch", "torchvision", "timm", "open_clip", "faiss",
        "PIL", "cv2", "easyocr", "geopy", "fastapi", "uvicorn"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        logger.error(f"Missing packages: {', '.join(missing)}")
        logger.info("Install with: pip install -r requirements.txt")
        return False
    
    logger.info("✅ All dependencies installed")
    return True

def setup_directories():
    """Create necessary directories"""
    logger.info("Setting up directories...")
    
    dirs = [
        "models",
        "faiss_index",
        "data/collected",
        "data/geolocations/train",
        "data/geolocations/val",
        "data/landmarks/train",
        "data/landmarks/val",
        "data/temp",
        "data/active_learning",
        "models/monitoring"
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    logger.info("✅ Directories created")

def create_sample_data():
    """Create sample data for testing"""
    logger.info("Creating sample data...")
    
    # Create sample metadata
    sample_buildings = [
        {"name": "Sample Bank", "latitude": 6.5244, "longitude": 3.3792, "type": "bank"},
        {"name": "Sample Mall", "latitude": 6.4541, "longitude": 3.3947, "type": "mall"},
        {"name": "Sample Church", "latitude": 6.5355, "longitude": 3.3087, "type": "church"},
    ]
    
    with open("data/collected/sample_buildings.json", "w") as f:
        json.dump(sample_buildings, f, indent=2)
    
    logger.info("✅ Sample data created")

def test_api():
    """Test if API is accessible"""
    import requests
    
    logger.info("Testing API connection...")
    
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            logger.info("✅ API is running")
            return True
    except:
        logger.warning("⚠️  API not running. Start with: python start_server.py")
        return False

def show_next_steps():
    """Show next steps to user"""
    logger.info("\n" + "="*60)
    logger.info("🎉 Setup Complete!")
    logger.info("="*60)
    logger.info("\n📋 Next Steps:\n")
    
    steps = [
        ("1. Start ML Server", "python start_server.py"),
        ("2. Collect Data", "python training/data_collector.py --mode osm"),
        ("3. Train Models", "python training/orchestrator.py --mode full"),
        ("4. Test API", "python test_api.py"),
        ("5. View Docs", "http://localhost:8000/docs"),
    ]
    
    for step, command in steps:
        logger.info(f"  {step}")
        logger.info(f"    → {command}\n")
    
    logger.info("📚 Documentation:")
    logger.info("  - TRAINING_GUIDE.md - Complete training guide")
    logger.info("  - ML_BACKEND_SUMMARY.md - Architecture overview")
    logger.info("  - INTEGRATION_GUIDE.md - API integration\n")
    
    logger.info("💡 Quick Test:")
    logger.info("  1. python start_server.py")
    logger.info("  2. python quick_train.py  (adds 5 famous landmarks)")
    logger.info("  3. Visit http://localhost:3000/ml-test\n")

def main():
    """Main setup function"""
    logger.info("="*60)
    logger.info("SSABIRoad ML Models - Quick Start")
    logger.info("="*60 + "\n")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("Please install dependencies first")
        return
    
    # Setup directories
    setup_directories()
    
    # Create sample data
    create_sample_data()
    
    # Test API (optional)
    test_api()
    
    # Show next steps
    show_next_steps()
    
    logger.info("="*60)
    logger.info("Ready to start training! 🚀")
    logger.info("="*60)

if __name__ == "__main__":
    main()
