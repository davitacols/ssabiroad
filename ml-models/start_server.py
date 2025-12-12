"""Start FastAPI ML server"""
import uvicorn
from loguru import logger

if __name__ == "__main__":
    logger.info("Starting Pic2Nav ML API Server...")
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload to avoid DLL issues
        log_level="info"
    )
