@echo off
echo Deploying landmark endpoint to EC2...

echo Copying landmark_endpoint.py...
scp -i "D:\downloads\pic2nav-ml-key.pem" api/landmark_endpoint.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo Copying main.py...
scp -i "D:\downloads\pic2nav-ml-key.pem" api/main.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo Restarting ML service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "pkill -f 'python.*main.py' && cd ssabiroad/ml-models && source venv/bin/activate && nohup python api/main.py > ml.log 2>&1 &"

echo Waiting for service to start...
timeout /t 5

echo Testing endpoint...
curl http://34.224.33.158:8000/
echo.
curl http://34.224.33.158:8000/landmark-stats

echo.
echo Done!
