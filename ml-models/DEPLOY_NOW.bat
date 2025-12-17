@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         SSABIRoad ML Models - EC2 Deployment                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔑 PEM Key: C:\Users\USER\Downloads\pic2nav-ml-key.pem
echo.

REM Check if EC2 IP is provided
if "%1"=="" (
    echo ❌ EC2 IP address required!
    echo.
    echo Usage: DEPLOY_NOW.bat YOUR-EC2-IP
    echo Example: DEPLOY_NOW.bat 54.123.45.67
    echo.
    echo 📝 To find your EC2 IP:
    echo    1. Go to: https://console.aws.amazon.com/ec2/
    echo    2. Click "Instances"
    echo    3. Copy "Public IPv4 address"
    echo.
    echo Or run: get_ec2_ip.bat
    pause
    exit /b 1
)

set EC2_HOST=%1
set EC2_USER=ubuntu
set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem

echo 🎯 Target: %EC2_HOST%
echo.

REM Test connection first
echo 🔍 Testing connection...
ssh -i "%KEY_PATH%" -o ConnectTimeout=10 ubuntu@%EC2_HOST% "echo 'Connected'" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to EC2 instance
    echo.
    echo Check:
    echo   1. EC2 instance is running
    echo   2. Security group allows SSH from your IP
    echo   3. IP address is correct: %EC2_HOST%
    echo.
    pause
    exit /b 1
)

echo ✅ Connection successful
echo.

REM Upload files
echo 📤 Uploading files to EC2...
scp -i "%KEY_PATH%" -r api utils training requirements.txt config.example.json deploy_to_ec2.sh .env.example %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Upload failed
    pause
    exit /b 1
)

echo ✅ Files uploaded
echo.

REM Execute deployment
echo 🔄 Running deployment on EC2...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "cd /home/ubuntu/ssabiroad/ml-models && chmod +x deploy_to_ec2.sh && ./deploy_to_ec2.sh"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed
    echo.
    echo Check logs on EC2:
    echo   ssh -i "%KEY_PATH%" ubuntu@%EC2_HOST%
    echo   sudo journalctl -u ssabiroad-ml -n 50
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  ✅ Deployment Complete!                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Access your API:
echo    Docs:   http://%EC2_HOST%:8000/docs
echo    Health: http://%EC2_HOST%:8000/
echo    Stats:  http://%EC2_HOST%:8000/stats
echo.
echo 📊 Check status:
echo    ssh -i "%KEY_PATH%" ubuntu@%EC2_HOST%
echo    sudo systemctl status ssabiroad-ml
echo.
echo 📝 View logs:
echo    ssh -i "%KEY_PATH%" ubuntu@%EC2_HOST%
echo    sudo journalctl -u ssabiroad-ml -f
echo.
pause
