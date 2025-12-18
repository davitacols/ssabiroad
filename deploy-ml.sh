#!/bin/bash
# Deploy ML Model to EC2

echo "🚀 Deploying ML Model to EC2..."

# Configuration
EC2_IP="34.224.33.158"
EC2_USER="ec2-user"
KEY_PATH="$1"  # Pass SSH key as first argument

if [ -z "$KEY_PATH" ]; then
    echo "❌ Error: SSH key path required"
    echo "Usage: ./deploy-ml.sh /path/to/your-key.pem"
    exit 1
fi

echo "📦 Copying updated files to EC2..."
scp -i "$KEY_PATH" ml-models/api/main.py ${EC2_USER}@${EC2_IP}:~/ml-models/api/

echo "🔄 Restarting ML server..."
ssh -i "$KEY_PATH" ${EC2_USER}@${EC2_IP} << 'EOF'
    cd ~/ml-models/api
    
    # Check if PM2 is running
    if command -v pm2 &> /dev/null; then
        echo "Using PM2 to restart..."
        pm2 restart navisense || pm2 start main.py --name navisense
    else
        echo "PM2 not found, killing old process and starting new one..."
        pkill -f "python.*main.py"
        nohup python3 main.py > ml-server.log 2>&1 &
    fi
    
    echo "✅ ML server restarted"
EOF

echo "🧪 Testing ML server..."
sleep 3
curl -s http://${EC2_IP}:8000/ | python3 -m json.tool

echo ""
echo "✅ Deployment complete!"
echo "🔗 ML Server: http://${EC2_IP}:8000"
