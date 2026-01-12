@echo off
echo Deploying landmark endpoint fix to EC2...

REM Copy updated main.py to EC2
scp -i "D:\downloads\pic2nav-ml-key.pem" api/main.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

echo Restarting ML service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd ssabiroad/ml-models && source venv/bin/activate && pkill -f 'python.*main.py' && nohup python api/main.py > ml.log 2>&1 &"

echo Deployment complete!
echo Waiting 5 seconds for service to start...
timeout /t 5

echo Testing endpoint...
curl http://34.224.33.158:8000/landmark-stats

echo.
echo Done! The landmark endpoint should now be available.
