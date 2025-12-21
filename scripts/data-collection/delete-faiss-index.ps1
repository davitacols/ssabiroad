Write-Host "Deleting faiss_index directory..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
sudo pkill -9 -f python
sleep 3
echo ''
echo 'Deleting faiss_index directory...'
sudo rm -rf faiss_index
echo ''
echo 'Deleting training queue files...'
sudo rm -rf data/active_learning/*
echo ''
echo 'Verifying deletion...'
ls -la faiss_index/ 2>/dev/null || echo 'faiss_index deleted successfully'
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 15
echo ''
echo 'Testing...'
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
    Write-Host "✅ SUCCESS! ML Model completely reset!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now upload fresh training data:" -ForegroundColor Yellow
    Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
}
