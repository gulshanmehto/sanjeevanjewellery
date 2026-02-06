"""
Super-resolution pipeline for jewelry image enhancement.
Uses Real-ESRGAN for 4x upscaling to achieve catalog-grade quality.
"""
import logging
import os
from pathlib import Path
import base64
import io
from PIL import Image

logger = logging.getLogger(__name__)

# Try to import Real-ESRGAN
try:
    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer
    REALESRGAN_AVAILABLE = True
except ImportError:
    REALESRGAN_AVAILABLE = False
    logger.warning("Real-ESRGAN not available. Install with: pip install realesrgan")


class SuperResolutionPipeline:
    """Handles image upscaling and quality enhancement."""
    
    def __init__(self):
        """Initialize super-resolution model."""
        self.upsampler = None
        self._init_realesrgan()
    
    def _init_realesrgan(self):
        """Initialize Real-ESRGAN if available."""
        if not REALESRGAN_AVAILABLE:
            logger.info("Real-ESRGAN not available - using PIL upscaling fallback")
            return
        
        try:
            # Use RealESRGAN x4 model for 4x upscaling
            model_name = 'RealESRGAN_x4plus'
            model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=23,
                num_grow_ch=32,
                scale=4
            )
            
            # Download and load model weights
            model_path = self._get_model_path()
            self.upsampler = RealESRGANer(
                scale=4,
                model_path=model_path,
                upsampler=model,
                tile=400,  # Process in tiles to avoid memory issues
                tile_pad=10,
                pre_pad=0,
                half=False  # Use full precision for quality
            )
            logger.info("Real-ESRGAN initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Real-ESRGAN: {str(e)}")
            self.upsampler = None
    
    def _get_model_path(self) -> str:
        """Get path to Real-ESRGAN model weights."""
        model_dir = Path.home() / '.cache' / 'realesrgan'
        model_dir.mkdir(parents=True, exist_ok=True)
        model_path = model_dir / 'RealESRGAN_x4plus.pth'
        
        if not model_path.exists():
            logger.info(f"Downloading Real-ESRGAN model to {model_path}")
            # Model will be auto-downloaded by RealESRGANer
        
        return str(model_path)
    
    def upscale(self, image_data: bytes) -> bytes:
        """
        Upscale image using Real-ESRGAN 4x with natural quality (not over-sharpened).
        Falls back to PIL upscaling if Real-ESRGAN unavailable.
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Upscaled image bytes in JPEG format (quality 92, natural look)
        """
        try:
            # Convert bytes to PIL Image
            input_img = Image.open(io.BytesIO(image_data))
            
            # Convert RGBA to RGB if needed
            if input_img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                rgb_img = Image.new('RGB', input_img.size, (255, 255, 255))
                rgb_img.paste(input_img, mask=input_img.split()[-1] if input_img.mode in ('RGBA', 'LA') else None)
                input_img = rgb_img
            
            # Try Real-ESRGAN first
            if self.upsampler:
                try:
                    # Convert PIL to numpy for Real-ESRGAN
                    import numpy as np
                    input_array = np.array(input_img)
                    
                    # Upscale
                    output_array, _ = self.upsampler.enhance(input_array, outscale=4)
                    
                    # Convert back to PIL
                    upscaled_img = Image.fromarray(output_array)
                    logger.info(f"Real-ESRGAN upscale: {input_img.size} → {upscaled_img.size}")
                except Exception as e:
                    logger.warning(f"Real-ESRGAN failed: {str(e)}. Using PIL upscaling.")
                    upscaled_img = self._upscale_with_pil(input_img)
            else:
                # Fallback to PIL upscaling
                upscaled_img = self._upscale_with_pil(input_img)
            
            # Export as natural-quality JPEG (92 quality - less sharp, more natural)
            output_buffer = io.BytesIO()
            upscaled_img.save(
                output_buffer,
                format='JPEG',
                quality=92,  # Lower than 96 to reduce over-sharpening
                optimize=True,  # Enable optimization for smoother gradients
                subsampling=1  # 4:2:2 chroma for slightly softer, more natural look
            )
            
            return output_buffer.getvalue()
        
        except Exception as e:
            logger.error(f"Upscaling failed: {str(e)}")
            # Return original if upscaling fails
            return image_data
    
    @staticmethod
    def _upscale_with_pil(img: Image.Image) -> Image.Image:
        """
        Fallback: Upscale using PIL's high-quality Lanczos resampling.
        4x upscale using LANCZOS filter.
        """
        width, height = img.size
        new_size = (width * 4, height * 4)
        upscaled = img.resize(new_size, Image.Resampling.LANCZOS)
        logger.info(f"PIL upscale: {img.size} → {upscaled.size}")
        return upscaled
    
    @staticmethod
    def crop_to_aspect_ratio(img: Image.Image, aspect_ratio: str) -> Image.Image:
        """
        Crop image to exact aspect ratio by removing excess pixels.
        
        Args:
            img: PIL Image
            aspect_ratio: "1:1", "9:13", "16:9", "9:16", "21:9", "32:9"
            
        Returns:
            Cropped image matching exact aspect ratio
        """
        if not aspect_ratio:
            return img
        
        try:
            # Parse aspect ratio
            parts = aspect_ratio.split(':')
            if len(parts) != 2:
                logger.warning(f"Invalid aspect ratio: {aspect_ratio}")
                return img
            
            target_ratio = float(parts[0]) / float(parts[1])
            current_width, current_height = img.size
            current_ratio = current_width / current_height
            
            # Crop to match target ratio
            if abs(current_ratio - target_ratio) < 0.01:
                # Already correct ratio
                return img
            
            if current_ratio > target_ratio:
                # Image too wide - crop width
                new_width = int(current_height * target_ratio)
                left = (current_width - new_width) // 2
                img = img.crop((left, 0, left + new_width, current_height))
                logger.info(f"Cropped width to aspect ratio {aspect_ratio}: {current_width}x{current_height} → {img.size}")
            else:
                # Image too tall - crop height
                new_height = int(current_width / target_ratio)
                top = (current_height - new_height) // 2
                img = img.crop((0, top, current_width, top + new_height))
                logger.info(f"Cropped height to aspect ratio {aspect_ratio}: {current_width}x{current_height} → {img.size}")
            
            return img
        except Exception as e:
            logger.error(f"Aspect ratio crop failed: {e}")
            return img
    
    @staticmethod
    def base64_to_bytes(base64_str: str) -> bytes:
        """Convert base64 image string to bytes."""
        if base64_str.startswith('data:image'):
            # Remove data URI prefix
            base64_str = base64_str.split(',')[1]
        return base64.b64decode(base64_str)
    
    @staticmethod
    def bytes_to_base64(image_bytes: bytes) -> str:
        """Convert image bytes to base64 data URI."""
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{b64}"


# Global pipeline instance
_pipeline = None

def get_superresolution_pipeline() -> SuperResolutionPipeline:
    """Get or create super-resolution pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = SuperResolutionPipeline()
    return _pipeline

def upscale_image(image_data: bytes) -> bytes:
    """
    Upscale image to catalog grade quality with natural look.
    
    Args:
        image_data: Raw image bytes (PNG, JPEG, etc.)
        
    Returns:
        Upscaled JPEG bytes (quality 92, 4x resolution, natural look)
    """
    pipeline = get_superresolution_pipeline()
    return pipeline.upscale(image_data)

def upscale_base64_image(base64_image: str) -> str:
    """
    Upscale base64-encoded image with natural quality.
    
    Args:
        base64_image: Base64 image string (with or without data URI prefix)
        
    Returns:
        Upscaled image as base64 data URI (JPEG, quality 92)
    """
    pipeline = get_superresolution_pipeline()
    image_bytes = pipeline.base64_to_bytes(base64_image)
    upscaled_bytes = pipeline.upscale(image_bytes)
    return pipeline.bytes_to_base64(upscaled_bytes)
