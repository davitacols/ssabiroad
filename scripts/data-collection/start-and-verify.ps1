Write-Host "Starting service and checking status..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking if faiss_index was deleted...'
ls -la faiss_index/ 2>/dev/null || echo '✓ faiss_index deleted'
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
echo 'PID:' \$!
sleep 20
echo ''
echo 'Checking if process is running...'
ps aux | grep 'python.*start_server' | grep -v grep
echo ''
echo 'Checking logs for errors...'
tail -50 ml-api.log
echo ''
echo 'Testing endpoint...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Waiting for service to be ready..." -ForegroundColor Yellow

for ($i = 1; $i -le 10; $i++) {
    Start-Sleep -Seconds 3
    try {
        $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 5
        Write-Host ""
        Write-Host "✅ Service is running!" -ForegroundColor Green
        Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})
        
        if ($stats.index.total_buildings -eq 0) {
            Write-Host ""
            Write-Host "🎉 SUCCESS! Model is completely reset!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Ready for fresh training data:" -ForegroundColor Cyan
            Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
            Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
        }
        break
    } catch {
        Write-Host "Attempt $i/10: Waiting for service..." -ForegroundColor Yellow
    }
}
