"""AI generation service for Gemini API integration."""
import logging
import base64
import asyncio
from typing import Optional
import google.generativeai as genai

from config import settings
from models import GenerationResponse

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI image and video generation using Google Gemini API."""
    
    def __init__(self):
        """Initialize AI service with API key."""
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY not configured. Please set a valid API key in backend/.env file. "
                "See API_KEY_SETUP.md for instructions."
            )
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
    
    def _get_size_instruction(
        self,
        aspect_ratio_dimensions: Optional[str] = None,
        aspect_ratio_label: Optional[str] = None
    ) -> str:
        """Generate image size instruction for prompt."""
        if aspect_ratio_dimensions and aspect_ratio_label:
            return (
                f"\n\nOUTPUT IMAGE SIZE: Generate the image at "
                f"{aspect_ratio_dimensions} pixels ({aspect_ratio_label} aspect ratio) "
                f"for maximum quality."
            )
        return (
            "\n\nOUTPUT IMAGE SIZE: Generate the image at 3840x2160 pixels "
            "(4K UHD resolution) for maximum quality."
        )
    
    def _build_prompt(
        self,
        jewellery_type: str,
        shoot_type: str,
        preset_name: str,
        preset_description: str,
        quality: str,
        aspect_ratio_dimensions: Optional[str] = None,
        aspect_ratio_label: Optional[str] = None
    ) -> str:
        """Build the full prompt for image generation."""
        shoot_instructions = (
            self._get_product_instructions()
            if shoot_type == "product"
            else self._get_model_instructions()
        )
        
        base_prompt = JEWELLERY_PROMPT_TEMPLATE.format(
            jewellery_type=jewellery_type,
            shoot_type=shoot_type.upper(),
            preset_name=preset_name,
            preset_description=preset_description,
            quality=quality,
            shoot_type_instructions=shoot_instructions
        )
        
        size_instruction = self._get_size_instruction(
            aspect_ratio_dimensions,
            aspect_ratio_label
        )
        
        return base_prompt + size_instruction
    
    @staticmethod
    def _get_product_instructions() -> str:
        """Get product shoot instructions."""
        return """
Generate a clean professional jewellery product photoshoot.
No human model.
No hands unless explicitly part of the preset.
Focus sharply on the jewellery.
Commercial catalogue quality.
Perfect lighting and reflections.
Premium studio finish.
"""
    
    @staticmethod
    def _get_model_instructions() -> str:
        """Get model shoot instructions."""
        return """
Place the jewellery naturally on a realistic Indian model.
The jewellery must be worn correctly and clearly visible.
Natural skin tones.
Luxury fashion photography look.
No over-stylisation.
"""
    
    async def generate_image(
        self,
        image_data: bytes,
        jewellery_type: str,
        shoot_type: str,
        preset_name: str,
        preset_description: str,
        quality: str = "HD",
        aspect_ratio: Optional[str] = None,
        aspect_ratio_label: Optional[str] = None,
        aspect_ratio_dimensions: Optional[str] = None
    ) -> tuple[Optional[str], str]:
        """
        Generate an image using Gemini API.
        
        Args:
            image_data: Raw image bytes
            jewellery_type: Type of jewellery
            shoot_type: "product" or "model"
            preset_name: Preset style name
            preset_description: Preset description
            quality: Image quality (HD or 4K)
            aspect_ratio: Aspect ratio ID
            aspect_ratio_label: Aspect ratio label
            aspect_ratio_dimensions: Aspect ratio dimensions
        
        Returns:
            Tuple of (base64_image, status)
        """
        try:
            # Build prompt
            prompt = self._build_prompt(
                jewellery_type,
                shoot_type,
                preset_name,
                preset_description,
                quality,
                aspect_ratio_dimensions,
                aspect_ratio_label
            )
            
            logger.info(
                f"Generating {shoot_type} shoot for {jewellery_type} "
                f"with preset: {preset_name}"
            )
            
            # Get model
            model = genai.GenerativeModel(self.model_name)
            
            # Configure generation settings
            generation_config = {
                "temperature": 0.4,
            }
            
            # Run generation with timeout
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    self._generate_content_sync,
                    model,
                    prompt,
                    image_data,
                    generation_config
                ),
                timeout=settings.GENERATION_TIMEOUT_SECONDS
            )
            
            # Extract image from response
            generated_image_data = self._extract_image_from_response(response)
            
            if generated_image_data:
                image_b64 = base64.b64encode(generated_image_data).decode('utf-8')
                logger.info(f"Successfully generated image")
                return image_b64, "completed"
            else:
                logger.warning("No image data in response")
                return None, "failed"
        
        except asyncio.TimeoutError:
            logger.error("Image generation timeout")
            return None, "failed"
        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            return None, "failed"
    
    @staticmethod
    def _generate_content_sync(model, prompt: str, image_data: bytes, config: dict):
        """Sync wrapper for generate_content (called in executor)."""
        return model.generate_content(
            [prompt, {"mime_type": "image/png", "data": image_data}],
            generation_config=config
        )
    
    @staticmethod
    def _extract_image_from_response(response) -> Optional[bytes]:
        """Extract image bytes from Gemini API response."""
        try:
            if hasattr(response, 'candidates') and response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data'):
                        return part.inline_data.data
            return None
        except Exception as e:
            logger.error(f"Error extracting image from response: {str(e)}")
            return None


# Prompt template
JEWELLERY_PROMPT_TEMPLATE = """You are a professional commercial jewellery photography AI.

TASK:
Create a high-end, photorealistic jewellery photoshoot image using the uploaded jewellery image as the only product reference.

JEWELLERY TYPE:
{jewellery_type}

SHOOT TYPE:
{shoot_type} (product shoot OR model shoot)

STYLE / PRESET:
{preset_name}

SCENE & MOOD:
{preset_description}

OUTPUT QUALITY:
{quality} resolution (Ensure the output image reflects this level of professional detail and clarity)

IMPORTANT PRODUCT PRESERVATION RULES (VERY STRICT):
The jewellery shown in the uploaded image must remain:
- exactly the same design
- exactly the same stones and stone placement
- exactly the same metal colour
- exactly the same proportions and shape
- exactly the same engravings and details

Do NOT redesign, re-style, replace, simplify, upscale or alter the jewellery.
Only change lighting, background, environment, pose and composition.

{shoot_type_instructions}

COMPOSITION RULES:
- Jewellery must be the main hero of the image
- No text, logos, or watermarks
- No blur on the jewellery
- No cropping of the jewellery
- Proper scale and realistic perspective

LIGHTING & QUALITY:
Professional DSLR photography, soft cinematic lighting, high dynamic range, natural shadows, ultra-realistic texture, clean background separation, premium commercial advertising look.

CAMERA & OUTPUT:
50mm–85mm lens look, f/2.8 – f/5.6 depth of field, sharp focus on jewellery, high resolution, social media & catalogue ready.

FINAL GOAL:
A realistic, premium, sell-ready jewellery photoshoot image suitable for a real jewellery store catalogue and marketing campaigns in India.
"""
