Write-Host "Killing actual process and deleting files..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Finding all Python processes...'
ps aux | grep python | grep -v grep
echo ''
echo 'Killing by port...'
sudo lsof -ti:8000 | xargs sudo kill -9 2>/dev/null || echo 'No process on port 8000'
sleep 3
echo ''
echo 'Deleting faiss_index files...'
cd ~/ssabiroad/ml-models/faiss_index
rm -f index.faiss metadata.pkl
cd ..
ls -la faiss_index/
echo ''
echo 'Deleting queue...'
rm -rf data/active_learning/training_queue.json
echo ''
echo 'Starting fresh service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 25
echo ''
echo 'Testing...'
curl -s http://localhost:8000/stats
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 5

$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"
Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor $(if($stats.index.total_buildings -eq 0){"Green"}else{"Red"})

if ($stats.index.total_buildings -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Ready for training!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run:" -ForegroundColor Cyan
    Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
}
