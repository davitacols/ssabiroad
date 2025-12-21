Write-Host "Checking service status..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking if service is running...'
ps aux | grep python | grep -v grep
echo ''
echo 'Checking logs...'
tail -50 ml-api.log
echo ''
echo 'Checking data files...'
find data/ -type f 2>/dev/null | head -20
echo ''
echo 'Manual start if needed...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 10
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3

Write-Host "Testing from external..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 10
    $queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue" -TimeoutSec 10
    
    Write-Host "✅ Service is running" -ForegroundColor Green
    Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Yellow"})
    Write-Host "Queue: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Yellow"})
    
    if ($stats.index.total_buildings -eq 0) {
        Write-Host ""
        Write-Host "✅ Model is reset! Ready for training." -ForegroundColor Green
        Write-Host ""
        Write-Host "Run:" -ForegroundColor Cyan
        Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
        Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Service not responding: $($_.Exception.Message)" -ForegroundColor Red
}
