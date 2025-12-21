Write-Host "Force deleting faiss_index..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Killing service...'
sudo pkill -9 -f python
sleep 3
echo ''
echo 'Force deleting faiss_index...'
sudo rm -rf faiss_index
rm -rf faiss_index
echo ''
echo 'Recreating empty faiss_index...'
mkdir -p faiss_index
echo ''
echo 'Verifying it is empty...'
ls -la faiss_index/
echo ''
echo 'Deleting active learning queue...'
rm -rf data/active_learning/*
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 20
echo ''
echo 'Checking logs...'
tail -20 ml-api.log
echo ''
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 5

try {
    $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 10
    Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})
    
    if ($stats.index.total_buildings -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Model reset complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now run:" -ForegroundColor Yellow
        Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
        Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
    } else {
        Write-Host "⚠️  Still has $($stats.index.total_buildings) buildings - files may be recreated on startup" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Service not responding" -ForegroundColor Red
}
