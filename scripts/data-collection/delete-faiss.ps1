Write-Host "Finding and deleting FAISS index..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
sudo pkill -9 -f python
sleep 5
echo ''
echo 'Finding ALL index and data files...'
find . -name '*.faiss' -o -name '*.index' -o -name '*faiss*' -o -name '*.pkl' | grep -v venv
echo ''
echo 'Deleting them...'
find . -name '*.faiss' ! -path '*/venv/*' -delete
find . -name '*.index' ! -path '*/venv/*' -delete
find . -name '*faiss*' ! -path '*/venv/*' -type f -delete
find . -name '*.pkl' ! -path '*/venv/*' -delete
echo ''
echo 'Deleting data and training_queue completely...'
sudo rm -rf data training_queue
mkdir -p data/temp data/training data/active_learning data/geolocations training_queue
sudo chown -R ubuntu:ubuntu data training_queue
echo ''
echo 'Verifying no index files remain...'
find . -name '*.faiss' -o -name '*.index' -o -name '*.pkl' | grep -v venv | wc -l
echo ''
echo 'Starting fresh service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 15
echo ''
echo 'Testing...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 5

$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"
$queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"

Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})
Write-Host "Queue: $($queue.samples.Count)" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Red"})

if ($stats.index.total_buildings -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! All data cleared!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:" -ForegroundColor Yellow
    Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Data still persists. The index might be hardcoded or in a different location." -ForegroundColor Red
}
