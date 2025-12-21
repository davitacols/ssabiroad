Write-Host "Finding and clearing ML API data..." -ForegroundColor Cyan

$commands = @"
echo 'Finding ML API directory...'
cd ~
if [ -d 'ml-api' ]; then
  cd ml-api
elif [ -d 'navisense-ml' ]; then
  cd navisense-ml
elif [ -d 'pic2nav-ml' ]; then
  cd pic2nav-ml
else
  echo 'Searching for ML API...'
  find ~ -name 'main.py' -o -name 'app.py' 2>/dev/null | head -1 | xargs dirname
fi

echo ''
echo 'Current directory:'
pwd
echo ''
echo 'Listing data directories:'
ls -la data/ 2>/dev/null || ls -la

echo ''
echo 'Clearing training data...'
rm -rf data/training_queue/* 2>/dev/null
rm -rf data/trained_model/* 2>/dev/null
rm -rf data/embeddings/* 2>/dev/null
rm -rf data/temp/* 2>/dev/null
rm -f data/*.pkl 2>/dev/null
rm -f data/*.index 2>/dev/null

echo ''
echo 'Finding and killing existing ML process...'
pkill -f 'uvicorn' || pkill -f 'python.*main.py' || echo 'No process found'

echo ''
echo 'Starting ML API...'
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ml-api.log 2>&1 &
sleep 3

echo ''
echo 'Checking if service is running...'
curl -s http://localhost:8000/training_queue || echo 'Service not responding'

echo ''
echo 'Done!'
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "✅ ML Model cleared and service restarted!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Upload fresh training data" -ForegroundColor Yellow
Write-Host "  node scripts/data-collection/enrich-addresses.js" -ForegroundColor White
Write-Host "  node scripts/data-collection/train-collected.js" -ForegroundColor White
