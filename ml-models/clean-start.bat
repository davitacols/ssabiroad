@echo off
echo Killing all Python processes...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "pkill -9 -f python"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Starting service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu/ssabiroad/ml-models && nohup ./venv/bin/python api/main.py > ml.log 2>&1 &"

echo.
echo Waiting 8 seconds for startup...
timeout /t 8 /nobreak > nul

echo.
echo Testing health...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health || echo 'Not responding yet'"

echo.
echo.
echo Checking process...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ps aux | grep 'python.*main.py' | grep -v grep || echo 'No process found'"

pause
