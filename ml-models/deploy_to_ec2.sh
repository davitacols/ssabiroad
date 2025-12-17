#!/bin/bash
# SSABIRoad ML Models - EC2 Redeployment Script

set -e

echo "🚀 Redeploying SSABIRoad ML Models to EC2..."

# Configuration
APP_DIR="/home/ubuntu/ssabiroad/ml-models"
SERVICE_NAME="ssabiroad-ml"

# Stop existing service
echo "⏸️  Stopping existing service..."
sudo systemctl stop $SERVICE_NAME || true

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download/update models if needed
echo "🤖 Checking models..."
python3 -c "
import os
from utils.model_loader import download_models_if_needed
download_models_if_needed()
"

# Create necessary directories
mkdir -p models faiss_index data logs training_queue

# Restart service
echo "🔄 Restarting service..."
sudo systemctl daemon-reload
sudo systemctl start $SERVICE_NAME
sudo systemctl status $SERVICE_NAME --no-pager

echo "✅ Deployment complete!"
echo "📊 Check logs: sudo journalctl -u $SERVICE_NAME -f"
echo "🌐 API: http://$(curl -s ifconfig.me):8000"
echo "📖 Docs: http://$(curl -s ifconfig.me):8000/docs"
