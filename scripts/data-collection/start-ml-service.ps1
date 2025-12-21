Write-Host "Starting ML API service..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'ML Models directory:'
pwd
echo ''
echo 'Listing files...'
ls -la *.py 2>/dev/null || ls -la
echo ''
echo 'Activating virtual environment and starting service...'
source venv/bin/activate
pkill -f 'uvicorn.*8000' 2>/dev/null
sleep 2
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-api.log 2>&1 &
sleep 3
echo ''
echo 'Service status:'
curl -s http://localhost:8000/training_queue
echo ''
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "✅ ML API restarted with clean data!" -ForegroundColor Green
Write-Host ""
Write-Host "Now upload fresh training data:" -ForegroundColor Yellow
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
