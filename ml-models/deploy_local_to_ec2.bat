@echo off
REM Deploy from Windows to EC2

echo 🚀 Deploying SSABIRoad ML Models to EC2...

REM Configuration - UPDATE EC2_HOST with your instance IP
set EC2_HOST=your-ec2-ip-or-hostname
set EC2_USER=ubuntu
set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem

echo.
echo 📋 Configuration:
echo    Host: %EC2_HOST%
echo    User: %EC2_USER%
echo    Key: %KEY_PATH%
echo.

REM Check if configuration is set
if "%EC2_HOST%"=="your-ec2-ip-or-hostname" (
    echo ❌ ERROR: Please update EC2_HOST in this script
    echo    Edit deploy_local_to_ec2.bat and set your EC2 details
    pause
    exit /b 1
)

REM Upload files to EC2
echo 📤 Uploading files to EC2...
scp -i "%KEY_PATH%" -r ^
    api ^
    utils ^
    training ^
    requirements.txt ^
    config.example.json ^
    deploy_to_ec2.sh ^
    %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/

REM Execute deployment on EC2
echo 🔄 Running deployment on EC2...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "cd /home/ubuntu/ssabiroad/ml-models && chmod +x deploy_to_ec2.sh && ./deploy_to_ec2.sh"

echo.
echo ✅ Deployment complete!
echo 🌐 Access API at: http://%EC2_HOST%:8000
echo 📖 API Docs: http://%EC2_HOST%:8000/docs
pause
