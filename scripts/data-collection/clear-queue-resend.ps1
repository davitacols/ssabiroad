Write-Host "Clearing queue and resending with addresses..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
sudo lsof -ti:8000 | xargs sudo kill -9
sleep 3
echo ''
echo 'Deleting training queue...'
rm -rf data/active_learning/training_queue.json
rm -rf data/training/*
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 15
echo ''
echo 'Checking queue...'
curl -s http://localhost:8000/training_queue | head -50
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3

$queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"
Write-Host "Queue size: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Yellow"})

if ($queue.samples.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ Queue cleared! Now resending with addresses..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Run: node scripts/data-collection/train-collected.js" -ForegroundColor Cyan
}
