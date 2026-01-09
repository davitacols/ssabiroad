#!/bin/bash

echo "Deploying Global Geolocation ML System..."

# Install dependencies
pip install -r requirements-global.txt

# Create directories
mkdir -p checkpoints
mkdir -p faiss_index
mkdir -p data/global

# Collect initial data
echo "Collecting global dataset..."
python scripts/global_data_collector.py

# Build FAISS index
echo "Building FAISS index..."
python -c "
from training.continuous_learning import FAISSIndexBuilder
import numpy as np

builder = FAISSIndexBuilder(dimension=768)
# Add dummy embeddings for testing
embeddings = np.random.randn(1000, 768).astype('float32')
metadata = [{'lat': 0, 'lon': 0} for _ in range(1000)]
builder.add_embeddings(embeddings, metadata)
builder.save('faiss_index/global_index.faiss')
print('FAISS index created')
"

# Start API service
echo "Starting inference service..."
cd api
python inference_service.py
