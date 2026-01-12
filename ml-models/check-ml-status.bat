@echo off
echo Checking ML service logs...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "tail -50 /home/ubuntu/ssabiroad/ml-models/ml.log"

echo.
echo Checking if service is running...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ps aux | grep 'python.*main.py' | grep -v grep"

echo.
echo Testing health endpoint...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health"

pause
