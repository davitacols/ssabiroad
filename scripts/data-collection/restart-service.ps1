Write-Host "Checking service and restarting..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking if service is running...'
ps aux | grep python | grep 8000 | grep -v grep
echo ''
echo 'Checking error logs...'
tail -100 ml-api.log
echo ''
echo 'Starting service manually...'
source venv/bin/activate
nohup python3 start_server.py > ml-api.log 2>&1 &
echo 'Waiting 15 seconds...'
sleep 15
echo ''
echo 'Checking if started...'
ps aux | grep python | grep 8000 | grep -v grep
echo ''
echo 'Testing endpoint...'
curl -s http://localhost:8000/stats || echo 'Not responding'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Testing from external..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

for ($i = 1; $i -le 5; $i++) {
    try {
        $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 5
        Write-Host "✅ Service is UP!" -ForegroundColor Green
        Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Yellow"})
        
        if ($stats.index.total_buildings -eq 0) {
            Write-Host ""
            Write-Host "✅ MODEL IS RESET! Ready for fresh training!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Run these now:" -ForegroundColor Cyan
            Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
            Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
        }
        break
    } catch {
        Write-Host "Attempt $i/5: Service not ready, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}
