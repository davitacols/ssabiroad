Write-Host "Checking ML API code..." -ForegroundColor Cyan

$commands = @"
cd ~/ssabiroad/ml-models
echo 'Checking train endpoint in main.py...'
grep -A 30 'def.*train' api/main.py | head -50
echo ''
echo 'Checking for address/location handling...'
grep -n 'address\|location\|metadata' api/main.py | head -20
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "The ML API needs to be fixed to store the address field." -ForegroundColor Yellow
Write-Host "The address is being sent but not saved to the queue." -ForegroundColor Yellow
