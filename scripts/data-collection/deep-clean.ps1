Write-Host "Finding all ML data files..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
pkill -9 -f 'python.*8000'
sleep 3
echo ''
echo 'Finding all data files...'
find . -name '*.pkl' -o -name '*.index' -o -name '*.bin' -o -name 'faiss*' -o -name '*metadata*.json' -o -name '*stats*.json'
echo ''
echo 'Checking api directory...'
ls -la api/data/ 2>/dev/null || echo 'No api/data directory'
echo ''
echo 'Deleting ALL found files...'
find . -name '*.pkl' -delete
find . -name '*.index' -delete
find . -name '*.bin' -delete
find . -name 'faiss*' -delete
find . -name '*metadata*.json' -delete
find . -name '*stats*.json' -delete
rm -rf data/*
rm -rf api/data/*
echo ''
echo 'Creating fresh directories...'
mkdir -p data/training_queue data/trained_model data/embeddings data/temp
mkdir -p api/data/training_queue api/data/trained_model api/data/embeddings api/data/temp 2>/dev/null
echo ''
echo 'Verifying all data is gone...'
find . -name '*.pkl' -o -name '*.index' -o -name '*.bin' | wc -l
echo ''
echo 'Starting service...'
source venv/bin/activate
nohup python3 start_server.py > ml-api.log 2>&1 &
sleep 8
curl -s http://localhost:8000/training_queue
echo ''
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 3
$response = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"
$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"

Write-Host "Queue: $($response.samples.Count) items" -ForegroundColor $(if($response.samples.Count -eq 0){"Green"}else{"Red"})
Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})

if ($response.samples.Count -eq 0 -and $stats.index.total_buildings -eq 0) {
    Write-Host ""
    Write-Host "✅ COMPLETE RESET SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run: node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "Then: node scripts/data-collection/train-collected.js" -ForegroundColor White
}
