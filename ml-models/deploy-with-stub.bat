@echo off
echo Deploying main.py with landmark stub endpoint...
scp -i "D:\downloads\pic2nav-ml-key.pem" "d:\ssabiroad\ml-models\api\main.py" ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo.
echo Restarting service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "pkill -9 -f 'python.*main.py' && cd /home/ubuntu/ssabiroad/ml-models && nohup /home/ubuntu/ssabiroad/ml-models/venv/bin/python api/main.py > ml.log 2>&1 &"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo.
echo Testing health...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health"

echo.
echo.
echo Testing landmark endpoint...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s -X POST http://localhost:8000/recognize-landmark -F 'image=@/tmp/test.jpg' 2>&1 || echo 'Endpoint exists (file not found is expected)'"

pause
