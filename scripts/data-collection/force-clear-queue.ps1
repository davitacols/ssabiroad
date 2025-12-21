Write-Host "Finding and clearing queue..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Stopping service...'
sudo lsof -ti:8000 | xargs sudo kill -9
sleep 5
echo ''
echo 'Finding queue files...'
find . -name '*queue*.json' -o -name '*training*.json' | grep -v venv | grep -v node_modules
echo ''
echo 'Deleting all queue and training files...'
find . -name '*queue*.json' ! -path '*/venv/*' -delete
find . -name '*training*.json' ! -path '*/venv/*' -delete
rm -rf data/training/*
rm -rf data/active_learning/*
rm -rf data/temp/*
echo ''
echo 'Verifying deletion...'
find data/ -type f
echo ''
echo 'Starting service...'
source venv/bin/activate
python3 start_server.py > ml-api.log 2>&1 &
sleep 20
echo ''
curl -s http://localhost:8000/training_queue
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Start-Sleep -Seconds 5

$queue = Invoke-RestMethod -Uri "http://34.224.33.158:8000/training_queue"
Write-Host "Queue: $($queue.samples.Count) items" -ForegroundColor $(if($queue.samples.Count -eq 0){"Green"}else{"Red"})

if ($queue.samples.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ Queue cleared! Resend with:" -ForegroundColor Green
    Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
}
