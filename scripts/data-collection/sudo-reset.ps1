Write-Host "Final reset with sudo..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Killing processes with sudo...'
sudo pkill -9 -f 'python.*8000'
sleep 5
echo ''
echo 'Deleting data directories...'
sudo rm -rf data/*
sudo rm -rf training_queue/*
echo ''
echo 'Creating fresh structure...'
mkdir -p data/temp data/training data/active_learning data/geolocations
mkdir -p training_queue
echo ''
echo 'Setting permissions...'
sudo chown -R ubuntu:ubuntu data/
sudo chown -R ubuntu:ubuntu training_queue/
echo ''
echo 'Verifying empty...'
ls -la data/
ls -la training_queue/
echo ''
echo 'Starting service...'
source venv/bin/activate
nohup python3 start_server.py > ml-api.log 2>&1 &
sleep 10
echo ''
echo 'Checking status...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3

$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"
$queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"

Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})
Write-Host "Queue: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Red"})

if ($stats.index.total_buildings -eq 0 -and $queue.samples.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Model completely reset!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:" -ForegroundColor Yellow
    Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
}
