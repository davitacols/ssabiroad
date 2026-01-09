@echo off
echo Deploying Global ML System to EC2...

set EC2_HOST=ubuntu@34.224.33.158
set APP_DIR=/home/ubuntu/ssabiroad/ml-models

scp models\global_geolocation.py %EC2_HOST%:%APP_DIR%/models/
scp training\continuous_learning.py %EC2_HOST%:%APP_DIR%/training/
scp api\inference_service.py %EC2_HOST%:%APP_DIR%/api/
scp scripts\global_data_collector.py %EC2_HOST%:%APP_DIR%/scripts/
scp requirements-global.txt %EC2_HOST%:%APP_DIR%/

ssh %EC2_HOST% "cd %APP_DIR% && source venv/bin/activate && pip install -r requirements-global.txt && mkdir -p checkpoints faiss_index data/global && python3 -c 'from training.continuous_learning import FAISSIndexBuilder; import numpy as np; b=FAISSIndexBuilder(768); e=np.random.randn(1000,768).astype(\"float32\"); b.add_embeddings(e,[{\"lat\":0,\"lon\":0}]*1000); b.save(\"faiss_index/global_index.faiss\")' && sudo systemctl restart ssabiroad-ml"

echo Deployed!
echo API: http://34.224.33.158:8000
pause
