Write-Host "Finding data storage location..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking API main.py for data paths...'
grep -n 'data/' api/main.py | head -20
echo ''
echo 'Searching for all data directories...'
find . -type d -name 'data' -o -name 'training_queue' -o -name 'embeddings'
echo ''
echo 'Stopping service completely...'
pkill -9 -f python
sleep 5
echo ''
echo 'Deleting EVERYTHING with data...'
find ~/ssabiroad/ml-models -type f \( -name '*.pkl' -o -name '*.index' -o -name '*.bin' -o -name '*.faiss' \) -delete
find ~/ssabiroad/ml-models -type d -name 'data' -exec rm -rf {}/\* \;
echo ''
echo 'Checking what remains...'
find ~/ssabiroad/ml-models -name '*.pkl' -o -name '*.index' -o -name '*.bin'
echo ''
echo 'Starting fresh...'
cd ~/ssabiroad/ml-models
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 10
echo ''
echo 'Testing...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3

try {
    $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 10
    Write-Host "Buildings in index: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Yellow"})
    
    $queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue" -TimeoutSec 10
    Write-Host "Queue size: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Yellow"})
    
    if ($stats.index.total_buildings -eq 0) {
        Write-Host ""
        Write-Host "✅ Model reset successful!" -ForegroundColor Green
    }
} catch {
    Write-Host "Service not responding yet, wait a moment and check manually" -ForegroundColor Yellow
}
