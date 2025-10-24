#!/bin/bash

echo "Setting up ML models..."

# Install dependencies
pip install -r requirements.txt

# Download pretrained models
python scripts/download_pretrained.py

# Start inference server
python scripts/inference_server.py
