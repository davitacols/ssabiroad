#!/bin/bash
# EC2 Deployment Script for Pic2Nav ML Backend

echo "🚀 Setting up Pic2Nav ML Backend on EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install system dependencies
sudo apt install -y libgl1-mesa-glx libglib2.0-0 tesseract-ocr

# Clone repository
cd /home/ubuntu
git clone https://github.com/davitacols/ssabiroad.git
cd ssabiroad/ml-models

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install -r requirements-ml.txt

# Create systemd service
sudo tee /etc/systemd/system/pic2nav-ml.service > /dev/null <<EOF
[Unit]
Description=Pic2Nav ML Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/ssabiroad/ml-models
Environment="PATH=/home/ubuntu/ssabiroad/ml-models/venv/bin"
ExecStart=/home/ubuntu/ssabiroad/ml-models/venv/bin/python start_server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable pic2nav-ml
sudo systemctl start pic2nav-ml

echo "✅ ML Backend deployed!"
echo "📊 Check status: sudo systemctl status pic2nav-ml"
echo "📝 View logs: sudo journalctl -u pic2nav-ml -f"
echo "🌐 Access at: http://$(curl -s ifconfig.me):8000"
