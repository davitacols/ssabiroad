@echo off
echo Deploying ML server to EC2...

set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem
set EC2_HOST=ec2-user@34.224.33.158
set REMOTE_PATH=/home/ec2-user/ml-models

echo Copying updated main.py...
scp -i "%KEY_PATH%" "ml-models\api\main.py" %EC2_HOST%:%REMOTE_PATH%/api/main.py

echo Restarting ML server...
ssh -i "%KEY_PATH%" %EC2_HOST% "pkill -f 'python.*main.py'; cd %REMOTE_PATH% && nohup python3 -m api.main > ml_server.log 2>&1 &"

echo Waiting for server to start...
timeout /t 5 /nobreak

echo Testing server...
curl http://34.224.33.158:8000/health

echo Done!
pause
