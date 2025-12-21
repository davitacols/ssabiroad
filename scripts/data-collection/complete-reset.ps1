Write-Host "Complete ML Model Reset..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo '1. Stopping ALL Python processes on port 8000...'
pkill -9 -f 'python.*8000'
pkill -9 -f 'uvicorn'
sleep 5
echo ''
echo '2. Deleting ALL ML data files...'
rm -rf data/*
mkdir -p data/training_queue
mkdir -p data/trained_model
mkdir -p data/embeddings
mkdir -p data/temp
echo ''
echo '3. Verifying data directory is empty...'
find data/ -type f | wc -l
echo ''
echo '4. Starting fresh ML API...'
source venv/bin/activate
nohup python3 start_server.py > ml-api.log 2>&1 &
echo 'Waiting for service to start...'
sleep 8
echo ''
echo '5. Checking queue...'
curl -s http://localhost:8000/training_queue
echo ''
echo '6. Checking stats...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3
Write-Host "Final verification..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"
$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"

Write-Host "Queue size: $($response.samples.Count)" -ForegroundColor $(if($response.samples.Count -eq 0){"Green"}else{"Red"})
Write-Host "Model stats: $($stats | ConvertTo-Json -Compress)" -ForegroundColor Cyan

if ($response.samples.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! ML Model completely reset!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:" -ForegroundColor Yellow
    Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Queue still has items. Manual intervention needed." -ForegroundColor Red
}
