@echo off
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         🚀 SSABIRoad ML API - ONE-CLICK FIX                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This will:
echo   1. Connect to EC2 (34.224.33.158)
echo   2. Backup current ML API
echo   3. Deploy fixed version
echo   4. Restart service
echo   5. Run tests
echo.
pause

set EC2_HOST=34.224.33.158
set EC2_USER=ubuntu
set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem

echo.
echo [1/5] 🔍 Testing connection...
ssh -i "%KEY_PATH%" -o ConnectTimeout=10 %EC2_USER%@%EC2_HOST% "echo 'OK'" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to EC2
    pause
    exit /b 1
)
echo ✅ Connected

echo.
echo [2/5] 📤 Uploading fixed ML API...
scp -i "%KEY_PATH%" -q api\main_fixed.py %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/api/
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Upload failed
    pause
    exit /b 1
)
echo ✅ Uploaded

echo.
echo [3/5] 🔄 Deploying on EC2...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "cd /home/ubuntu/ssabiroad/ml-models && cp api/main.py api/main_backup_$(date +%%s).py && cp api/main_fixed.py api/main.py && echo 'Files replaced'"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)
echo ✅ Deployed

echo.
echo [4/5] ⚡ Restarting service...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "sudo systemctl restart ssabiroad-ml && sleep 3"
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Restart may have issues
)
echo ✅ Restarted

echo.
echo [5/5] 🧪 Running tests...
timeout /t 2 /nobreak >nul
node test-fixed-api.js

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  ✅ DEPLOYMENT COMPLETE!                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 ML API: http://34.224.33.158:8000
echo 📖 Docs: http://34.224.33.158:8000/docs
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
