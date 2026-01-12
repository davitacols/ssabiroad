@echo off
echo Checking service...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health"
echo.
echo.
echo Checking process...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ps aux | grep 'python.*main.py' | grep -v grep"
pause
