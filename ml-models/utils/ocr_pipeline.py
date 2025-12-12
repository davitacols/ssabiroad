"""OCR Pipeline for Street Signs and Landmarks"""
import easyocr
import re
from typing import List, Dict, Optional
from PIL import Image
import numpy as np
from geopy.geocoders import Nominatim
from loguru import logger

class OCRPipeline:
    def __init__(self, languages: List[str] = ['en']):
        self.reader = easyocr.Reader(languages, gpu=True if __import__('torch').cuda.is_available() else False)
        self.geocoder = Nominatim(user_agent="pic2nav")
    
    def extract_text(self, image: Image.Image) -> List[Dict]:
        """Extract text from image with bounding boxes"""
        img_array = np.array(image)
        results = self.reader.readtext(img_array)
        
        extracted = []
        for bbox, text, confidence in results:
            extracted.append({
                "text": text,
                "confidence": float(confidence),
                "bbox": bbox
            })
        return extracted
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        text = re.sub(r'[^\w\s,.-]', '', text)
        text = ' '.join(text.split())
        return text.strip()
    
    def extract_addresses(self, texts: List[Dict]) -> List[str]:
        """Extract potential addresses from text"""
        addresses = []
        patterns = [
            r'\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)',
            r'[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s*\d{5}',
        ]
        
        for item in texts:
            text = item['text']
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                addresses.extend(matches)
        
        return [self.clean_text(addr) for addr in addresses]
    
    def geocode_text(self, text: str) -> Optional[Dict]:
        """Convert text to coordinates using geocoding"""
        # Skip single digits or very short text
        if len(text.strip()) < 3 or text.strip().isdigit():
            return None
        
        try:
            location = self.geocoder.geocode(text, timeout=5)
            if location:
                return {
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "address": location.address,
                    "confidence": 0.7
                }
        except Exception as e:
            logger.warning(f"Geocoding failed for '{text}': {e}")
        return None
    
    def process_image(self, image: Image.Image) -> Dict:
        """Full OCR pipeline: extract -> clean -> geocode"""
        extracted = self.extract_text(image)
        
        if not extracted:
            return {"success": False, "texts": [], "locations": []}
        
        # Extract high-confidence texts
        high_conf_texts = [item for item in extracted if item['confidence'] > 0.5]
        
        # Try to find addresses
        addresses = self.extract_addresses(high_conf_texts)
        
        # Geocode results
        locations = []
        for addr in addresses[:3]:  # Limit to top 3
            result = self.geocode_text(addr)
            if result:
                result['source_text'] = addr
                locations.append(result)
        
        # Also try individual high-confidence texts (skip phone numbers and short text)
        if not locations:
            for item in high_conf_texts[:5]:
                text = item['text'].strip()
                # Skip phone numbers, single words < 5 chars, pure numbers
                if len(text) < 5 or text.replace(' ', '').isdigit() or any(c in text for c in ['(', ')']):
                    continue
                result = self.geocode_text(text)
                if result:
                    result['source_text'] = text
                    locations.append(result)
        
        return {
            "success": len(locations) > 0,
            "texts": extracted,
            "locations": locations
        }
