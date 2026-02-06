/**
 * Custom hook for managing image generation workflow
 * Extracted from DashboardPage to improve code organization
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';

export const useImageGeneration = (authContext) => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [jewelleryType, setJewelleryType] = useState('ring');
  const [shootType, setShootType] = useState('product');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(null);
  const [quality, setQuality] = useState('HD');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const processFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return false;
    }

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
    toast.success('Image uploaded successfully!');
    return true;
  }, []);

  const generateImage = useCallback(async (user) => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return null;
    }

    if (!selectedPreset) {
      toast.error('Please select a preset');
      return null;
    }

    if (!selectedAspectRatio) {
      toast.error('Please select an aspect ratio');
      return null;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    let finalImage = null;
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 5, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('jewellery_type', jewelleryType);
      formData.append('shoot_type', shootType);
      formData.append('preset_name', selectedPreset?.label || 'Default');
      formData.append('preset_description', selectedPreset?.description || 'Professional studio lighting');
      formData.append('quality', quality);
      formData.append('email', user?.email || 'anonymous');

      if (selectedAspectRatio) {
        formData.append('aspect_ratio', selectedAspectRatio.id);
        formData.append('aspect_ratio_label', selectedAspectRatio.label);
        formData.append('aspect_ratio_dimensions', selectedAspectRatio.dimensions);
      }

      const response = await fetch(API_ENDPOINTS.GENERATE_IMAGE, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const data = await response.json();
        setGenerationProgress(100);

        if (data.status === 'completed' && data.generated_image) {
          finalImage = data.generated_image;
          setGeneratedImage(finalImage);
          toast.success('AI photoshoot generated successfully!');
        } else {
          finalImage = selectedPreset?.image || null;
          setGeneratedImage(finalImage);
          toast.info('Using preset image');
        }
      } else {
        setGenerationProgress(100);
        finalImage = selectedPreset?.image || null;
        setGeneratedImage(finalImage);
        toast.warning('Backend unavailable, using preset');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      finalImage = selectedPreset?.image || null;
      setGeneratedImage(finalImage);
      toast.error('Generation failed, using preset');
      console.error('Generation error:', error);
    }

    setIsGenerating(false);

    if (finalImage && authContext?.useCredits) {
      await authContext.useCredits(1);
    }

    return finalImage;
  }, [uploadedImage, selectedPreset, selectedAspectRatio, jewelleryType, shootType, quality, authContext]);

  const reset = useCallback(() => {
    setUploadedImage(null);
    setUploadedPreview(null);
    setGeneratedImage(null);
    setGenerationProgress(0);
  }, []);

  return {
    uploadedImage,
    uploadedPreview,
    jewelleryType,
    setJewelleryType,
    shootType,
    setShootType,
    selectedPreset,
    setSelectedPreset,
    selectedAspectRatio,
    setSelectedAspectRatio,
    quality,
    setQuality,
    generatedImage,
    isGenerating,
    generationProgress,
    processFile,
    generateImage,
    reset,
  };
};
