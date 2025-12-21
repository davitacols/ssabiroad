Write-Host "Verifying ML API status..." -ForegroundColor Cyan

$commands = @"
echo 'Checking if ML API is running...'
ps aux | grep 'python.*8000' | grep -v grep
echo ''
echo 'Testing API endpoint...'
curl -s http://localhost:8000/training_queue
echo ''
echo 'Checking queue size...'
curl -s http://localhost:8000/training_queue | python3 -c 'import sys, json; data=json.load(sys.stdin); print(f\"Queue size: {len(data.get(\"samples\", []))} items\")'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Checking from external..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue" -TimeoutSec 5
    $queueSize = $response.samples.Count
    Write-Host "✅ ML API is running! Queue has $queueSize items" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ML API not responding from external IP" -ForegroundColor Red
    Write-Host "Starting service..." -ForegroundColor Yellow
    
    $startCmd = @"
cd ~/ssabiroad/ml-models
source venv/bin/activate
pkill -f 'python.*8000' 2>/dev/null
sleep 2
nohup python3 start_server.py > ml-api.log 2>&1 &
sleep 5
curl -s http://localhost:8000/training_queue
"@
    ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $startCmd
}

Write-Host ""
Write-Host "Ready! Now run:" -ForegroundColor Green
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
