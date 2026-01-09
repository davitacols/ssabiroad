@echo off
cd /d d:\ssabiroad\ml-models

echo Deploying to EC2 34.224.33.158...

scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" models\global_geolocation.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/models/
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" training\continuous_learning.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/training/
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" api\inference_service.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" scripts\global_data_collector.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/scripts/
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" requirements-global.txt ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu/ssabiroad/ml-models && source venv/bin/activate && pip install -r requirements-global.txt && mkdir -p checkpoints faiss_index data/global && python3 -c 'from training.continuous_learning import FAISSIndexBuilder; import numpy as np; b=FAISSIndexBuilder(768); e=np.random.randn(1000,768).astype(\"float32\"); b.add_embeddings(e,[{\"lat\":0,\"lon\":0}]*1000); b.save(\"faiss_index/global_index.faiss\")' && sudo systemctl restart ssabiroad-ml"

echo Done! API: http://34.224.33.158:8000
pause
