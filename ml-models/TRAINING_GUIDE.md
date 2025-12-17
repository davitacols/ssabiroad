# Complete ML Training Guide

## 🎯 Overview

This guide covers the complete training pipeline for SSABIRoad's ML models with:
- Automated data collection
- Model training with best practices
- Active learning for continuous improvement
- Model monitoring and versioning
- A/B testing capabilities

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ml-models
pip install -r requirements-ml.txt
```

### 2. Collect Data (Option A: OpenStreetMap)
```bash
python training/data_collector.py --mode osm
```

### 3. Collect Data (Option B: With Google Street View)
```bash
python training/data_collector.py --mode streetview --api_key YOUR_API_KEY
```

### 4. Run Full Training Pipeline
```bash
python training/orchestrator.py --mode full --epochs 20
```

## 📊 Training Modes

### Full Pipeline (Recommended for First Time)
```bash
python training/orchestrator.py --mode full --google-api-key YOUR_KEY
```

This will:
1. Collect building data from OSM
2. Download Street View images
3. Build FAISS index
4. Train landmark classifier
5. Train geolocation model

### Individual Components

**Build FAISS Index Only:**
```bash
python training/orchestrator.py --mode index
```

**Train Landmark Classifier:**
```bash
python training/train_landmark_improved.py --data_dir data/landmarks --epochs 30
```

**Train Geolocation Model:**
```bash
python training/train_geolocation.py --data_dir data/geolocations --epochs 20
```

**Active Learning Cycle:**
```bash
python training/orchestrator.py --mode active
```

## 📁 Data Structure

### For Geolocation Training
```
data/geolocations/
├── train/
│   ├── image_001.jpg
│   ├── image_001.json  # {"latitude": 6.5244, "longitude": 3.3792}
│   ├── image_002.jpg
│   └── image_002.json
└── val/
    └── ...
```

### For Landmark Classification
```
data/landmarks/
├── train/
│   ├── bank/
│   │   ├── img1.jpg
│   │   └── img2.jpg
│   ├── mall/
│   ├── church/
│   └── mosque/
└── val/
    └── ...
```

### For FAISS Index
```
data/buildings/
├── building_001.jpg
├── building_001.json  # {"name": "...", "latitude": ..., "longitude": ...}
└── ...
```

## 🔧 Advanced Features

### 1. Model Monitoring

Monitor model performance in real-time:
```python
from utils.model_monitor import ModelMonitor

monitor = ModelMonitor()
metrics = monitor.calculate_metrics(window_hours=24)
print(metrics)
```

### 2. Model Versioning

Manage multiple model versions:
```python
from utils.model_monitor import ModelVersionManager

manager = ModelVersionManager()

# List all models
models = manager.list_models()

# Get best model
best = manager.get_best_model()

# Activate specific version
manager.set_active_model("20250101_120000")
```

### 3. Active Learning

Continuous improvement from user feedback:
```python
from utils.active_learning import ActiveLearningPipeline

al = ActiveLearningPipeline()

# Add user correction
al.add_user_correction(
    image_path="path/to/image.jpg",
    predicted={"latitude": 6.5, "longitude": 3.3},
    corrected={"latitude": 6.52, "longitude": 3.38}
)

# Check if should retrain
if al.should_retrain():
    # Trigger training
    pass
```

### 4. A/B Testing

Compare model versions:
```python
from utils.model_monitor import ModelMonitor

monitor = ModelMonitor()
comparison = monitor.compare_models([
    "20250101_120000",
    "20250102_150000"
])
```

## 📈 Training Best Practices

### 1. Data Collection
- **Minimum**: 1,000 buildings for FAISS index
- **Recommended**: 5,000-10,000 buildings
- **Diversity**: Multiple angles, lighting conditions, weather
- **Geographic**: Cover all target regions

### 2. Training Schedule
- **Initial Training**: Full pipeline with all collected data
- **Weekly**: Active learning cycle with user feedback
- **Monthly**: Full retraining with new data

### 3. Hyperparameters

**Geolocation Model:**
- Epochs: 20-30
- Batch size: 32
- Learning rate: 1e-4
- Backbone: EfficientNet-B0

**Landmark Classifier:**
- Epochs: 30-50
- Batch size: 32
- Learning rate: 1e-4
- Loss: Focal Loss (handles class imbalance)

### 4. Validation
- Split: 80% train, 20% validation
- Metrics: 
  - Geolocation: Mean distance error, Accuracy@1km/5km/25km
  - Landmark: Top-1 and Top-5 accuracy

## 🔄 Continuous Improvement Workflow

### Week 1: Initial Setup
```bash
# Collect data
python training/data_collector.py --mode osm

