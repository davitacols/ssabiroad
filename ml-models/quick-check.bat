@echo off
echo Testing health endpoint...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "curl -s http://localhost:8000/health 2>&1"
pause
