#!/bin/bash
# Google Cloud Run deployment script

set -e

PROJECT_ID="pic2nav"
SERVICE_NAME="navisense-ml"
REGION="us-east1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
MEMORY="${MEMORY:-4Gi}"
CPU="${CPU:-2}"
ENV_FILE="${ENV_FILE:-../.codex-temp-cloudrun/cloudrun-env.yaml}"

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
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 300 \
  --allow-unauthenticated \
  --env-vars-file ${ENV_FILE} \
  --project ${PROJECT_ID}

# If the service was ever pinned to a specific revision, new deploys can be
# created without receiving traffic. Reset traffic back to LATEST explicitly.
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-latest \
  --region ${REGION} \
  --project ${PROJECT_ID}

echo "Health check..."
curl -fsSL "$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)')/health"

echo "Deployment complete."
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)'
