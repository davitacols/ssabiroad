#!/bin/bash
# Google Cloud Run deployment script

set -e

PROJECT_ID="pic2nav"
SERVICE_NAME="navisense-ml"
REGION="us-east1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "Deploying to Google Cloud Run..."

# Build and push image
echo "Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} --project ${PROJECT_ID} -f Dockerfile.cloudrun .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}" \
  --set-env-vars "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}" \
  --set-env-vars "AWS_S3_REGION_NAME=us-east-1" \
  --set-env-vars "AWS_S3_BUCKET_NAME=pic2nav-blog-2025" \
  --set-env-vars "PINECONE_API_KEY=${PINECONE_API_KEY}" \
  --set-env-vars "PINECONE_INDEX_NAME=navisense-locations" \
  --set-env-vars "POSTGRES_HOST=${POSTGRES_HOST}" \
  --set-env-vars "POSTGRES_DATABASE=ssabiroad" \
  --set-env-vars "POSTGRES_USER=ssabiroad_admin" \
  --set-env-vars "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" \
  --project ${PROJECT_ID}

# If the service was ever pinned to a specific revision, new deploys can be
# created without receiving traffic. Reset traffic back to LATEST explicitly.
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-latest \
  --region ${REGION} \
  --project ${PROJECT_ID}

echo "Deployment complete."
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)'
