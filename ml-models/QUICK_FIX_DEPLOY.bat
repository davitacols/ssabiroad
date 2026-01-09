@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         SSABIRoad ML API - Quick Fix & Redeploy             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set EC2_HOST=34.224.33.158
set EC2_USER=ubuntu
set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem

echo 🎯 Target: %EC2_HOST%
echo.

REM Test connection
echo 🔍 Testing connection...
ssh -i "%KEY_PATH%" -o ConnectTimeout=10 %EC2_USER%@%EC2_HOST% "echo 'Connected'" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to EC2
    echo.
    echo Please check:
    echo   1. EC2 instance is running
    echo   2. Security group allows SSH
    echo   3. Key file exists: %KEY_PATH%
    pause
    exit /b 1
)

echo ✅ Connected
echo.

REM Backup current main.py and replace with fixed version
echo 📤 Uploading fixed ML API...
scp -i "%KEY_PATH%" api\main_fixed.py %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/api/

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Upload failed
    pause
    exit /b 1
)

echo ✅ Files uploaded
echo.

REM Deploy on EC2
echo 🔄 Deploying on EC2...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "cd /home/ubuntu/ssabiroad/ml-models && cp api/main.py api/main_backup.py && cp api/main_fixed.py api/main.py && sudo systemctl restart ssabiroad-ml && sleep 3 && sudo systemctl status ssabiroad-ml --no-pager"

if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Service restart may have issues
    echo.
    echo Check logs:
    echo   ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST%
    echo   sudo journalctl -u ssabiroad-ml -n 50
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  ✅ Deployment Complete!                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Test your API:
echo    curl http://%EC2_HOST%:8000/health
echo    curl http://%EC2_HOST%:8000/training_queue
echo.
echo 📊 Check status:
echo    ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST%
echo    sudo systemctl status ssabiroad-ml
echo.
echo 📝 View logs:
echo    ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST%
echo    sudo journalctl -u ssabiroad-ml -f
echo.
pause
