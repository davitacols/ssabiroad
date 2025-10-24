@echo off
echo Setting up ML models...

pip install -r requirements.txt

python scripts/download_pretrained.py

python scripts/inference_server.py
