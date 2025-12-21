Write-Host "Triggering ML training..." -ForegroundColor Cyan

# Try different training endpoints
$endpoints = @(
    "/trigger_training",
    "/train_model",
    "/start_training",
    "/process_queue"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Trying: $endpoint" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://34.224.33.158:8000$endpoint" -Method Post -TimeoutSec 10
        Write-Host "✅ Success with $endpoint" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json)
        break
    } catch {
        Write-Host "❌ $endpoint not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking stats..." -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "http://34.224.33.158:8000/stats"
Write-Host "Buildings: $($stats.index.total_buildings)" -ForegroundColor Cyan
Write-Host "Queue: $($stats.active_learning.queue_size)" -ForegroundColor Cyan

Write-Host ""
Write-Host "The model will train automatically when conditions are met." -ForegroundColor Yellow
Write-Host "Monitor at: https://ssabiroad.vercel.app/ml-training" -ForegroundColor Cyan
