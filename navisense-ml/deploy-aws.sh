#!/bin/bash

# AWS ECS Deployment Script for Navisense ML Service
# This script builds and deploys the ML service to AWS ECS Fargate

set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPO_NAME="navisense-ml"
ECS_CLUSTER="ssabiroad-cluster"
ECS_SERVICE="navisense-ml-service"
TASK_FAMILY="navisense-ml"

echo "🚀 Starting AWS ECS deployment..."

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "🏗️  Building Docker image..."
docker build -f Dockerfile.aws -t $ECR_REPO_NAME:latest .

# Tag image
echo "🏷️  Tagging image..."
docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

# Push to ECR
echo "⬆️  Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

# Create CloudWatch log group
echo "📝 Creating CloudWatch log group..."
aws logs create-log-group --log-group-name /ecs/$TASK_FAMILY --region $AWS_REGION 2>/dev/null || true

# Update task definition with actual account ID
echo "📄 Updating task definition..."
sed "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" ecs-task-definition.json > ecs-task-definition-updated.json

# Register task definition
echo "📋 Registering task definition..."
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-updated.json --region $AWS_REGION

# Create ECS cluster if it doesn't exist
echo "🏢 Creating ECS cluster..."
aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION 2>/dev/null || \
aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION

# Update or create service
echo "🔄 Updating ECS service..."
aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION 2>/dev/null && \
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --task-definition $TASK_FAMILY --force-new-deployment --region $AWS_REGION || \
echo "Service doesn't exist. Create it manually via AWS Console with ALB and proper networking."

echo "✅ Deployment complete!"
echo "🌐 Service URL will be available via your Application Load Balancer"
