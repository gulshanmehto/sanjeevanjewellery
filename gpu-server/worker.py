"""
GPU Worker - Polls job queue and performs Real-ESRGAN upscaling
Runs on Google Cloud VM with NVIDIA L4 GPU
"""

import os
import time
import logging
import base64
import io
import sys
import requests
import traceback
import boto3
from botocore.exceptions import ClientError
from PIL import Image
import numpy as np
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "https://sanjeevanjewellery-backend-381211478432.us-central1.run.app")
WORKER_ID = os.environ.get("WORKER_ID", f"gpu-worker-{os.uname().nodename}")
POLL_INTERVAL_SEC = int(os.environ.get("POLL_INTERVAL_SEC", "5"))
MODEL_PATH = os.environ.get("MODEL_PATH", "/home/gulshan/weights/RealESRGAN_x4plus.pth")
IDLE_SHUTDOWN_MIN = int(os.environ.get("IDLE_SHUTDOWN_MIN", "5"))

# AWS S3
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.environ.get("AWS_S3_BUCKET")

# Global state
upscaler = None
last_activity_time = time.time()


def initialize_s3():
    """Create S3 client"""
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]):
        raise RuntimeError("AWS credentials not configured")
    
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )


def load_model():
    """Load Real-ESRGAN upscaler"""
    global upscaler
    if upscaler is not None:
        return
    
    logger.info("Loading Real-ESRGAN model...")
    
    model = RRDBNet(
        num_in_ch=3,
        num_out_ch=3,
        num_feat=64,
        num_block=23,
        num_grow_ch=32,
        scale=4
    )
    
    upscaler = RealESRGANer(
        scale=4,
        model_path=MODEL_PATH,
        model=model,
        tile=512,
        tile_pad=10,
        pre_pad=0,
        half=torch.cuda.is_available(),
        gpu_id=0 if torch.cuda.is_available() else None
    )
    
    gpu_status = "GPU ✅" if torch.cuda.is_available() else "CPU ⚠️"
    logger.info(f"Real-ESRGAN loaded on {gpu_status}")


def claim_next_job():
    """Poll backend for next queued job"""
    try:
        response = requests.post(
            f"{BACKEND_API_URL}/api/jobs/next",
            headers={"Worker-Id": WORKER_ID},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("job_id"), data
    except Exception as e:
        logger.error(f"Failed to claim job: {e}")
        return None, None


def download_from_s3(s3_client, key: str) -> bytes:
    """Download file from S3"""
    try:
        response = s3_client.get_object(Bucket=AWS_S3_BUCKET, Key=key)
        return response["Body"].read()
    except ClientError as e:
        logger.error(f"S3 download failed for {key}: {e}")
        raise


def upload_to_s3(s3_client, key: str, data: bytes, content_type: str = "image/png"):
    """Upload file to S3"""
    try:
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type
        )
    except ClientError as e:
        logger.error(f"S3 upload failed for {key}: {e}")
        raise


def upscale_image(image_bytes: bytes) -> bytes:
    """Perform 4x upscaling with Real-ESRGAN"""
    global last_activity_time
    last_activity_time = time.time()
    
    if upscaler is None:
        load_model()
    
    # Load image
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_np = np.array(img)
    
    logger.info(f"Upscaling {img.size} → 4x")
    
    # Upscale
    output_np, _ = upscaler.enhance(img_np, outscale=4)
    
    # Convert to PNG bytes
    output_img = Image.fromarray(output_np)
    output_buffer = io.BytesIO()
    output_img.save(output_buffer, format="PNG", quality=95)
    
    logger.info(f"Upscaled to {output_img.size}")
    
    return output_buffer.getvalue()


def complete_job(job_id: str, output_key: str):
    """Mark job as completed"""
    try:
        response = requests.post(
            f"{BACKEND_API_URL}/api/jobs/{job_id}/complete",
            json={"output_s3_key": output_key},
            timeout=10
        )
        response.raise_for_status()
        logger.info(f"Job {job_id} marked as completed")
    except Exception as e:
        logger.error(f"Failed to complete job {job_id}: {e}")


def fail_job(job_id: str, error_msg: str):
    """Mark job as failed"""
    try:
        response = requests.post(
            f"{BACKEND_API_URL}/api/jobs/{job_id}/fail",
            json={"error": error_msg},
            timeout=10
        )
        response.raise_for_status()
        logger.info(f"Job {job_id} marked as failed")
    except Exception as e:
        logger.error(f"Failed to mark job {job_id} as failed: {e}")


def process_job(job_id: str, job_data: dict, s3_client):
    """Process a single job: download → upscale → upload"""
    global last_activity_time
    
    try:
        input_key = job_data.get("input_s3_key")
        output_key = job_data.get("output_s3_key")
        
        if not input_key or not output_key:
            raise ValueError("Missing input_s3_key or output_s3_key")
        
        logger.info(f"Processing job {job_id}")
        
        # Download input
        logger.info(f"Downloading s3://{AWS_S3_BUCKET}/{input_key}")
        image_data = download_from_s3(s3_client, input_key)
        
        # Upscale
        upscaled_data = upscale_image(image_data)
        
        # Upload output
        logger.info(f"Uploading s3://{AWS_S3_BUCKET}/{output_key}")
        upload_to_s3(s3_client, output_key, upscaled_data)
        
        # Mark complete
        complete_job(job_id, output_key)
        
        last_activity_time = time.time()
        logger.info(f"✅ Job {job_id} completed successfully")
        
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}\n{traceback.format_exc()}")
        fail_job(job_id, error_msg)


def check_idle_shutdown():
    """Shutdown VM if idle too long"""
    idle_time = time.time() - last_activity_time
    idle_minutes = idle_time / 60
    
    if idle_minutes >= IDLE_SHUTDOWN_MIN:
        logger.warning(f"Idle for {idle_minutes:.1f} minutes. Shutting down VM...")
        os.system("sudo shutdown -h now")
        sys.exit(0)


def main():
    """Main worker loop"""
    logger.info(f"GPU Worker starting: {WORKER_ID}")
    logger.info(f"Backend: {BACKEND_API_URL}")
    logger.info(f"S3 Bucket: {AWS_S3_BUCKET}")
    logger.info(f"Poll interval: {POLL_INTERVAL_SEC}s")
    logger.info(f"Idle shutdown: {IDLE_SHUTDOWN_MIN} min")
    
    # Initialize
    s3_client = initialize_s3()
    load_model()
    
    logger.info("✅ Worker ready. Polling for jobs...")
    
    while True:
        try:
            # Check idle shutdown
            check_idle_shutdown()
            
            # Poll for job
            job_id, job_data = claim_next_job()
            
            if job_id:
                logger.info(f"Claimed job: {job_id}")
                process_job(job_id, job_data, s3_client)
            else:
                logger.debug("No jobs available")
            
            # Wait before next poll
            time.sleep(POLL_INTERVAL_SEC)
            
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Worker error: {e}\n{traceback.format_exc()}")
            time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
