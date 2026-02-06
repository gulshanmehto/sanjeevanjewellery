#!/bin/bash

# GPU Worker Setup Script for Google Cloud VM
# Configures and starts the Real-ESRGAN worker

echo "🔧 GPU Worker Setup"
echo "===================="

# Configuration from environment
export BACKEND_API_URL="${BACKEND_API_URL:-https://sanjeevanjewellery-backend-381211478432.us-central1.run.app}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID not set}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY not set}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_S3_BUCKET="${AWS_S3_BUCKET:?AWS_S3_BUCKET not set}"
export WORKER_ID="${WORKER_ID:-gpu-worker-$(hostname)}"
export MODEL_PATH="${MODEL_PATH:-/home/$(whoami)/weights/RealESRGAN_x4plus.pth}"
export POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-5}"
export IDLE_SHUTDOWN_MIN="${IDLE_SHUTDOWN_MIN:-5}"

echo "Backend: $BACKEND_API_URL"
echo "S3 Bucket: $AWS_S3_BUCKET"
echo "Worker ID: $WORKER_ID"
echo "Model Path: $MODEL_PATH"
echo ""

# Check Python environment
if [ ! -d "$HOME/upscaler-env" ]; then
    echo "❌ Python environment not found. Run setup first."
    exit 1
fi

# Activate environment
source "$HOME/upscaler-env/bin/activate"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "⚠️ Model not found at $MODEL_PATH"
    echo "Downloading Real-ESRGAN model..."
    mkdir -p "$(dirname $MODEL_PATH)"
    wget -q https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -O "$MODEL_PATH"
    echo "✅ Model downloaded"
fi

# Check GPU
if command -v nvidia-smi &> /dev/null; then
    echo "🎮 GPU Status:"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
else
    echo "⚠️ nvidia-smi not found. GPU may not be available."
fi

echo ""
echo "🚀 Starting GPU worker..."
echo ""

# Run worker
python3 worker.py

