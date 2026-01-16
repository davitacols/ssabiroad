#!/bin/bash
# Simple EC2 deployment script - Run this ON your EC2 instance

set -e

echo "🚀 Deploying Navisense ML to EC2..."

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker git
    sudo service docker start
    sudo usermod -a -G docker $USER
    echo "⚠️  Docker installed. Please logout and login again, then re-run this script."
    exit 0
fi

# Clone or pull repo
if [ -d "ssabiroad" ]; then
    cd ssabiroad
    git pull
else
    git clone https://github.com/davitacols/ssabiroad.git
    cd ssabiroad
fi

cd navisense-ml

# Create .env file
cat > .env << 'EOF'
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE
AWS_S3_REGION_NAME=us-east-1
AWS_S3_BUCKET_NAME=pic2nav-blog-2025
PINECONE_API_KEY=YOUR_PINECONE_API_KEY_HERE
PINECONE_INDEX_NAME=navisense-locations
POSTGRES_HOST=ssabiroad-db.ca968o2wg9ep.us-east-1.rds.amazonaws.com
POSTGRES_DATABASE=ssabiroad
POSTGRES_USER=ssabiroad_admin
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
PORT=8000
EOF

# Stop existing container
docker stop navisense-ml 2>/dev/null || true
docker rm navisense-ml 2>/dev/null || true

# Build and run
echo "🏗️  Building Docker image..."
docker build -f Dockerfile.aws -t navisense-ml .

echo "🚀 Starting container..."
docker run -d \
  --name navisense-ml \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  --memory="2g" \
  navisense-ml

echo "✅ Deployment complete!"
echo "🌐 Service running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "🏥 Health check: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/health"
