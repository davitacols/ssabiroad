# Integration Guide: ML Backend with Pic2Nav

## Setup Steps

### 1. Install Dependencies

```bash
cd ml-models
pip install -r requirements-ml.txt
```

### 2. Prepare Data (Optional - for training)

Create data structure:
```
data/
├── buildings/
│   ├── empire_state.jpg
│   ├── empire_state.json  # {"name": "Empire State", "latitude": 40.7484, "longitude": -73.9857}
│   └── ...
├── geolocations/
│   ├── train/
│   └── val/
└── landmarks/
    ├── train/
    └── val/
```

### 3. Build FAISS Index (if you have building data)

```bash
python training/build_faiss_index.py
```

### 4. Start ML Server

```bash
python start_server.py
```

Server runs on `http://localhost:8000`

### 5. Update Next.js Environment

Add to `.env.local`:
```
ML_API_URL=http://localhost:8000
```

### 6. Test Integration

```bash
# Test ML API
python test_api.py

# Test from Next.js
curl -X POST "http://localhost:3000/api/ml-predict" \
  -F "file=@test_image.jpg"
```

## Usage in Next.js Components

### Client Component Example

```typescript
'use client';

import { useState } from 'react';

export default function LocationDetector() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use ML prediction
      const response = await fetch('/api/ml-predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      
      {loading && <p>Analyzing...</p>}
      
      {result && (
        <div>
          <h3>Location Found!</h3>
          <p>Latitude: {result.latitude}</p>
          <p>Longitude: {result.longitude}</p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <p>Method: {result.method}</p>
        </div>
      )}
    </div>
  );
}
```

### Search Similar Buildings

```typescript
const searchSimilar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ml-search?k=5', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.results; // Array of similar buildings
};
```

### Add Building to Index

```typescript
const addBuilding = async (file: File, metadata: {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await fetch('/api/ml-add-building', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};
```

## API Endpoints

### Next.js Routes (Frontend)
- `POST /api/ml-predict` - Predict location from image
- `POST /api/ml-search?k=5` - Search similar buildings
- `POST /api/ml-add-building` - Add building to index

### Python ML Backend (Direct)
- `POST http://localhost:8000/predict_location`
- `POST http://localhost:8000/search?k=5`
- `POST http://localhost:8000/add_to_index`
- `POST http://localhost:8000/ocr`
- `POST http://localhost:8000/detect_landmark`
- `GET http://localhost:8000/stats`

## Production Deployment

### Option 1: Docker

```bash
cd ml-models
docker-compose up -d
```

### Option 2: Separate Server

Deploy ML backend on separate server:
```bash
# On ML server
python start_server.py

# Update Next.js .env
ML_API_URL=https://ml.yourdomain.com
```

### Option 3: Cloud Functions

Deploy as serverless function (AWS Lambda, Google Cloud Functions)

## Performance Optimization

### 1. Use GPU
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"
```

### 2. Batch Processing
Process multiple images in parallel

### 3. Caching
Cache FAISS search results for common queries

### 4. Model Optimization
- Use ONNX for faster inference
- Quantize models for smaller size

## Monitoring

Check ML API health:
```bash
curl http://localhost:8000/stats
```

Response:
```json
{
  "total_buildings": 1500,
  "index_size": 1500,
  "models_loaded": {
    "clip": true,
    "geolocation": true,
    "landmark": true,
    "ocr": true
  }
}
```

## Troubleshooting

### ML Server Not Starting
- Check Python version: `python --version` (need 3.10+)
- Install dependencies: `pip install -r requirements-ml.txt`
- Check port 8000 is available

### Low Accuracy
- Add more buildings to FAISS index
- Train geolocation model with more data
- Adjust similarity threshold

### Slow Performance
- Use GPU: Set `DEVICE=cuda`
- Reduce image size before sending
- Use batch processing

## Next Steps

1. Collect building images with GPS data
2. Build FAISS index with your data
3. Train geolocation model (optional)
4. Train landmark classifier (optional)
5. Integrate with existing Pic2Nav features
6. Monitor and improve accuracy
