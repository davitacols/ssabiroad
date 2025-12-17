@echo off
REM Test EC2 SSH connection

set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem

if "%1"=="" (
    echo Usage: test_ec2_connection.bat YOUR-EC2-IP
    echo Example: test_ec2_connection.bat 54.123.45.67
    exit /b 1
)

set EC2_HOST=%1

echo 🔐 Testing SSH connection to %EC2_HOST%...
echo.

ssh -i "%KEY_PATH%" -o ConnectTimeout=10 ubuntu@%EC2_HOST% "echo '✅ Connection successful!' && uname -a"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SSH connection works!
    echo 📝 Update deploy_local_to_ec2.bat with: set EC2_HOST=%EC2_HOST%
) else (
    echo.
    echo ❌ Connection failed. Check:
    echo    1. EC2 instance is running
    echo    2. Security group allows SSH (port 22) from your IP
    echo    3. IP address is correct
)

pause
