Write-Host "Checking current status..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Is service running?'
ps aux | grep 'python.*start_server' | grep -v grep
echo ''
echo 'Faiss index contents:'
ls -la faiss_index/ 2>/dev/null || echo 'Directory does not exist'
echo ''
echo 'Last 30 lines of log:'
tail -30 ml-api.log 2>/dev/null || echo 'No log file'
echo ''
echo 'Testing endpoint:'
curl -s http://localhost:8000/stats 2>/dev/null || echo 'Not responding'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 2

try {
    $stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats" -TimeoutSec 10
    Write-Host "✅ Service is UP" -ForegroundColor Green
    Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Yellow"})
    
    if ($stats.index.total_buildings -eq 0) {
        Write-Host ""
        Write-Host "🎉 MODEL IS RESET!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run:" -ForegroundColor Cyan
        Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
        Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Service not responding" -ForegroundColor Red
    Write-Host "Run: .\scripts\data-collection\start-and-verify.ps1" -ForegroundColor Yellow
}
