import re
from typing import Dict, List, Optional
import numpy as np

class EnhancedOCR:
    """Enhanced OCR for street signs, shops, and phone numbers"""
    
    LANDMARK_PATTERNS = {
        'banks': ['bank', 'atm', 'credit union', 'savings', 'trust'],
        'malls': ['mall', 'shopping center', 'plaza', 'galleria', 'arcade'],
        'churches': ['church', 'cathedral', 'chapel', 'mosque', 'temple', 'synagogue'],
        'restaurants': ['restaurant', 'cafe', 'diner', 'bistro', 'eatery'],
        'hotels': ['hotel', 'inn', 'lodge', 'resort', 'motel']
    }
    
    def __init__(self):
        self.phone_pattern = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
        self.street_pattern = re.compile(r'\d+\s+[\w\s]+\s+(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr)', re.IGNORECASE)
        
    def extract_all(self, text: str) -> Dict:
        """Extract all information from OCR text"""
        return {
            'business_name': self.extract_business_name(text),
            'phone_numbers': self.extract_phone_numbers(text),
            'addresses': self.extract_addresses(text),
            'landmarks': self.detect_landmarks(text),
            'street_signs': self.extract_street_signs(text)
        }
    
    def extract_business_name(self, text: str) -> Optional[str]:
        """Extract business name from text"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if not lines:
            return None
        
        # First non-empty line is usually business name
        for line in lines[:3]:
            if len(line) > 3 and not self.phone_pattern.search(line):
                return line
        return None
    
    def extract_phone_numbers(self, text: str) -> List[str]:
        """Extract phone numbers"""
        matches = self.phone_pattern.findall(text)
        return [''.join(m) if isinstance(m, tuple) else m for m in matches]
    
    def extract_addresses(self, text: str) -> List[str]:
        """Extract street addresses"""
        return self.street_pattern.findall(text)
    
    def detect_landmarks(self, text: str) -> Dict[str, List[str]]:
        """Detect landmark types"""
        text_lower = text.lower()
        detected = {}
        
        for category, keywords in self.LANDMARK_PATTERNS.items():
            matches = [kw for kw in keywords if kw in text_lower]
            if matches:
                detected[category] = matches
        
        return detected
    
    def extract_street_signs(self, text: str) -> List[str]:
        """Extract street sign names"""
        signs = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Street signs are usually short and contain street type
            if 5 < len(line) < 30 and any(st in line.lower() for st in ['st', 'rd', 'ave', 'blvd', 'ln', 'dr']):
                signs.append(line)
        
        return signs
    
    def confidence_score(self, extracted: Dict) -> float:
        """Calculate confidence based on extracted data"""
        score = 0.0
        if extracted['business_name']:
            score += 0.3
        if extracted['phone_numbers']:
            score += 0.25
        if extracted['addresses']:
            score += 0.25
        if extracted['landmarks']:
            score += 0.1
        if extracted['street_signs']:
            score += 0.1
        return min(score, 1.0)
