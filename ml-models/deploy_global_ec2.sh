#!/bin/bash
set -e

EC2_HOST="ubuntu@34.224.33.158"
APP_DIR="/home/ubuntu/ssabiroad/ml-models"

echo "🚀 Deploying Global ML System to EC2..."

# Copy files
scp -r models/global_geolocation.py $EC2_HOST:$APP_DIR/models/
scp -r training/continuous_learning.py $EC2_HOST:$APP_DIR/training/
scp -r api/inference_service.py $EC2_HOST:$APP_DIR/api/
scp -r scripts/global_data_collector.py $EC2_HOST:$APP_DIR/scripts/
scp requirements-global.txt $EC2_HOST:$APP_DIR/

# Deploy on EC2
ssh $EC2_HOST << 'EOF'
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate

pip install -r requirements-global.txt

mkdir -p checkpoints faiss_index data/global

# Build initial FAISS index
python3 -c "
from training.continuous_learning import FAISSIndexBuilder
import numpy as np
builder = FAISSIndexBuilder(768)
embeddings = np.random.randn(1000, 768).astype('float32')
metadata = [{'lat': 0, 'lon': 0} for _ in range(1000)]
builder.add_embeddings(embeddings, metadata)
builder.save('faiss_index/global_index.faiss')
"

# Update service
sudo systemctl stop ssabiroad-ml
sudo systemctl start ssabiroad-ml
sudo systemctl status ssabiroad-ml --no-pager

echo "✅ Deployed!"
EOF

echo "🌐 API: http://34.224.33.158:8000"
echo "📖 Docs: http://34.224.33.158:8000/docs"
