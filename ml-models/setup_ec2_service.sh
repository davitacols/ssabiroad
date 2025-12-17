#!/bin/bash
# First-time EC2 setup script (run once)

set -e

echo "🔧 Setting up SSABIRoad ML Service on EC2..."

# Install system dependencies
echo "📦 Installing system packages..."
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3-pip git
sudo apt install -y libgl1-mesa-glx libglib2.0-0 tesseract-ocr

# Setup application directory
APP_DIR="/home/ubuntu/ssabiroad/ml-models"
cd $APP_DIR

# Create virtual environment
echo "🐍 Creating virtual environment..."
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/ssabiroad-ml.service > /dev/null <<EOF
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

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ssabiroad-ml
sudo systemctl start ssabiroad-ml

echo "✅ Setup complete!"
echo "📊 Status: sudo systemctl status ssabiroad-ml"
echo "📝 Logs: sudo journalctl -u ssabiroad-ml -f"
