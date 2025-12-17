#!/bin/bash
# Health check script for EC2 deployment

EC2_HOST=${1:-"localhost"}
PORT=8000

echo "🏥 Checking SSABIRoad ML API Health..."
echo "Host: $EC2_HOST:$PORT"
echo ""

# Check if service is running
echo "1️⃣ Service Status:"
curl -s http://$EC2_HOST:$PORT/ | python3 -m json.tool || echo "❌ Service not responding"
echo ""

# Check stats
echo "2️⃣ System Stats:"
curl -s http://$EC2_HOST:$PORT/stats | python3 -m json.tool || echo "❌ Stats endpoint failed"
echo ""

# Check models
echo "3️⃣ Model Status:"
curl -s http://$EC2_HOST:$PORT/models | python3 -m json.tool || echo "❌ Models endpoint failed"
echo ""

echo "✅ Health check complete"
