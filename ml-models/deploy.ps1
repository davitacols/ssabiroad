# PowerShell deployment script
param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_IP
)

$EC2_HOST = $EC2_IP
$EC2_USER = "ubuntu"
$KEY_PATH = "C:\Users\USER\Downloads\pic2nav-ml-key.pem"

Write-Host ""
Write-Host "🚀 Deploying SSABIRoad ML Models to EC2..." -ForegroundColor Cyan
Write-Host "Target: $EC2_HOST" -ForegroundColor Yellow
Write-Host ""

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Cyan
$testResult = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "echo 'Connected'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to EC2" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix Security Group:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "2. Select instance → Security tab → Edit inbound rules" -ForegroundColor White
    Write-Host "3. Add: SSH (22) from My IP" -ForegroundColor White
    Write-Host "4. Add: Custom TCP (8000) from 0.0.0.0/0" -ForegroundColor White
    exit 1
}

Write-Host "✅ Connection successful" -ForegroundColor Green
Write-Host ""

# Upload files
Write-Host "📤 Uploading files..." -ForegroundColor Cyan
scp -i $KEY_PATH -r api utils training requirements.txt config.example.json deploy_to_ec2.sh .env.example ${EC2_USER}@${EC2_HOST}:/home/ubuntu/ssabiroad/ml-models/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🔄 Running deployment..." -ForegroundColor Cyan
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST "cd /home/ubuntu/ssabiroad/ml-models && chmod +x deploy_to_ec2.sh && ./deploy_to_ec2.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your API:" -ForegroundColor Cyan
Write-Host "   Docs:   http://${EC2_HOST}:8000/docs" -ForegroundColor White
Write-Host "   Health: http://${EC2_HOST}:8000/" -ForegroundColor White
Write-Host "   Stats:  http://${EC2_HOST}:8000/stats" -ForegroundColor White
Write-Host ""
