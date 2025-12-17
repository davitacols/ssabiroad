@echo off
REM Get EC2 instance IP address

echo 🔍 Finding your EC2 instance IP...
echo.
echo Option 1: AWS Console
echo   1. Go to: https://console.aws.amazon.com/ec2/
echo   2. Click "Instances"
echo   3. Find your instance
echo   4. Copy "Public IPv4 address"
echo.
echo Option 2: AWS CLI (if installed)
echo   Run: aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,PublicIpAddress,State.Name]" --output table
echo.
echo Option 3: SSH to check
echo   If you know the IP, test with:
echo   ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@YOUR-IP
echo.
echo 📝 Once you have the IP, edit deploy_local_to_ec2.bat:
echo    Change: set EC2_HOST=your-ec2-ip-or-hostname
echo    To:     set EC2_HOST=YOUR-ACTUAL-IP
echo.
pause
