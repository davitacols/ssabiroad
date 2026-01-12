@echo off
echo Copying landmark_endpoint.py to EC2...
scp -i "D:\downloads\pic2nav-ml-key.pem" "d:\ssabiroad\ml-models\api\landmark_endpoint.py" ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo.
echo Verifying file exists...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "test -f /home/ubuntu/ssabiroad/ml-models/api/landmark_endpoint.py && echo 'File exists' || echo 'File NOT found'"

echo.
echo Restarting ML service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu/ssabiroad/ml-models && pkill -f 'python.*main.py' && nohup /home/ubuntu/ssabiroad/ml-models/venv/bin/python api/main.py > ml.log 2>&1 &"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Checking if service started...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health || (echo 'Service failed to start. Checking logs:' && tail -20 /home/ubuntu/ssabiroad/ml-models/ml.log)"

pause
