#!/bin/bash
# Navisense ML Deployment Script for EC2

echo "🚀 Deploying Navisense ML to EC2..."

# Update system
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv

# Create app directory
mkdir -p /home/ubuntu/navisense-ml
cd /home/ubuntu/navisense-ml

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi==0.109.0 uvicorn==0.27.0 python-multipart==0.0.6
pip install pillow==10.2.0 torch==2.1.2 transformers==4.37.2
pip install pinecone==8.0.0 psycopg2-binary==2.9.9 python-dotenv==1.0.0
pip install "numpy==1.24.3"

# Create systemd service
sudo tee /etc/systemd/system/navisense-ml.service > /dev/null <<EOF
[Unit]
Description=Navisense ML Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/navisense-ml
Environment="PATH=/home/ubuntu/navisense-ml/venv/bin"
ExecStart=/home/ubuntu/navisense-ml/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable navisense-ml
sudo systemctl start navisense-ml

echo "✅ Deployment complete!"
echo "Service status:"
sudo systemctl status navisense-ml
