#!/bin/bash
set -e

PROJECT_ID=studio-1414464010-d19f1
ACCOUNT=taki-deploy@studio-1414464010-d19f1.iam.gserviceaccount.com
REGION=europe-west1
SERVICE_NAME=taki-backend
IMAGE=gcr.io/$PROJECT_ID/$SERVICE_NAME

cd "$(dirname "$0")/.."

echo "Building and pushing Docker image..."
gcloud builds submit \
  --config backend/cloudbuild.yaml \
  --substitutions TAG_NAME="$IMAGE" \
  --project "$PROJECT_ID" \
  --account "$ACCOUNT" \
  --suppress-logs \
  .

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 1 \
  --max-instances 1 \
  --timeout 3600 \
  --project "$PROJECT_ID" \
  --account "$ACCOUNT"

echo ""
echo "Deployed. Copy the service URL above and set it in frontend/.env:"
echo "  VITE_WS_URL=wss://<your-service-url>"
