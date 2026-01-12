@echo off
echo Checking EC2 server structure...

ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "ls -la /home/ubuntu/"

echo.
echo Checking for ML directories...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "find /home/ubuntu -name '*ml*' -o -name '*api*' 2>/dev/null"

echo.
echo Checking running services...
ssh -i "D:\downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "sudo systemctl list-units --type=service | grep -i ml"

echo.
echo Done!
