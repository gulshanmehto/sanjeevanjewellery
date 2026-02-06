#!/bin/bash
# Quick setup script for AWS S3 + GPU Worker integration

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   JewelAI S3 + GPU Worker Integration Setup           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it:"
    echo "   brew install awscli  # macOS"
    echo "   pip install awscli   # Python"
    exit 1
fi

echo "📋 Step 1: AWS S3 Bucket Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Enter S3 bucket name (e.g., jewelai-production): " BUCKET_NAME
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "Creating S3 bucket: $BUCKET_NAME in $AWS_REGION..."

# Create bucket
aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null || echo "Bucket already exists"

# Enable versioning (optional)
read -p "Enable versioning? (y/n): " ENABLE_VERSIONING
if [ "$ENABLE_VERSIONING" = "y" ]; then
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    echo "✅ Versioning enabled"
fi

echo "✅ S3 bucket ready: s3://$BUCKET_NAME"
echo ""

echo "📋 Step 2: AWS Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You'll need:"
echo "1. AWS_ACCESS_KEY_ID"
echo "2. AWS_SECRET_ACCESS_KEY"
echo ""
echo "Get these from AWS IAM Console:"
echo "👉 https://console.aws.amazon.com/iam/home#/users"
echo ""

read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
read -sp "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
echo ""

# Test credentials
echo "Testing AWS credentials..."
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" \
   aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "✅ Credentials valid"
else
    echo "❌ Invalid credentials or no access to bucket"
    exit 1
fi

echo ""
echo "📋 Step 3: Update Backend Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > backend/.env.s3 << EOF
# AWS S3 Configuration (Generated $(date))
AWS_ACCESS_KEY_ID=$AWS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET
AWS_REGION=$AWS_REGION
AWS_S3_BUCKET=$BUCKET_NAME
AWS_S3_PREFIX=jewelai
AWS_S3_SIGNED_URL_TTL=3600
EOF

echo "✅ Created backend/.env.s3"
echo ""
echo "⚠️  Add these to your Cloud Run environment variables:"
echo ""
cat backend/.env.s3
echo ""

echo "📋 Step 4: Deploy Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Deploy backend to Cloud Run now? (y/n): " DEPLOY_BACKEND
if [ "$DEPLOY_BACKEND" = "y" ]; then
    echo "Installing Python dependencies..."
    cd backend
    pip install -q boto3 botocore
    
    echo "Deploying to Cloud Run..."
    gcloud run deploy sanjeevanjewellery-backend \
        --source . \
        --region us-central1 \
        --set-env-vars "AWS_ACCESS_KEY_ID=$AWS_KEY,AWS_SECRET_ACCESS_KEY=$AWS_SECRET,AWS_REGION=$AWS_REGION,AWS_S3_BUCKET=$BUCKET_NAME,AWS_S3_PREFIX=jewelai,AWS_S3_SIGNED_URL_TTL=3600"
    
    echo "✅ Backend deployed with S3 support"
    cd ..
else
    echo "⏭️  Skipped backend deployment"
fi

echo ""
echo "📋 Step 5: Setup GPU Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > gpu-server/.env.worker << EOF
# GPU Worker Configuration (Generated $(date))
export BACKEND_API_URL="https://sanjeevanjewellery-backend-381211478432.us-central1.run.app"
export AWS_ACCESS_KEY_ID="$AWS_KEY"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET"
export AWS_REGION="$AWS_REGION"
export AWS_S3_BUCKET="$BUCKET_NAME"
export WORKER_ID="gpu-worker-\$(hostname)"
export POLL_INTERVAL_SEC="5"
export IDLE_SHUTDOWN_MIN="5"
EOF

echo "✅ Created gpu-server/.env.worker"
echo ""
echo "📤 Upload worker files to GPU VM:"
echo ""
echo "cd gpu-server"
echo "gcloud compute scp worker.py run-worker.sh requirements.txt .env.worker \\"
echo "  instance-20260206-184131:~/ --zone=us-central1-a"
echo ""
echo "Then on the VM:"
echo ""
echo "source ~/.env.worker"
echo "source ~/upscaler-env/bin/activate"
echo "pip install boto3 botocore requests"
echo "chmod +x run-worker.sh"
echo "./run-worker.sh"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║                  ✅ Setup Complete!                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Deploy backend to Cloud Run (if not done)"
echo "2. Upload worker files to GPU VM"
echo "3. Start worker on GPU VM"
echo "4. Test by generating an image from frontend"
echo ""
echo "📊 Monitor:"
echo "  - Backend logs: gcloud run logs read sanjeevanjewellery-backend"
echo "  - Worker logs: SSH to VM and check worker output"
echo "  - S3 bucket: https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
echo ""
echo "📖 Full documentation: S3_INTEGRATION_SUMMARY.md"
echo ""
