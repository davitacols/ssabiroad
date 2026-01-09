@echo off
REM Quick redeploy to EC2

set EC2_HOST=34.224.33.158
set EC2_USER=ubuntu
set KEY_PATH=D:\downloads\pic2nav-ml-key.pem

echo 🚀 Quick Redeploying ML API to EC2...
echo Target: %EC2_HOST%
echo.

REM Upload only the changed files
echo 📤 Uploading updated files...
scp -i "%KEY_PATH%" api/main.py %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/api/
scp -i "%KEY_PATH%" utils/active_learning.py %EC2_USER%@%EC2_HOST%:/home/ubuntu/ssabiroad/ml-models/utils/

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Upload failed
    pause
    exit /b 1
)

echo ✅ Files uploaded
echo.

REM Restart the service
echo 🔄 Restarting ML API service...
ssh -i "%KEY_PATH%" %EC2_USER%@%EC2_HOST% "sudo systemctl restart ssabiroad-ml"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Restart failed
    echo.
    echo Check logs:
    echo   ssh -i "%KEY_PATH%" ubuntu@%EC2_HOST%
    echo   sudo journalctl -u ssabiroad-ml -n 50
    pause
    exit /b 1
)

echo.
echo ✅ Redeployment complete!
echo 🌐 API: http://%EC2_HOST%:8000/stats
echo.
pause
