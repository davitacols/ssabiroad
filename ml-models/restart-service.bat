@echo off
echo Killing all Python ML processes...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "pkill -9 -f 'python.*main.py'"

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo.
echo Starting service with fixed code...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu/ssabiroad/ml-models && nohup /home/ubuntu/ssabiroad/ml-models/venv/bin/python api/main.py > ml.log 2>&1 &"

echo.
echo Waiting 5 seconds for startup...
timeout /t 5 /nobreak > nul

echo.
echo Testing service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health"

echo.
echo.
echo Checking for landmark endpoint...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/docs | grep -i landmark || echo 'Landmark endpoint check complete'"

pause
