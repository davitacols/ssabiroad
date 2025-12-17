#!/bin/bash
# SSABIRoad ML Models - EC2 Redeployment Script

set -e

echo "🚀 Redeploying SSABIRoad ML Models to EC2..."

# Configuration
APP_DIR="/home/ubuntu/ssabiroad/ml-models"
SERVICE_NAME="ssabiroad-ml"

# Navigate to app directory
cd $APP_DIR

# Stop existing service if it exists
echo "⏸️  Stopping existing service..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || echo "Service not running"

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

# Setup and start service
echo "🔄 Setting up service..."

# Check if service exists, if not create it
if [ ! -f /etc/systemd/system/$SERVICE_NAME.service ]; then
    echo "Creating systemd service..."
    sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=SSABIRoad ML API Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/python api/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
fi

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME
sudo systemctl status $SERVICE_NAME --no-pager

echo "✅ Deployment complete!"
echo "📊 Check logs: sudo journalctl -u $SERVICE_NAME -f"
echo "🌐 API: http://$(curl -s ifconfig.me):8000"
echo "📖 Docs: http://$(curl -s ifconfig.me):8000/docs"
