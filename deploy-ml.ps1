# PowerShell deployment script for Windows
param(
    [Parameter(Mandatory=$true)]
    [string]$KeyPath
)

$EC2_IP = "34.224.33.158"
$EC2_USER = "ec2-user"

Write-Host "🚀 Deploying ML Model to EC2..." -ForegroundColor Green

# Copy file
Write-Host "📦 Copying updated files to EC2..."
scp -i $KeyPath ml-models/api/main.py "${EC2_USER}@${EC2_IP}:~/ml-models/api/"

# Restart server
Write-Host "🔄 Restarting ML server..."
$commands = @"
cd ~/ml-models/api
if command -v pm2 &> /dev/null; then
    pm2 restart navisense || pm2 start main.py --name navisense
else
    pkill -f 'python.*main.py'
    nohup python3 main.py > ml-server.log 2>&1 &
fi
echo 'ML server restarted'
"@

ssh -i $KeyPath "${EC2_USER}@${EC2_IP}" $commands

# Test
Write-Host "🧪 Testing ML server..."
Start-Sleep -Seconds 3
$response = Invoke-RestMethod -Uri "http://${EC2_IP}:8000/"
$response | ConvertTo-Json

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 ML Server: http://${EC2_IP}:8000"
