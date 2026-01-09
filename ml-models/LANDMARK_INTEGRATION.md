# Google Landmarks Dataset v2 Integration

## Quick Start

### 1. Download Dataset

```bash
# Download metadata and sample images
cd scripts
python download_gldv2.py
```

This downloads:
- All metadata files
- Ground truth files
- First 5 training tar files (~5GB)

### 2. Train Model

```bash
cd ml-models/training
python train_landmarks.py
```

This will:
- Extract features from training images
- Build FAISS index for fast retrieval
- Save model to `data/landmark_index.faiss`

### 3. Start ML API

```bash
cd ml-models
python start_server.py
```

The landmark recognition endpoint will be available at:
`http://localhost:8000/recognize-landmark`

### 4. Test Recognition

```bash
curl -X POST http://localhost:8000/recognize-landmark \
  -F "image=@test_image.jpg"
```

## API Usage

### Recognize Landmark

**Endpoint**: `POST /api/landmark-recognition`

**Request**:
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/landmark-recognition', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response**:
```json
{
  "success": true,
  "landmarks": [
    {
      "rank": 1,
      "landmark_id": 12345,
      "confidence": 0.92,
      "category": "https://commons.wikimedia.org/wiki/Category:Eiffel_Tower",
      "hierarchical_label": "Structure/Tower/Observation Tower",
      "type": "human-made"
    }
  ],
  "topMatch": { ... },
  "method": "google_landmarks_v2"
}
```

## Dataset Structure

```
data/google-landmarks-v2/
├── metadata/
│   ├── train.csv
│   ├── train_label_to_hierarchical.csv
│   ├── index.csv
│   └── ...
├── train/
│   └── [image files in a/b/c/id.jpg structure]
├── features/
│   └── [extracted features per landmark]
└── landmark_index.faiss
```

## Model Architecture

- **Base Model**: ResNet101 (pretrained on ImageNet)
- **Feature Extraction**: 2048-dim embeddings
- **Similarity Search**: FAISS IndexFlatIP (cosine similarity)
- **Top-K Retrieval**: Returns top 5 matches

## Integration with Location Recognition

The landmark model integrates with the main location recognition pipeline:

```python
# In location-recognition-v2/route.ts
1. Extract GPS from EXIF (if available)
2. Run landmark recognition
3. If landmark detected with high confidence:
   - Use landmark metadata for location
   - Boost overall confidence
   - Add hierarchical classification
```

## Performance

- **Feature Extraction**: ~50ms per image (GPU)
- **Index Search**: ~5ms for top-5 retrieval
- **Total Latency**: ~100-200ms end-to-end

## Dataset Statistics

- **Training Images**: 4,132,914
- **Unique Landmarks**: ~200,000
- **Index Images**: 761,757
- **Test Images**: 117,577

## Requirements

```txt
torch>=2.0.0
torchvision>=0.15.0
faiss-cpu>=1.7.4
pandas>=2.0.0
pillow>=10.0.0
tqdm>=4.65.0
```

## Next Steps

1. Download full training set (500 files, ~500GB)
2. Fine-tune model on SSABIRoad-specific landmarks
3. Add geographic filtering (region-based search)
4. Implement hierarchical classification
5. Add natural vs human-made filtering
