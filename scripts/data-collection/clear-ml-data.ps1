Write-Host "Clearing ML data from ssabiroad directory..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad
echo 'Current directory:'
pwd
echo ''
echo 'Finding ML API files...'
find . -name 'main.py' -o -name 'app.py' | head -5
echo ''
echo 'Clearing all ML training data...'
find . -type f -path '*/data/training_queue/*' -delete 2>/dev/null
find . -type f -path '*/data/trained_model/*' -delete 2>/dev/null
find . -type f -path '*/data/embeddings/*' -delete 2>/dev/null
find . -type f -path '*/data/temp/*' -delete 2>/dev/null
find . -name '*.pkl' -path '*/data/*' -delete 2>/dev/null
find . -name '*.index' -path '*/data/*' -delete 2>/dev/null
echo 'Data cleared!'
echo ''
echo 'Killing ML processes...'
pkill -f 'uvicorn' || pkill -f 'python.*8000' || echo 'No process found'
sleep 2
echo ''
echo 'Finding and starting ML API...'
if [ -f 'main.py' ]; then
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-api.log 2>&1 &
elif [ -f 'ml-api/main.py' ]; then
  cd ml-api
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-api.log 2>&1 &
elif [ -f 'backend/main.py' ]; then
  cd backend
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-api.log 2>&1 &
fi
sleep 3
echo ''
echo 'Checking service...'
curl -s http://localhost:8000/training_queue | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/training_queue
echo ''
echo 'Done!'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "✅ Ready for fresh training data!" -ForegroundColor Green
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
