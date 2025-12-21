@echo off
echo ========================================
echo Resetting ML Model on EC2
echo ========================================
echo.

echo Step 1: Connecting to EC2 server...
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "bash -s" << 'EOF'

echo "Connected to EC2 server"
echo ""

echo "Step 2: Stopping ML service..."
sudo systemctl stop ml-api 2>/dev/null || pm2 stop ml-api 2>/dev/null || echo "Service not running"

echo ""
echo "Step 3: Clearing training data..."
sudo rm -rf /home/ubuntu/ml-api/data/training_queue/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/data/trained_model/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/data/embeddings/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/training_queue/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/trained_model/* 2>/dev/null
sudo rm -rf /home/ubuntu/ml-api/embeddings/* 2>/dev/null

echo ""
echo "Step 4: Restarting ML service..."
sudo systemctl start ml-api 2>/dev/null || pm2 restart ml-api 2>/dev/null || echo "Please start service manually"

echo ""
echo "Step 5: Checking queue status..."
sleep 3
curl -s http://localhost:8000/training_queue | head -20

echo ""
echo "========================================"
echo "ML Model Reset Complete!"
echo "========================================"

EOF

echo.
echo Next steps:
echo 1. Run: node scripts/data-collection/enrich-addresses.js
echo 2. Run: node scripts/data-collection/train-collected.js
echo 3. Trigger retrain: curl -X POST http://34.224.33.158:8000/retrain
echo.
pause
