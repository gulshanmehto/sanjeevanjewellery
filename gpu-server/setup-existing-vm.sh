#!/bin/bash

INSTANCE_NAME="instance-20260206-184131"
ZONE="us-central1-a"
PROJECT="gen-lang-client-0566330304"

echo "🚀 Setting up GPU Upscaler on $INSTANCE_NAME..."
echo "================================================"

# 1. Create firewall rule for port 8080
echo "📡 Creating firewall rule..."
gcloud compute firewall-rules create allow-gpu-upscaler \
    --project=$PROJECT \
    --allow=tcp:8080 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow GPU upscaler server on port 8080" \
    --quiet 2>/dev/null || echo "Firewall rule already exists"

# 2. Install dependencies on VM
echo "📦 Installing dependencies..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT --command="
set -e
echo '🔧 Installing Python and dependencies...'
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip python3-venv wget

echo '📥 Creating virtual environment...'
python3 -m venv ~/upscaler-env
source ~/upscaler-env/bin/activate

echo '📦 Installing Python packages...'
pip install -q --upgrade pip
pip install -q fastapi uvicorn pillow numpy opencv-python-headless
pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install -q realesrgan basicsr facexlib gfpgan

echo '📥 Downloading Real-ESRGAN model...'
mkdir -p ~/weights
wget -q https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -O ~/weights/RealESRGAN_x4plus.pth

echo '✅ Dependencies installed successfully!'
"

# 3. Upload the app
echo "📤 Uploading upscaler app..."
gcloud compute scp ../gpu-server/app.py $INSTANCE_NAME:~/upscaler_app.py \
    --zone=$ZONE --project=$PROJECT

# 4. Update app.py path for the VM
echo "🔧 Configuring app for VM..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT --command="
sed -i \"s|/content/weights/RealESRGAN_x4plus.pth|/home/\$(whoami)/weights/RealESRGAN_x4plus.pth|g\" ~/upscaler_app.py
"

echo ""
echo "✅ Setup complete!"
echo "================================================"
echo "🎯 Next steps:"
echo ""
echo "1. Start the server:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT"
echo "   source ~/upscaler-env/bin/activate"
echo "   python3 ~/upscaler_app.py"
echo ""
echo "2. Server will run on: http://35.226.85.141:8080"
echo ""
echo "3. Test it:"
echo "   curl http://35.226.85.141:8080/health"
echo ""
echo "4. Add to backend env vars:"
echo "   GPU_UPSCALER_URL=http://35.226.85.141:8080"
echo "================================================"
