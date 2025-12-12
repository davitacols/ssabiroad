"""Simplified FastAPI Server - No PyTorch dependencies"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
from typing import Optional, Dict
from loguru import logger
import pytesseract

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = FastAPI(title="Pic2Nav ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionResponse(BaseModel):
    latitude: Optional[float]
    longitude: Optional[float]
    confidence: float
    method: str
    details: Dict

@app.get("/")
async def root():
    return {"status": "online", "service": "Pic2Nav ML API (Simple Mode)"}

@app.post("/predict_location", response_model=PredictionResponse)
async def predict_location(file: UploadFile = File(...)):
    """Predict location from image - Simple mode with basic OCR"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        
        # Try pytesseract (no PyTorch dependency)
        try:
            text = pytesseract.image_to_string(image)
            
            if text.strip():
                # Try geocoding
                from geopy.geocoders import Nominatim
                geocoder = Nominatim(user_agent="pic2nav")
                
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                
                for line in lines[:5]:
                    try:
                        location = geocoder.geocode(line, timeout=5)
                        if location:
                            return PredictionResponse(
                                latitude=location.latitude,
                                longitude=location.longitude,
                                confidence=0.7,
                                method="ocr_geocoding",
                                details={"extracted_text": line, "all_text": text[:500]}
                            )
                    except:
                        continue
                
                return PredictionResponse(
                    latitude=None,
                    longitude=None,
                    confidence=0.0,
                    method="ocr_no_match",
                    details={"text": text[:500], "message": "Text extracted but no location found"}
                )
            else:
                # Try EXIF GPS data
                try:
                    from PIL.ExifTags import TAGS, GPSTAGS
                    exif = image._getexif()
                    if exif:
                        for tag, value in exif.items():
                            if TAGS.get(tag) == 'GPSInfo':
                                gps = {GPSTAGS.get(t, t): value[t] for t in value}
                                lat = gps.get('GPSLatitude')
                                lon = gps.get('GPSLongitude')
                                if lat and lon:
                                    lat_val = lat[0] + lat[1]/60 + lat[2]/3600
                                    lon_val = lon[0] + lon[1]/60 + lon[2]/3600
                                    if gps.get('GPSLatitudeRef') == 'S': lat_val = -lat_val
                                    if gps.get('GPSLongitudeRef') == 'W': lon_val = -lon_val
                                    return PredictionResponse(
                                        latitude=lat_val,
                                        longitude=lon_val,
                                        confidence=0.9,
                                        method="exif_gps",
                                        details={"message": "GPS from image metadata"}
                                    )
                except: pass
                
                return PredictionResponse(
                    latitude=None,
                    longitude=None,
                    confidence=0.0,
                    method="no_text",
                    details={"message": "No text or GPS data. Use /api/location-recognition for landmark detection"}
                )
                
        except ImportError as e:
            logger.error(f"Import error: {e}")
            return PredictionResponse(
                latitude=None,
                longitude=None,
                confidence=0.0,
                method="demo_mode",
                details={
                    "message": "OCR not available. Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki",
                    "demo_result": "This is a demo response. Latitude/longitude would appear here with real OCR.",
                    "error": str(e)
                }
            )
        except Exception as e:
            logger.error(f"OCR error: {e}")
            return PredictionResponse(
                latitude=None,
                longitude=None,
                confidence=0.0,
                method="error",
                details={"error": str(e)}
            )
            
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from image"""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        
        try:
            import pytesseract
            text = pytesseract.image_to_string(image)
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            return {
                "success": len(lines) > 0,
                "texts": [{"text": line, "confidence": 0.8} for line in lines],
                "count": len(lines)
            }
        except ImportError:
            return {
                "success": False,
                "texts": [],
                "message": "Tesseract OCR not installed"
            }
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get API statistics"""
    try:
        import pytesseract
        ocr_available = True
    except:
        ocr_available = False
    
    return {
        "status": "running",
        "mode": "simple",
        "models_loaded": {
            "ocr": ocr_available,
            "clip": False,
            "geolocation": False,
            "landmark": False
        },
        "note": "Running in simple mode. Install Tesseract for OCR support."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
