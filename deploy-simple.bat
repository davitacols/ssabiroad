@echo off
echo Deploying ML Model to EC2...

set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem
set EC2_IP=34.224.33.158

echo Step 1: Copying main.py to EC2...
scp -i "%KEY_PATH%" ml-models\api\main.py ec2-user@%EC2_IP%:~/ml-models/api/

echo Step 2: Restarting ML server...
ssh -i "%KEY_PATH%" ec2-user@%EC2_IP% "cd ~/ml-models/api && pkill -f 'python.*main.py' ; nohup python3 main.py > ml-server.log 2>&1 &"

echo Step 3: Waiting for server to start...
timeout /t 5 /nobreak

echo Step 4: Testing server...
curl http://%EC2_IP%:8000/

echo.
echo Deployment complete!
pause
