Write-Host "Finding and starting ML API..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking for main.py or app.py...'
find . -maxdepth 2 -name 'main.py' -o -name 'app.py'
echo ''
echo 'Checking start_server.py...'
cat start_server.py
echo ''
echo 'Starting ML API...'
source venv/bin/activate
pkill -f 'python.*8000' 2>/dev/null
sleep 2
python3 start_server.py > ml-api.log 2>&1 &
sleep 3
echo ''
echo 'Checking if service is running...'
curl -s http://localhost:8000/training_queue
echo ''
ps aux | grep python | grep -v grep
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Service started! Now run:" -ForegroundColor Green
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
