Write-Host "Clearing remaining queue items and model..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
pkill -f 'python.*8000'
sleep 3
echo ''
echo 'Deleting ALL data files...'
rm -rf data/training_queue/*
rm -rf data/trained_model/*
rm -rf data/embeddings/*
rm -rf data/temp/*
rm -rf data/images/*
rm -f data/*.pkl
rm -f data/*.index
rm -f data/*.bin
rm -f data/*.json
rm -f data/faiss_index.bin
rm -f data/image_metadata.json
rm -f data/model_stats.json
echo 'All data cleared!'
echo ''
echo 'Listing data directory...'
ls -la data/
echo ''
echo 'Restarting service...'
source venv/bin/activate
nohup python3 start_server.py > ml-api.log 2>&1 &
sleep 5
echo ''
echo 'Checking queue...'
curl -s http://localhost:8000/training_queue
echo ''
echo 'Checking stats...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 2
Write-Host "Verifying queue is empty..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue" -TimeoutSec 5
    $queueSize = $response.samples.Count
    if ($queueSize -eq 0) {
        Write-Host "✅ Queue is empty! Ready for fresh training data" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Queue still has $queueSize items" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not verify queue" -ForegroundColor Red
}

Write-Host ""
Write-Host "Now upload fresh training data:" -ForegroundColor Green
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
