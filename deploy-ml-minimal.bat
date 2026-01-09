@echo off
REM Deploy minimal ML API to EC2

setlocal enabledelayedexpansion

set EC2_IP=34.224.33.158
set EC2_USER=ec2-user
set KEY_PATH=%1

if "%KEY_PATH%"=="" (
    echo Error: SSH key path required
    echo Usage: deploy-ml-minimal.bat "C:\path\to\key.pem"
    exit /b 1
)

echo Deploying minimal ML API...

REM Copy the minimal app
scp -i "%KEY_PATH%" ml-models\api\app.py %EC2_USER%@%EC2_IP%:~/ml-models/api/

REM Restart the service
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_IP% ^
    "cd ~/ml-models/api && pkill -f 'python.*main.py' && sleep 2 && nohup python3 app.py > ml-server.log 2>&1 &"

echo Waiting for service to start...
timeout /t 3

REM Test the API
echo Testing API...
curl -s http://%EC2_IP%:8000/health

echo.
echo Deployment complete!
