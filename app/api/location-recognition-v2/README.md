# Location Recognition V2 - Enhanced with AI Vision

## Overview
The location-recognition-v2 API identifies locations from images using a multi-layered approach that works even without EXIF GPS data.

## Enhanced Capabilities

### 1. EXIF GPS Extraction (Primary Method - Highest Accuracy)
- Extracts GPS coordinates from image metadata
- Multiple extraction methods including binary search
- Confidence: 0.95

### 2. AI Vision Analysis (New - Medium Accuracy)
When no EXIF GPS data is found:

**Landmark Detection**
- Identifies famous buildings, monuments, landmarks
- Uses Google Vision API landmark recognition
- Confidence: 0.8+

**Business Logo Recognition**
- Detects business logos and brand signs
- Searches for business locations via Google Places
- Confidence: 0.75+

**Text Analysis for Businesses**
- Extracts business names from signs and text
- Pattern matching for common business types
- Geocodes business names to locations
- Confidence: 0.7+

**Address Extraction**
- Identifies street addresses in images
- Geocodes addresses to coordinates
- Confidence: 0.65+

### 3. Device Location Fallback (Low Accuracy)
- Uses provided device coordinates when AI analysis fails
- Confidence: 0.4
- Clearly indicates the data source and limitations

## API Usage

```javascript
// POST /api/location-recognition-v2
const formData = new FormData();
formData.append('image', imageFile);
formData.append('latitude', deviceLat);  // Optional fallback
formData.append('longitude', deviceLng); // Optional fallback

const response = await fetch('/api/location-recognition-v2', {
  method: 'POST',
  body: formData
});
```

## Response Format

```json
{
  "success": true,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
  "location": {
    "latitude": 48.8584,
    "longitude": 2.2945
  },
  "confidence": 0.92,
  "method": "ai-landmark-detection",
  "description": "Famous iron lattice tower in Paris",
  "nearbyPlaces": [...],
  "photos": [...],
  "weather": {...},
  "note": "Location identified using AI vision analysis"
}
```

## Detection Methods

1. **exif-gps-standard** - Standard EXIF GPS extraction
2. **exif-gps-binary** - Binary search for GPS data  
3. **ai-landmark-detection** - Famous landmarks and monuments
4. **ai-logo-detection** - Business logos and brand recognition
5. **ai-text-business** - Business names from text analysis
6. **ai-text-address** - Street addresses from text
7. **claude-ai-analysis** - Advanced AI image interpretation
8. **device-location-fallback** - Device GPS coordinates

## Error Handling

The API provides helpful error messages and suggestions:
- Guides users on how to improve results
- Explains why location detection failed
- Suggests alternative approaches

## Performance

- Vision API calls timeout after 5 seconds
- Parallel processing for text, landmark, logo, and label detection
- Results cached for 5 minutes
- Optimized for speed and accuracy

## Requirements

Environment variables needed:
- `GCLOUD_CREDENTIALS` - Base64 encoded Google Cloud service account
- `GOOGLE_PLACES_API_KEY` - Google Places API key (for geocoding)
- `ANTHROPIC_API_KEY` - Claude AI API key (for advanced analysis)

## Success Scenarios

✅ **Images with EXIF GPS** - Direct coordinate extraction  
✅ **Famous landmarks** - Eiffel Tower, Statue of Liberty, etc.  
✅ **Business storefronts** - McDonald's, Starbucks, local businesses  
✅ **Street signs with addresses** - Clear address text  
✅ **Corporate logos** - Recognizable brand signage  

## Limitations

❌ **Generic indoor scenes** - No identifying features  
❌ **Nature photos** - Without landmarks or signs  
❌ **Blurry text** - Unreadable signs or addresses  
❌ **Private locations** - Homes without visible addresses