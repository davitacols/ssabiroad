# AWS ECS Deployment Guide for Navisense ML Service

## Prerequisites

1. AWS CLI installed and configured
2. Docker installed
3. AWS account with appropriate permissions
4. Existing RDS database (already configured)

## Quick Deployment Steps

### 1. Store Secrets in AWS Secrets Manager

```bash
# Store AWS credentials
aws secretsmanager create-secret \
  --name navisense/aws-access-key \
  --secret-string "YOUR_AWS_ACCESS_KEY" \
  --region us-east-1

aws secretsmanager create-secret \
  --name navisense/aws-secret-key \
  --secret-string "YOUR_AWS_SECRET_KEY" \
  --region us-east-1

# Store Pinecone API key
aws secretsmanager create-secret \
  --name navisense/pinecone-api-key \
  --secret-string "YOUR_PINECONE_API_KEY" \
  --region us-east-1

# Store Postgres password
aws secretsmanager create-secret \
  --name navisense/postgres-password \
  --secret-string "YOUR_POSTGRES_PASSWORD" \
  --region us-east-1
```

### 2. Run Deployment Script

```bash
cd navisense-ml
chmod +x deploy-aws.sh
./deploy-aws.sh
```

### 3. Create ECS Service (First Time Only)

After the script completes, create the service via AWS Console or CLI:

```bash
aws ecs create-service \
  --cluster ssabiroad-cluster \
  --service-name navisense-ml-service \
  --task-definition navisense-ml \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxxxx:targetgroup/navisense-ml/xxxxx,containerName=navisense-ml,containerPort=8000" \
  --region us-east-1
```

## Cost Estimate

- **ECS Fargate (1 vCPU, 2GB RAM)**: ~$30/month
- **Application Load Balancer**: ~$16/month
- **Data Transfer**: ~$5-10/month
- **CloudWatch Logs**: ~$1/month

**Total**: ~$52-57/month

## Alternative: EC2 Deployment (Cheaper)

For lower costs (~$10-15/month), use t3.small EC2 instance:

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Clone repo and deploy
git clone https://github.com/davitacols/ssabiroad.git
cd ssabiroad/navisense-ml

# Create .env file with your credentials
cat > .env << EOF
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_S3_REGION_NAME=us-east-1
AWS_S3_BUCKET_NAME=pic2nav-blog-2025
PINECONE_API_KEY=YOUR_PINECONE_API_KEY
PINECONE_INDEX_NAME=navisense-locations
POSTGRES_HOST=ssabiroad-db.ca968o2wg9ep.us-east-1.rds.amazonaws.com
POSTGRES_DATABASE=ssabiroad
POSTGRES_USER=ssabiroad_admin
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
EOF

# Build and run
docker build -f Dockerfile.aws -t navisense-ml .
docker run -d -p 8000:8000 --env-file .env --restart unless-stopped navisense-ml
```

## Monitoring

- CloudWatch Logs: `/ecs/navisense-ml`
- Health Check: `http://your-alb-url/health`
- Stats: `http://your-alb-url/stats`

## Troubleshooting

### Out of Memory
- Increase task memory in `ecs-task-definition.json`
- Current: 2048MB (2GB)
- Recommended: 4096MB (4GB) for production

### Slow Model Loading
- Models are loaded on container start
- First request may take 30-60 seconds
- Consider using EFS for model caching

## Update Deployment

```bash
./deploy-aws.sh
```

This will build, push, and force a new deployment automatically.
