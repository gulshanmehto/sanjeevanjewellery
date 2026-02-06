# 🚀 Quick Start Guide: S3 + GPU Worker

## Setup (One-time)

### 1. Run Setup Script
```bash
cd "/Users/gulshan/Kleveer Jewellery Ai"
./setup-s3-integration.sh
```

This will:
- ✅ Create/verify S3 bucket
- ✅ Test AWS credentials
- ✅ Generate environment files
- ✅ Optionally deploy backend

### 2. Deploy Backend (if not done)
```bash
cd backend

# Set Cloud Run environment variables
gcloud run services update sanjeevanjewellery-backend \
  --region=us-central1 \
  --set-env-vars="AWS_ACCESS_KEY_ID=YOUR_KEY,AWS_SECRET_ACCESS_KEY=YOUR_SECRET,AWS_REGION=us-east-1,AWS_S3_BUCKET=your-bucket,AWS_S3_PREFIX=jewelai"

# Or redeploy with env vars
gcloud run deploy sanjeevanjewellery-backend \
  --source . \
  --region=us-central1 \
  --env-vars-file=.env.s3
```

### 3. Setup GPU Worker on VM
```bash
# Upload files
cd gpu-server
gcloud compute scp worker.py run-worker.sh requirements.txt .env.worker \
  instance-20260206-184131:~/ --zone=us-central1-a

# SSH to VM
gcloud compute ssh instance-20260206-184131 --zone=us-central1-a

# On VM:
source .env.worker
source ~/upscaler-env/bin/activate
pip install boto3 botocore requests
chmod +x run-worker.sh
./run-worker.sh
```

---

## Daily Operations

### Start Worker
```bash
# SSH to GPU VM
gcloud compute ssh instance-20260206-184131 --zone=us-central1-a

# Run worker
cd ~
source .env.worker
source upscaler-env/bin/activate
./run-worker.sh
```

### Monitor Logs

**Backend (Cloud Run):**
```bash
gcloud run logs read sanjeevanjewellery-backend --region=us-central1 --limit=50
```

**Worker (VM):**
```bash
# Worker output is shown in terminal
# Or redirect to file:
./run-worker.sh > worker.log 2>&1 &
tail -f worker.log
```

**MongoDB Jobs:**
```javascript
// In MongoDB Compass or shell
use jewelai
db.jobs.find().sort({created_at: -1}).limit(10)
```

---

## Testing

### 1. Test S3 Upload
```bash
echo "test" > test.txt
aws s3 cp test.txt s3://your-bucket/test.txt
aws s3 ls s3://your-bucket/
```

### 2. Test Backend Job Creation
```bash
# Generate image from frontend
# Check response for job_id

# Or via curl:
curl https://sanjeevanjewellery-backend-381211478432.us-central1.run.app/api/jobs/next \
  -X POST -H "Worker-Id: test"
```

### 3. Test Worker Processing
```bash
# Worker should claim and process jobs automatically
# Watch terminal output for:
# "Claimed job: {job_id}"
# "Downloading s3://..."
# "Upscaling 1024x1024 → 4x"
# "Uploading s3://..."
# "✅ Job completed"
```

---

## Troubleshooting

### Backend not creating jobs?
```bash
# Check if S3 storage initialized
gcloud run logs read sanjeevanjewellery-backend | grep "S3 storage"

# Should see: "✅ S3 storage initialized"
# If error: "S3 storage not configured" - check env vars
```

### Worker not claiming jobs?
```bash
# Check MongoDB for queued jobs
db.jobs.find({status: "queued"})

# Check worker connection to backend
curl https://sanjeevanjewellery-backend-381211478432.us-central1.run.app/api/jobs/next \
  -X POST -H "Worker-Id: test"

# Restart worker
pkill -f worker.py
./run-worker.sh
```

### S3 access denied?
```bash
# Test AWS credentials
aws s3 ls s3://your-bucket/

# Verify IAM policy includes:
# - s3:GetObject
# - s3:PutObject
# - s3:ListBucket
```

### GPU not detected?
```bash
# Check NVIDIA driver
nvidia-smi

# Reinstall if needed
sudo /opt/google/cuda-installer/cuda-installer

# Verify PyTorch CUDA
source upscaler-env/bin/activate
python3 -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

---

## Cost Management

### Current Costs
- **Cloud Run**: ~$0.01 per generation
- **S3 Storage**: ~$0.023/GB/month
- **S3 Transfer**: ~$0.09/GB
- **GPU VM**: ~$0.35/hour when running
- **GPU VM Idle**: $0 (auto-shutdown)

### Optimize Costs
```bash
# 1. Reduce worker idle timeout (default 5 min)
export IDLE_SHUTDOWN_MIN=3  # 3 minutes

# 2. Set S3 lifecycle policy (auto-delete old files)
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-bucket \
  --lifecycle-configuration file://lifecycle.json

# lifecycle.json:
{
  "Rules": [{
    "Id": "Delete old jobs",
    "Status": "Enabled",
    "Prefix": "jewelai/jobs/",
    "Expiration": {"Days": 7}
  }]
}

# 3. Use S3 Intelligent-Tiering
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket your-bucket \
  --id AutoTiering \
  --intelligent-tiering-configuration '{...}'
```

---

## File Locations

### Local
- Setup script: `setup-s3-integration.sh`
- Worker code: `gpu-server/worker.py`
- Worker startup: `gpu-server/run-worker.sh`
- Documentation: `S3_INTEGRATION_SUMMARY.md`

### Backend (Cloud Run)
- Code: `backend/server.py`
- S3 service: `backend/services/s3_storage.py`
- Requirements: `backend/requirements.txt`

### GPU VM
- Worker: `~/worker.py`
- Startup: `~/run-worker.sh`
- Environment: `~/.env.worker`
- Venv: `~/upscaler-env/`
- Model: `~/weights/RealESRGAN_x4plus.pth`

---

## Environment Variables Reference

### Backend (.env or Cloud Run)
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_S3_PREFIX=jewelai
AWS_S3_SIGNED_URL_TTL=3600
```

### Worker (.env.worker on VM)
```bash
BACKEND_API_URL=https://sanjeevanjewellery-backend-381211478432.us-central1.run.app
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
WORKER_ID=gpu-worker-$(hostname)
POLL_INTERVAL_SEC=5
IDLE_SHUTDOWN_MIN=5
MODEL_PATH=/home/gulshan/weights/RealESRGAN_x4plus.pth
```

---

## Next Steps

1. ✅ Run `./setup-s3-integration.sh`
2. ✅ Deploy backend with S3 env vars
3. ✅ Upload worker files to GPU VM
4. ✅ Start worker on GPU VM
5. ✅ Test by generating image from frontend
6. ✅ Monitor logs and S3 bucket
7. ✅ Set up S3 lifecycle policy for cost optimization

## Support

- **Workflow diagram**: [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)
- **Full documentation**: [S3_INTEGRATION_SUMMARY.md](S3_INTEGRATION_SUMMARY.md)
- **Backend code**: [backend/server.py](backend/server.py)
- **Worker code**: [gpu-server/worker.py](gpu-server/worker.py)
