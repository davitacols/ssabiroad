# Medium Priority Features Implementation

## 1. Multi-Image Triangulation (#2)

**Endpoint**: `/api/triangulate`

**Purpose**: Analyze multiple images of the same location from different angles to improve accuracy.

**Usage**:
```javascript
const formData = new FormData();
formData.append('images', image1);
formData.append('images', image2);
formData.append('images', image3);

const response = await fetch('/api/triangulate', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Returns: triangulated location with improved confidence
```

**Response**:
```json
{
  "success": true,
  "location": { "latitude": 6.4541, "longitude": 3.3947 },
  "confidence": 0.85,
  "method": "multi-image-triangulation",
  "sourceLocations": [...],
  "averageDistance": 0.05,
  "maxDistance": 0.12
}
```

## 2. Historical Location Database (#3)

**Endpoint**: `/api/historical-locations`

**Purpose**: Store and retrieve previously recognized locations for faster lookups.

**GET Usage** (Query historical locations):
```javascript
const response = await fetch(
  '/api/historical-locations?lat=6.4541&lng=3.3947&radius=1'
);
const data = await response.json();
// Returns: nearby historical recognitions
```

**POST Usage** (Save new location):
```javascript
const response = await fetch('/api/historical-locations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessName: 'Lekki-Ikoyi Link Bridge',
    address: 'Lagos, Nigeria',
    latitude: 6.4541,
    longitude: 3.3947,
    confidence: 0.95,
    method: 'ai-landmark-detection',
    userId: 'user123'
  })
});
```

## 3. Social Media Integration (#6)

**Endpoint**: `/api/social-share`

**Purpose**: Generate shareable links for social media platforms.

**Usage**:
```javascript
const response = await fetch('/api/social-share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'twitter', // or 'facebook', 'whatsapp', 'telegram'
    locationData: {
      name: 'Lekki-Ikoyi Link Bridge',
      location: { latitude: 6.4541, longitude: 3.3947 },
      address: 'Lagos, Nigeria'
    }
  })
});

const { shareUrl } = await response.json();
window.open(shareUrl, '_blank');
```

**Supported Platforms**:
- Twitter
- Facebook
- WhatsApp
- Telegram

## 4. Batch Processing (#10)

**Endpoint**: `/api/batch-process`

**Purpose**: Process multiple images in a single request.

**Usage**:
```javascript
const formData = new FormData();
images.forEach(image => formData.append('images', image));
formData.append('userId', 'user123');

const response = await fetch('/api/batch-process', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Returns: array of results for each image
```

**Response**:
```json
{
  "success": true,
  "total": 10,
  "processed": 10,
  "results": [
    {
      "index": 0,
      "filename": "image1.jpg",
      "success": true,
      "location": { "latitude": 6.4541, "longitude": 3.3947 },
      "name": "Location Name",
      "confidence": 0.85
    },
    ...
  ]
}
```

**Limits**:
- Maximum 50 images per batch
- 5-minute timeout
- Each image processed sequentially

## Integration Examples

### React Component Example
```jsx
import { useState } from 'react';

function LocationRecognition() {
  const [results, setResults] = useState(null);
  
  const handleBatchUpload = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await fetch('/api/batch-process', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setResults(data.results);
  };
  
  const handleShare = async (location, platform) => {
    const response = await fetch('/api/social-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, locationData: location })
    });
    
    const { shareUrl } = await response.json();
    window.open(shareUrl, '_blank');
  };
  
  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => handleBatchUpload(Array.from(e.target.files))} 
      />
      {results && results.map((result, i) => (
        <div key={i}>
          <h3>{result.name}</h3>
          <button onClick={() => handleShare(result, 'twitter')}>
            Share on Twitter
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Mobile App Example (React Native)
```javascript
import * as ImagePicker from 'expo-image-picker';

async function processMultipleImages() {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images
  });
  
  if (!result.canceled) {
    const formData = new FormData();
    result.assets.forEach(asset => {
      formData.append('images', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
    });
    
    const response = await fetch('https://your-app.vercel.app/api/batch-process', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.results;
  }
}
```

## Performance Considerations

1. **Batch Processing**: Sequential processing ensures stability but may be slow for large batches
2. **Triangulation**: Requires at least 2 images, optimal with 3-5 images
3. **Historical Database**: Indexed by lat/lng for fast queries
4. **Social Sharing**: No API rate limits, generates URLs instantly

## Future Enhancements

- Parallel batch processing
- Real-time progress updates via WebSocket
- Advanced triangulation algorithms (weighted by image quality)
- Social media analytics tracking
- Historical location caching layer
