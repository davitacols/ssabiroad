@echo off
echo Deploying ML Server to EC2...

set KEY=C:\Users\USER\Downloads\pic2nav-ml-key.pem
set HOST=ubuntu@34.224.33.158
set REMOTE_DIR=/home/ubuntu/ssabiroad/ml-models

echo Stopping old server...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %HOST% "pkill -f 'python.*api.main' || true"

echo Uploading main.py...
scp -i "%KEY%" -o StrictHostKeyChecking=no ml-models\api\main.py %HOST%:%REMOTE_DIR%/api/main.py

echo Starting ML server...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %HOST% "cd %REMOTE_DIR% && nohup python3 -m api.main > ml_server.log 2>&1 &"

echo Waiting for server to start...
timeout /t 10 /nobreak

echo Checking server status...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %HOST% "curl -s http://localhost:8000/ && echo '' && tail -20 %REMOTE_DIR%/ml_server.log"

echo.
echo Deployment complete!
