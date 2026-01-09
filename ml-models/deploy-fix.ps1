# SSABIRoad ML API - PowerShell Deployment Script

$EC2_HOST = "34.224.33.158"
$EC2_USER = "ubuntu"
$KEY_PATH = "C:\Users\USER\Downloads\pic2nav-ml-key.pem"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 SSABIRoad ML API - Deployment                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test connection
Write-Host "[1/5] 🔍 Testing connection..." -ForegroundColor Yellow
$result = ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'OK'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to EC2" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. EC2 instance is running: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "  2. Security group allows SSH (port 22)" -ForegroundColor White
    Write-Host "  3. Key file exists: $KEY_PATH" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Connected" -ForegroundColor Green
Write-Host ""

# Upload file
Write-Host "[2/5] 📤 Uploading fixed ML API..." -ForegroundColor Yellow
scp -i $KEY_PATH -o StrictHostKeyChecking=no api\main_fixed.py "$EC2_USER@${EC2_HOST}:/home/ubuntu/ssabiroad/ml-models/api/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Uploaded" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "[3/5] 🔄 Deploying on EC2..." -ForegroundColor Yellow
ssh -i $KEY_PATH "$EC2_USER@$EC2_HOST" "cd /home/ubuntu/ssabiroad/ml-models && cp api/main.py api/main_backup_$(date +%s).py && cp api/main_fixed.py api/main.py && echo 'Files replaced'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Deployed" -ForegroundColor Green
Write-Host ""

# Restart service
Write-Host "[4/5] ⚡ Restarting service..." -ForegroundColor Yellow
ssh -i $KEY_PATH "$EC2_USER@$EC2_HOST" "sudo systemctl restart ssabiroad-ml && sleep 3"

Write-Host "✅ Restarted" -ForegroundColor Green
Write-Host ""

# Test
Write-Host "[5/5] 🧪 Running tests..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

if (Test-Path "test-fixed-api.js") {
    node test-fixed-api.js
} else {
    Write-Host "⚠️  Test file not found, testing manually..." -ForegroundColor Yellow
    $health = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/health" -Method Get
    Write-Host "✅ Health check passed: $($health.status)" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ DEPLOYMENT COMPLETE!                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 ML API: http://${EC2_HOST}:8000" -ForegroundColor Cyan
Write-Host "📖 Docs: http://${EC2_HOST}:8000/docs" -ForegroundColor Cyan
Write-Host ""
pause
