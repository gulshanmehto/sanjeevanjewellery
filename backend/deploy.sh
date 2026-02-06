#!/bin/bash

# Deployment script for Google Cloud Run
# NOTE: Secrets should be managed via Google Cloud Secret Manager
# This script requires environment variables to be set in Cloud Run console

# Set your project ID
PROJECT_ID="gen-lang-client-0566330304"
SERVICE_NAME="sanjeevanjewellery-backend"
REGION="us-central1"

echo "Deploying to Google Cloud Run..."
echo "⚠️  Make sure to set environment variables in Cloud Run console:"
echo "   - MONGO_URL"
echo "   - GEMINI_API_KEY"
echo "   - GEMINI_MODEL"
echo "   - CORS_ORIGINS"
echo ""

# Build and deploy without sensitive environment variables
# Environment variables should be set via Cloud Run console or Secret Manager
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300

echo ""
echo "Deployment complete!"
echo "⚠️  Remember to configure environment variables in Cloud Run console if not already set."
