@echo off
echo Copying fixed main.py to EC2...
scp -i "D:\downloads\pic2nav-ml-key.pem" "d:\ssabiroad\ml-models\api\main.py" ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo.
echo Killing old processes...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "pkill -f 'python.*main.py'"

echo.
echo Starting service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu/ssabiroad/ml-models && nohup /home/ubuntu/ssabiroad/ml-models/venv/bin/python api/main.py > ml.log 2>&1 &"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo.
echo Testing service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health"

pause
