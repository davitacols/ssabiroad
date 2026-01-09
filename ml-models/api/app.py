from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(title="NaviSense AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "service": "NaviSense AI", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/training_status")
async def training_status():
    return {"status": "idle", "queue_size": 0, "last_training": None}

@app.get("/training_queue")
async def training_queue():
    return {"queue": [], "total": 0, "should_retrain": False}

@app.get("/stats")
async def stats():
    return {
        "index": {"total_buildings": 0, "index_size": 0},
        "models": {"active_version": None, "total_versions": 0},
        "performance": {},
        "active_learning": {"queue_size": 0, "should_retrain": False}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
