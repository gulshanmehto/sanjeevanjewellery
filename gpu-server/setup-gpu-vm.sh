#!/bin/bash

# GPU VM Setup Script for Google Cloud Platform
# Creates NVIDIA T4 VM with Real-ESRGAN

set -e

PROJECT_ID="gen-lang-client-0566330304"
ZONE="us-central1-c"
INSTANCE_NAME="gpu-upscaler"
MACHINE_TYPE="n1-standard-4"
GPU_TYPE="nvidia-tesla-t4"
GPU_COUNT="1"
BOOT_DISK_SIZE="50GB"

echo "🚀 Creating GPU VM for Real-ESRGAN upscaling..."
echo "================================================"
echo "Project: $PROJECT_ID"
echo "Zone: $ZONE"
echo "Instance: $INSTANCE_NAME"
echo "GPU: $GPU_TYPE x$GPU_COUNT"
echo "Machine: $MACHINE_TYPE"
echo ""

# Create the VM instance with GPU
gcloud compute instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --accelerator=type=$GPU_TYPE,count=$GPU_COUNT \
  --maintenance-policy=TERMINATE \
  --boot-disk-size=$BOOT_DISK_SIZE \
  --boot-disk-type=pd-standard \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --metadata=install-nvidia-driver=True,startup-script='#!/bin/bash
    # Wait for NVIDIA drivers
    echo "⏳ Waiting for NVIDIA drivers..."
    until nvidia-smi; do sleep 5; done
    echo "✅ GPU ready!"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    pip install fastapi uvicorn[standard] pillow numpy torch torchvision
    pip install realesrgan basicsr
    
    # Download Real-ESRGAN model
    echo "📥 Downloading Real-ESRGAN model..."
    cd /home
    wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/RealESRGAN_x4plus.pth
    
    echo "✅ GPU Server ready!"
  ' \
  --tags=gpu-server,http-server

echo ""
echo "✅ GPU VM created successfully!"
echo ""
echo "Next steps:"
echo "1. Wait 3-5 minutes for setup to complete"
echo "2. SSH to VM: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "3. Upload app.py and requirements.txt"
echo "4. Run: python3 app.py"
echo ""
echo "To create firewall rule:"
echo "gcloud compute firewall-rules create allow-gpu-server \\"
echo "  --allow tcp:8080 \\"
echo "  --target-tags gpu-server \\"
echo "  --source-ranges 0.0.0.0/0"
echo ""
echo "To get external IP:"
echo "gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)'"
