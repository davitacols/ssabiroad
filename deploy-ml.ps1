# Fix PEM permissions
$pemPath = "C:\Users\USER\Downloads\pic2nav-ml-key.pem"
icacls $pemPath /inheritance:r
icacls $pemPath /grant:r "$env:USERNAME`:R"

# Deploy
$ec2Host = "ec2-user@34.224.33.158"
$remotePath = "/home/ec2-user/ml-models"

Write-Host "Copying main.py to EC2..."
scp -i $pemPath -o StrictHostKeyChecking=no "ml-models\api\main.py" "${ec2Host}:${remotePath}/api/main.py"

Write-Host "Restarting ML server..."
ssh -i $pemPath -o StrictHostKeyChecking=no $ec2Host "pkill -f 'python.*main.py'; cd $remotePath && nohup python3 -m api.main > ml_server.log 2>&1 &"

Start-Sleep -Seconds 5

Write-Host "Testing server..."
curl http://34.224.33.158:8000/health

Write-Host "Done!"
