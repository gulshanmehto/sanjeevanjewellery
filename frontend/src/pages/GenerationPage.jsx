import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronRight, Download, RefreshCw, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { AspectRatioModal } from "@/components/AspectRatioModal";
import { ASPECT_RATIOS } from "@/lib/aspectRatios";
import { toast } from "sonner";
import { getImageFromIndexedDB } from "@/utils/imageStorage";

const GenerationPage = () => {
  const navigate = useNavigate();
  const { credits, updateCredits } = useAuth();
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(null);
  const [quality, setQuality] = useState("HD");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  useEffect(() => {
    const checkImages = async () => {
      const uploadedImage = await getImageFromIndexedDB("uploaded_image");
      const selectedCategory = sessionStorage.getItem("selected_category");
      const selectedPreset = sessionStorage.getItem("selected_preset");

      if (!uploadedImage || !selectedCategory || !selectedPreset) {
        navigate("/app");
      }
    };
    checkImages();
  }, [navigate]);

  const [uploadedPreview, setUploadedPreview] = useState(null);

  useEffect(() => {
    const getUploadedImage = async () => {
      const image = await getImageFromIndexedDB("uploaded_image");
      setUploadedPreview(image);
    };
    getUploadedImage();
  }, []);

  const selectedCategory = sessionStorage.getItem("selected_category");
  const selectedPreset = sessionStorage.getItem("selected_preset");
  const presetName = sessionStorage.getItem("preset_name");
  const presetDescription = sessionStorage.getItem("preset_description");

  const handleGenerate = async (selectedRatio = null) => {
    // ALWAYS check for aspect ratio selection first
    if (!selectedRatio) {
      setShowAspectRatioModal(true);
      return;
    }

    if (credits < 1) {
      toast.error("Insufficient credits! Please purchase more credits.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    // Store selected ratio to state
    setSelectedAspectRatio(selectedRatio);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const base64Data = uploadedPreview.split(',')[1];
      const formData = new FormData();

      // Convert base64 to blob and append as file
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      formData.append('image', blob, 'jewellery.png');

      // Append other form fields with selected ratio details
      formData.append('jewellery_type', selectedCategory);
      formData.append('shoot_type', 'product');
      formData.append('preset_name', presetName);
      formData.append('preset_description', presetDescription);
      formData.append('quality', quality);
      formData.append('aspect_ratio', selectedRatio.ratio);
      formData.append('aspect_ratio_label', selectedRatio.label);
      formData.append('aspect_ratio_dimensions', selectedRatio.dimensions);

      const response = await fetch("http://localhost:32000/api/generate", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Generation failed");
      }

      const data = await response.json();
      setGenerationProgress(100);
      setGeneratedImage(data.generated_image || data.image);

      if (updateCredits) {
        updateCredits(credits - 1);
      }

      toast.success("Image generated successfully!");
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setGenerationProgress(0);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    try {
      // Create a specific filename
      const timestamp = Date.now();
      const safeCategory = selectedCategory ? selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'generated';
      const fileName = `jewelai-${safeCategory}-${timestamp}.png`;

      // If it's a data URL, let's treat it carefully to ensure the browser respects the filename
      if (generatedImage.startsWith('data:')) {
        const fetchImage = async () => {
          try {
            const res = await fetch(generatedImage);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Cleanup: Delay revocation to ensure download starts correctly
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            toast.success("Image downloaded successfully!");
          } catch (e) {
            console.error("Download fallback failed", e);
            // Fallback to simple anchor
            const link = document.createElement("a");
            link.href = generatedImage;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
        fetchImage();
      } else {
        // Regular URL
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = fileName;
        link.target = "_blank"; // Safety for remote URLs
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image download started!");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Could not download image");
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedImage) {
      toast.error("Please generate an image first");
      return;
    }

    if (credits < 2) {
      toast.error("Insufficient credits! Video generation requires 2 credits.");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const base64Data = generatedImage.split(',')[1];

      const response = await fetch("http://localhost:32000/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Video generation failed");
      }

      const data = await response.json();
      setGeneratedVideo(data.video);

      if (updateCredits) {
        updateCredits(credits - 2);
      }

      toast.success("Video generated successfully!");
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error(error.message || "Failed to generate video");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleNewGeneration = () => {
    sessionStorage.clear();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-silver text-black flex items-center justify-center font-semibold">
              1
            </div>
            <span className="text-sm text-foreground">Upload</span>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-silver text-black flex items-center justify-center font-semibold">
              2
            </div>
            <span className="text-sm text-foreground">Category</span>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-silver text-black flex items-center justify-center font-semibold">
              3
            </div>
            <span className="text-sm text-foreground">Style</span>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-silver to-silver/80 text-black flex items-center justify-center font-semibold border-2 border-silver shadow-glow">
              4
            </div>
            <span className="text-sm text-foreground font-medium">Generate</span>
          </div>
        </div>

        {/* Generation Interface */}
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
            Generate Your Jewelry Image
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Review your settings and generate the perfect image
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Original Image */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Original Image</h3>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img
                  src={uploadedPreview}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Generated Image */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Image</h3>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                ) : isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-silver border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground mb-2">Generating...</p>
                    <Progress value={generationProgress} className="w-2/3" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Click generate to create your image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 space-y-4">
            {!generatedImage && !isGenerating && (
              <div className="flex flex-col items-center gap-6">

                {/* Quality Selection */}
                <div className="w-full max-w-md">
                  <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                    Output Quality
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {["HD", "2K", "4K", "8K"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${quality === q
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/${selectedCategory}`)}
                  >
                    Back to Style
                  </Button>
                  <Button
                    onClick={() => setShowAspectRatioModal(true)}
                    disabled={isGenerating}
                    className="bg-silver hover:bg-silver/90 text-black min-w-[200px]"
                  >
                    Select Size & Generate (1 Credit)
                  </Button>
                </div>
              </div>
            )}

            {generatedImage && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate (1 Credit)
                </Button>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="bg-silver hover:bg-silver/90 text-black"
                >
                  <Film className="w-4 h-4 mr-2" />
                  {isGeneratingVideo ? "Generating..." : "Create Video (2 Credits)"}
                </Button>
                <Button
                  onClick={handleNewGeneration}
                  className="bg-primary hover:bg-primary/90"
                >
                  New Generation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aspect Ratio Modal */}
      <AspectRatioModal
        isOpen={showAspectRatioModal}
        onClose={() => setShowAspectRatioModal(false)}
        onSelect={setSelectedAspectRatio}
        onConfirm={(ratioObj) => {
          setShowAspectRatioModal(false);
          handleGenerate(ratioObj);
        }}
        selectedRatio={selectedAspectRatio}
      />
    </div>
  );
};

export default GenerationPage;
