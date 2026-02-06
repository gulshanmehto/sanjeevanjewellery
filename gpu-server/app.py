"""
GPU Server for Real-ESRGAN 4x Image Upscaling
Runs on NVIDIA T4 GPU with auto-stop on idle
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import io
import base64
from PIL import Image
import numpy as np
import torch
import os
import logging
import time
from threading import Timer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GPU Upscaling Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
upscaler = None
last_request_time = time.time()
IDLE_TIMEOUT = 300  # 5 minutes in seconds

def load_model():
    """Load Real-ESRGAN model"""
    global upscaler
    if upscaler is None:
        try:
            from basicsr.archs.rrdbnet_arch import RRDBNet
            from realesrgan import RealESRGANer
            
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            upscaler = RealESRGANer(
                scale=4,
                model_path='/home/gulshan/weights/RealESRGAN_x4plus.pth',
                model=model,
                tile=0,
                tile_pad=10,
                pre_pad=0,
                half=True if torch.cuda.is_available() else False,
                gpu_id=0 if torch.cuda.is_available() else None
            )
            logger.info(f"✅ Real-ESRGAN loaded on {'GPU' if torch.cuda.is_available() else 'CPU'}")
        except Exception as e:
            logger.error(f"Failed to load Real-ESRGAN: {e}")
            upscaler = None

def check_idle_shutdown():
    """Shutdown VM if idle for too long"""
    global last_request_time
    idle_time = time.time() - last_request_time
    
    if idle_time > IDLE_TIMEOUT:
        logger.info(f"🛑 Idle for {idle_time:.0f}s. Shutting down VM...")
        os.system("sudo shutdown -h now")
    else:
        # Check again in 60 seconds
        Timer(60, check_idle_shutdown).start()

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🚀 GPU Server starting...")
    load_model()
    # Start idle checker
    Timer(60, check_idle_shutdown).start()

@app.get("/health")
async def health():
    """Health check"""
    global last_request_time
    last_request_time = time.time()
    
    return {
        "status": "healthy",
        "gpu_available": torch.cuda.is_available(),
        "model_loaded": upscaler is not None
    }

@app.post("/upscale")
async def upscale_image(file: UploadFile = File(...)):
    """
    Upscale image 4x using Real-ESRGAN
    """
    global last_request_time
    last_request_time = time.time()
    
    if upscaler is None:
        load_model()
        if upscaler is None:
            raise HTTPException(status_code=500, detail="Real-ESRGAN model not available")
    
    try:
        # Read image
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(img)
        
        # Upscale
        logger.info(f"📸 Upscaling {img.size} → {(img.size[0]*4, img.size[1]*4)}")
        output, _ = upscaler.enhance(img_np, outscale=4)
        
        # Convert back to PIL
        output_img = Image.fromarray(output)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        output_img.save(img_byte_arr, format='PNG', quality=95)
        img_byte_arr.seek(0)
        
        logger.info("✅ Upscaling complete")
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
        
    except Exception as e:
        logger.error(f"Upscaling failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upscale-base64")
async def upscale_base64(data: dict):
    """
    Upscale base64 image
    """
    global last_request_time
    last_request_time = time.time()
    
    if upscaler is None:
        load_model()
        if upscaler is None:
            raise HTTPException(status_code=500, detail="Real-ESRGAN model not available")
    
    try:
        # Decode base64
        img_data = base64.b64decode(data['image'])
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img_np = np.array(img)
        
        # Upscale
        logger.info(f"📸 Upscaling {img.size} → {(img.size[0]*4, img.size[1]*4)}")
        output, _ = upscaler.enhance(img_np, outscale=4)
        
        # Convert back to base64
        output_img = Image.fromarray(output)
        img_byte_arr = io.BytesIO()
        output_img.save(img_byte_arr, format='PNG', quality=95)
        img_byte_arr.seek(0)
        
        encoded = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        logger.info("✅ Upscaling complete")
        
        return {
            "success": True,
            "upscaled_image": f"data:image/png;base64,{encoded}"
        }
        
    except Exception as e:
        logger.error(f"Upscaling failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
