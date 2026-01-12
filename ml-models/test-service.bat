@echo off
echo Testing ML service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "timeout 3 curl -s http://localhost:8000/health || echo 'Service not responding'"
echo.
echo Checking process...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ps aux | grep 'python.*main.py' | grep -v grep || echo 'No process found'"
echo.
echo Checking last 10 lines of log...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "tail -10 /home/ubuntu/ssabiroad/ml-models/ml.log 2>&1 || echo 'No log file'"
pause
