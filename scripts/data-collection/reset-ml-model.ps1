Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resetting ML Model on EC2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Connecting to EC2 server..." -ForegroundColor Yellow

$commands = @"
echo 'Connected to EC2 server'
echo ''
echo 'Step 2: Stopping ML service...'
sudo systemctl stop ml-api 2>/dev/null || pm2 stop ml-api 2>/dev/null || echo 'Service not running'
echo ''
echo 'Step 3: Clearing training data...'
sudo rm -rf /home/ubuntu/ml-api/data/training_queue/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/data/trained_model/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/data/embeddings/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/training_queue/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/trained_model/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/embeddings/* 2>/dev/null
echo ''
echo 'Step 4: Restarting ML service...'
sudo systemctl start ml-api 2>/dev/null || pm2 restart ml-api 2>/dev/null || echo 'Please start service manually'
echo ''
echo 'Step 5: Checking queue status...'
sleep 3
curl -s http://localhost:8000/training_queue | head -20
echo ''
echo '========================================'
echo 'ML Model Reset Complete!'
echo '========================================'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Run: node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "2. Run: node scripts/data-collection/train-collected.js" -ForegroundColor White
Write-Host "3. Trigger retrain: curl -X POST http://34.224.33.158:8000/retrain" -ForegroundColor White
Write-Host ""
