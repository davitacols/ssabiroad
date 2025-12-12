"""Start simplified server without PyTorch"""
import uvicorn
from loguru import logger

if __name__ == "__main__":
    logger.info("Starting Pic2Nav ML API Server (Simple Mode - No PyTorch)...")
    uvicorn.run(
        "api.main_simple:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )
