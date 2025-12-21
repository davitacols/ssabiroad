Write-Host "Inspecting and deleting all data files..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
sudo pkill -9 -f python
sleep 5
echo ''
echo 'Listing ALL files in data directory...'
find data/ -type f
echo ''
echo 'Listing training_queue...'
find training_queue/ -type f 2>/dev/null || echo 'No training_queue files'
echo ''
echo 'Deleting EVERYTHING...'
sudo rm -rf data
sudo rm -rf training_queue
echo ''
echo 'Recreating directories...'
mkdir -p data/temp data/training data/active_learning data/geolocations
mkdir -p training_queue
sudo chown -R ubuntu:ubuntu data training_queue
echo ''
echo 'Verifying empty...'
find data/ -type f | wc -l
find training_queue/ -type f 2>/dev/null | wc -l
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 12
echo ''
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Waiting for service..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 10
    $queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue" -TimeoutSec 10
    
    Write-Host ""
    Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})
    Write-Host "Queue: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Red"})
    
    if ($stats.index.total_buildings -eq 0 -and $queue.samples.Count -eq 0) {
        Write-Host ""
        Write-Host "✅ RESET COMPLETE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run:" -ForegroundColor Yellow
        Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
        Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Data still persists. Checking logs..." -ForegroundColor Red
        ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd ~/ssabiroad/ml-models && tail -30 ml-api.log"
    }
} catch {
    Write-Host "Service not ready. Check manually: http://34.224.33.158:8000/stats" -ForegroundColor Yellow
}
