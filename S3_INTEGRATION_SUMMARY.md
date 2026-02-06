# AWS S3 + GPU Worker Integration Summary

## 🔄 Complete Workflow

```
┌─────────────┐
│  Frontend   │
│  (Vercel)   │
└──────┬──────┘
       │ 1. Upload + Generate
       ▼
┌─────────────────────────┐
│  Backend (Cloud Run)     │
│  - Gemini generation     │
│  - Upload to S3          │
│  - Create job in MongoDB │
└──────┬──────────────────┘
       │ 2. Return job_id (processing)
       ▼
┌──────────────┐
│  MongoDB     │
│  jobs: {     │
│    status:   │
│    "queued"  │
│  }           │
└──────┬───────┘
       │ 3. Poll for job
       ▼
┌─────────────────────────┐
│  GPU Worker (GCP VM)     │
│  - Claim job             │
│  - Download from S3      │
│  - Real-ESRGAN 4x        │
│  - Upload to S3          │
│  - Mark complete         │
└──────┬──────────────────┘
       │ 4. Job completed
       ▼
┌──────────────┐
│  MongoDB     │
│  jobs: {     │
│    status:   │
│    "completed│
│    output:   │
│    s3://...  │
│  }           │
└──────┬───────┘
       │ 5. Frontend polls /api/jobs/{job_id}
       ▼
┌─────────────┐
│  Frontend   │
│  - Get signed│
│    S3 URL    │
│  - Display   │
│    image     │
└─────────────┘
```

## 📦 Components Created

### 1. Backend Changes (server.py)
- ✅ Added S3 storage integration
- ✅ Job queue endpoints: `/api/jobs/next`, `/api/jobs/{job_id}/complete`, `/api/jobs/{job_id}`
- ✅ Modified `/api/generate` to create jobs when S3 configured
- ✅ Fallback to inline upscaling if S3 not configured

### 2. GPU Worker (worker.py)
- ✅ Polls backend for queued jobs
- ✅ Downloads images from S3
- ✅ Performs Real-ESRGAN 4x upscaling
- ✅ Uploads results back to S3
- ✅ Auto-shutdown after 5 min idle
- ✅ Marks jobs as completed/failed

### 3. Frontend Changes (GenerationPage.jsx)
- ✅ Handles `job_id` response
- ✅ Polls `/api/jobs/{job_id}` for completion
- ✅ Displays signed S3 URL when ready

### 4. Configuration Files
- ✅ requirements.txt: Added boto3, botocore, requests
- ✅ .env.example: Added AWS credentials template
- ✅ run-worker.sh: Worker startup script

## 🚀 Setup Instructions

### Step 1: Configure AWS S3

```bash
# Create S3 bucket
aws s3 mb s3://your-jewelai-bucket --region us-east-1

# Create IAM user with S3 access
# Attach policy: AmazonS3FullAccess (or custom policy)

# Get credentials:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
```

### Step 2: Update Backend Environment

Add to Cloud Run environment variables:

```bash
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-jewelai-bucket
AWS_S3_PREFIX=jewelai
AWS_S3_SIGNED_URL_TTL=3600
```

### Step 3: Deploy Backend

```bash
cd backend
pip install boto3 botocore  # New dependencies
# Redeploy to Cloud Run (auto-picks up new requirements)
```

### Step 4: Setup GPU Worker on VM

```bash
# SSH to your GPU VM: instance-20260206-184131
gcloud compute ssh instance-20260206-184131 --zone=us-central1-a

# Set environment variables
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
export AWS_S3_BUCKET="your-jewelai-bucket"
export AWS_REGION="us-east-1"
export BACKEND_API_URL="https://sanjeevanjewellery-backend-381211478432.us-central1.run.app"

# Upload worker files
# (Run from local machine)
cd gpu-server
gcloud compute scp worker.py run-worker.sh requirements.txt \
  instance-20260206-184131:~/ --zone=us-central1-a

# Back on VM:
source ~/upscaler-env/bin/activate
pip install boto3 botocore requests

# Make script executable
chmod +x run-worker.sh

# Run worker
./run-worker.sh
```

### Step 5: Test the Full Workflow

```bash
# 1. Frontend: Generate image
# 2. Backend: Creates job in MongoDB + uploads to S3
# 3. Worker: Processes job
# 4. Frontend: Polls and displays final result

# Check logs:
# - Backend: Cloud Run logs
# - Worker: VM terminal output
# - Jobs: MongoDB jobs collection
```

## 🔍 Monitoring

### Check Job Status
```bash
curl https://sanjeevanjewellery-backend-381211478432.us-central1.run.app/api/jobs/{job_id}
```

### MongoDB Job Document
```json
{
  "job_id": "uuid",
  "status": "completed",
  "input_s3_key": "jobs/uuid/generated.png",
  "output_s3_key": "jobs/uuid/output.png",
  "created_at": "2026-02-07T...",
  "completed_at": "2026-02-07T...",
  "worker_id": "gpu-worker-instance-xxx"
}
```

### S3 Structure
```
s3://your-bucket/
  jewelai/
    jobs/
      {job_id}/
        original.png      # User upload
        generated.png     # Gemini output
        output.png        # Upscaled 4x
```

## ⚙️ Configuration Options

### Backend (.env)
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_PREFIX` - S3 path prefix (default: jewelai)
- `AWS_S3_SIGNED_URL_TTL` - URL expiry in seconds (default: 3600)

### Worker (environment)
- `BACKEND_API_URL` - Backend API endpoint
- `WORKER_ID` - Worker identifier
- `POLL_INTERVAL_SEC` - Job poll frequency (default: 5)
- `IDLE_SHUTDOWN_MIN` - Auto-shutdown delay (default: 5)
- `MODEL_PATH` - Real-ESRGAN model path

## 💡 Benefits

1. **Scalability**: Backend stays serverless, GPU only runs when needed
2. **Cost Optimization**: VM auto-shuts down after 5 min idle (~$0/hour when stopped)
3. **Quality**: Real-ESRGAN 4x on GPU produces catalog-grade images
4. **Reliability**: S3 storage + job queue prevents data loss
5. **User Experience**: Frontend polls for completion, shows progress
6. **Flexibility**: Fallback to inline upscaling if S3 not configured

## 🎯 Next Steps

1. Deploy updated backend with S3 support
2. Configure AWS credentials in Cloud Run
3. Install worker dependencies on GPU VM
4. Run worker and test end-to-end
5. Monitor costs and adjust auto-shutdown timing

## 📊 Cost Estimate

- **S3**: ~$0.023/GB/month storage + $0.09/GB transfer
- **GPU VM**: ~$0.35/hour active, $0 when stopped
- **Cloud Run**: Pay per request (existing)
- **MongoDB Atlas**: Free tier (existing)

With 5-min auto-shutdown, GPU cost ≈ $0.03 per upscaling job.
