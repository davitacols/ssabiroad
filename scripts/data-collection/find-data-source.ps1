Write-Host "Searching entire system for data source..." -ForegroundColor Cyan

$commands = @"
echo 'Searching for files containing building data...'
find ~/ssabiroad -name '*.faiss' -o -name '*.index' -o -name '*.pkl' -o -name '*.bin' 2>/dev/null | grep -v venv | grep -v node_modules
echo ''
echo 'Searching for JSON files with metadata...'
find ~/ssabiroad -name '*metadata*.json' -o -name '*buildings*.json' -o -name '*index*.json' 2>/dev/null | grep -v node_modules
echo ''
echo 'Checking API code for hardcoded paths...'
cd ~/ssabiroad/ml-models
grep -r 'faiss' api/ --include='*.py' | grep -v '.pyc' | head -10
echo ''
echo 'Checking for data in parent directories...'
find ~/ssabiroad -type f -name '*.faiss' -o -name '*.index' 2>/dev/null
echo ''
echo 'Checking api directory structure...'
ls -la api/
"@

ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 $commands

Write-Host ""
Write-Host "Based on the findings above, we need to delete the actual data source." -ForegroundColor Yellow
Write-Host "The 38 buildings are loading from a persistent file that survived the deletion." -ForegroundColor Yellow
