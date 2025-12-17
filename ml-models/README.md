# NaviSense AI

**Intelligent Location Recognition System**

Powered by SSABIRoad

## Overview

NaviSense AI is an advanced machine learning system that identifies locations from building images using computer vision, geospatial analysis, and artificial intelligence.

## Features

- **Building Recognition** - Identify buildings from photos
- **Location Prediction** - Predict GPS coordinates from images
- **Landmark Detection** - Recognize famous landmarks
- **Similarity Search** - Find similar buildings using CLIP embeddings
- **OCR** - Extract text from architectural images
- **Active Learning** - Continuously improves from user feedback

## Technology Stack

- **CLIP** - Image-text embeddings
- **FAISS** - Vector similarity search
- **EfficientNet** - Geolocation prediction
- **EasyOCR** - Text recognition
- **PyTorch** - Deep learning framework

## API Endpoints

- `POST /predict_location` - Predict location from image
- `POST /search` - Find similar buildings
- `POST /detect_landmark` - Identify landmarks
- `POST /ocr` - Extract text
- `GET /stats` - System statistics

## Deployment

API: `http://52.91.173.191:8000`
Docs: `http://52.91.173.191:8000/docs`

## Version

**NaviSense AI v1.0.0**

Built for SSABIRoad
