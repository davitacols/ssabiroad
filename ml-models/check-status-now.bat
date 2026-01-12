@echo off
echo Checking service status...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health && echo '' && echo 'Service is running!' || echo 'Service not responding'"
echo.
echo Checking processes...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ps aux | grep 'python.*main.py' | grep -v grep"
echo.
echo Last 15 lines of log...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "tail -15 /home/ubuntu/ssabiroad/ml-models/ml.log"
pause