# Train models
python training/orchestrator.py --mode full --epochs 20
```

### Week 2-4: Monitor & Collect Feedback
- Deploy models to production
- Monitor performance via `/stats` endpoint
- Collect user corrections

### Week 5: Active Learning
```bash
# Check queue
curl http://localhost:8000/stats

# Trigger retraining if ready
curl -X POST http://localhost:8000/trigger_training
```

### Monthly: Full Retraining
```bash
# Collect new data
python training/data_collector.py --mode users

# Full retrain
python training/orchestrator.py --mode full --epochs 30
```

## 📊 Performance Targets

### Geolocation Model
- Mean error: < 25km
- Accuracy@1km: > 20%
- Accuracy@5km: > 40%
- Accuracy@25km: > 70%

### Landmark Classifier
- Top-1 accuracy: > 80%
- Top-5 accuracy: > 95%

### FAISS Retrieval
- Top-1 accuracy: > 85%
- Top-5 accuracy: > 95%
- Query time: < 50ms

## 🐛 Troubleshooting

### Issue: Low accuracy
**Solution**: 
- Collect more diverse data
- Increase training epochs
- Use data augmentation
- Check for data quality issues

### Issue: Slow training
**Solution**:
- Use GPU (CUDA)
- Reduce batch size
- Use mixed precision training (already enabled)
- Use smaller backbone (e.g., MobileNet)

### Issue: Model not improving
**Solution**:
- Check learning rate (try 1e-5 or 1e-3)
- Verify data labels are correct
- Use learning rate scheduler (already enabled)
- Try different backbone architecture

### Issue: Out of memory
**Solution**:
- Reduce batch size
- Use gradient accumulation
- Use smaller image size (224x224 → 192x192)
- Clear cache: `torch.cuda.empty_cache()`

## 📞 API Integration

### Submit Prediction with Feedback
```javascript
// Predict
const formData = new FormData();
formData.append('file', imageFile);
formData.append('image_id', 'unique_id');

const prediction = await fetch('/api/ml-predict', {
  method: 'POST',
  body: formData
});

// Submit correction
await fetch('/api/ml-feedback', {
  method: 'POST',
  body: JSON.stringify({
    image_id: 'unique_id',
    predicted: prediction,
    corrected: {latitude: 6.52, longitude: 3.38}
  })
});
```

### Check Training Status
```bash
curl http://localhost:8000/stats
```

### Trigger Manual Training
```bash
curl -X POST http://localhost:8000/trigger_training
```

## 🎓 Next Steps

1. **Week 1**: Collect 1,000+ building images
2. **Week 2**: Run initial training pipeline
3. **Week 3**: Deploy and monitor
4. **Week 4**: Collect user feedback
5. **Week 5**: Run active learning cycle
6. **Ongoing**: Continuous monitoring and improvement

## 📚 Additional Resources

- `ML_BACKEND_SUMMARY.md` - Architecture overview
- `INTEGRATION_GUIDE.md` - API integration
- `README_ML.md` - Model details
- API Docs: `http://localhost:8000/docs`

## 🔒 Production Checklist

- [ ] Collect minimum 1,000 buildings
- [ ] Train all models (geolocation, landmark, FAISS)
- [ ] Validate model performance meets targets
- [ ] Set up monitoring dashboard
- [ ] Configure active learning pipeline
- [ ] Enable automatic retraining
- [ ] Set up model versioning
- [ ] Configure A/B testing
- [ ] Add authentication to ML API
- [ ] Set up backup and recovery
- [ ] Document deployment process
- [ ] Train team on monitoring tools

---

**Version**: 2.0.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
