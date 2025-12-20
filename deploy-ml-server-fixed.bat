@echo off
echo Fixing PEM key permissions...

:: Remove inheritance and set proper permissions
icacls "C:\Users\USER\Downloads\pic2nav-ml-key.pem" /inheritance:r
icacls "C:\Users\USER\Downloads\pic2nav-ml-key.pem" /grant:r "%USERNAME%:R"

echo.
echo Deploying ML server to EC2...

set KEY_PATH=C:\Users\USER\Downloads\pic2nav-ml-key.pem
set EC2_HOST=ec2-user@34.224.33.158
set REMOTE_PATH=/home/ec2-user/ml-models

echo Copying updated main.py...
scp -i "%KEY_PATH%" -o StrictHostKeyChecking=no "ml-models\api\main.py" %EC2_HOST%:%REMOTE_PATH%/api/main.py

if %ERRORLEVEL% NEQ 0 (
    echo Failed to copy file. Check your SSH key and EC2 connection.
    pause
    exit /b 1
)

echo Restarting ML server...
ssh -i "%KEY_PATH%" -o StrictHostKeyChecking=no %EC2_HOST% "pkill -f 'python.*main.py'; cd %REMOTE_PATH% && nohup python3 -m api.main > ml_server.log 2>&1 &"

echo Waiting 5 seconds for server to start...
ping 127.0.0.1 -n 6 > nul

echo Testing /health endpoint...
curl -s http://34.224.33.158:8000/health

echo.
echo Testing /train endpoint...
curl -s http://34.224.33.158:8000/docs | findstr /C:"train"

echo.
echo Done!
pause
