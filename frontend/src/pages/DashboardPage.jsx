import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Gem, Upload, Camera, User, Sparkles, Video, History, Coins,
  LogOut, ChevronRight, X, Download, Check,
  ArrowLeft, RefreshCw, Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { JEWELLERY_TYPES, PRODUCT_PRESETS, MODEL_PRESETS, CREDIT_PLANS } from "@/lib/constants";
import { AspectRatioModal } from "@/components/AspectRatioModal";
import { JewelryIcon } from "@/components/JewelryIcons";
import { ASPECT_RATIOS } from "@/lib/aspectRatios";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/config/api";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, credits, logout, isAuthenticated } = useAuth();
  const authContext = useAuth();

  // Main state
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selection state
  const [jewelleryType, setJewelleryType] = useState("ring");
  const [shootType, setShootType] = useState("product");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [quality, setQuality] = useState("HD");

  // Aspect ratio modal state
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Video state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("jewelai_history");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse history from local storage", e);
      return [];
    }
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("jewelai_history", JSON.stringify(history));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.warn("Local storage quota exceeded. Saving history without images.");
        try {
          // Create a lightweight version of history without large image strings
          const liteHistory = history.map(({ generatedImage, originalImage, ...rest }) => rest);
          localStorage.setItem("jewelai_history", JSON.stringify(liteHistory));
        } catch (retryError) {
          console.error("Failed to save even lite history", retryError);
        }
      } else {
        console.error("Failed to save history to local storage", e);
      }
    }
  }, [history]);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Process file function
  const processFile = useCallback((file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
    toast.success("Image uploaded successfully!");
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("jewelai_history");
      navigate("/login");
    } else if (user?.email) {
      // Fetch history from backend
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const response = await fetch(API_ENDPOINTS.getHistory(user.email));
          if (response.ok) {
            const data = await response.json();
            // Map backend structure to frontend structure
            const mappedHistory = data.map(item => ({
              id: item.id,
              generatedImage: item.generated_image,
              originalImage: item.original_image,
              jewelleryType: item.jewellery_type,
              shootType: item.shoot_type,
              preset: { label: item.preset_name },
              timestamp: item.created_at
            }));
            setHistory(mappedHistory);
          }
        } catch (error) {
          console.error("Failed to fetch history:", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isAuthenticated, navigate, user?.email]);

  // Return early if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const presets = shootType === "product" ? PRODUCT_PRESETS : MODEL_PRESETS;

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Generate image
  const handleGenerate = async (ratioOverride = null) => {
    // Determine effective ratio (handle event object if passed by onClick)
    const effectiveRatio = (ratioOverride && ratioOverride.id) ? ratioOverride : selectedAspectRatio;

    if (credits < 1) {
      toast.error("Not enough credits. Please buy more credits.");
      setActiveTab("credits");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Progress animation
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 800);

    let finalImage = null;

    try {
      // Call the backend API for AI generation
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('jewellery_type', jewelleryType);
      formData.append('shoot_type', shootType);
      formData.append('preset_name', selectedPreset?.label || 'Default');
      formData.append('preset_description', selectedPreset?.description || 'Professional studio lighting');
      formData.append('quality', quality);
      formData.append('email', user?.email || 'anonymous');

      // Add aspect ratio data
      if (effectiveRatio) {
        formData.append('aspect_ratio', effectiveRatio.id);
        formData.append('aspect_ratio_label', effectiveRatio.label);
        formData.append('aspect_ratio_dimensions', effectiveRatio.dimensions);
      }

      console.log("Calling API at:", API_ENDPOINTS.GENERATE_IMAGE);

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
          toast.success("AI photoshoot generated successfully!");
        } else {
          // Fallback to preset image if AI fails
          finalImage = selectedPreset?.image || PRODUCT_PRESETS[0].image;
          setGeneratedImage(finalImage);
          toast.info("Using preset image (AI generation unavailable)");
        }
      } else {
        // Fallback to mock if API fails
        setGenerationProgress(100);
        finalImage = selectedPreset?.image || PRODUCT_PRESETS[0].image;
        setGeneratedImage(finalImage);
        toast.info("Using preset image (MOCKED - Backend not available)");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      // Fallback to preset image on error
      finalImage = selectedPreset?.image || PRODUCT_PRESETS[0].image;
      setGeneratedImage(finalImage);
      toast.info("Using preset image (MOCKED - Check console for details)");
      console.error("Generation error:", error instanceof Error ? error.message : String(error));
    }

    // Deduct credit
    await authContext.useCredits(1);

    // Add to history if we have an image
    if (finalImage) {
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        jewelleryType,
        shootType,
        preset: selectedPreset,
        aspectRatio: selectedAspectRatio,
        originalImage: uploadedPreview,
        generatedImage: finalImage,
      };
      setHistory((prev) => [historyItem, ...(Array.isArray(prev) ? prev : [])]);
    }

    setIsGenerating(false);
    setStep(5);
    toast.success("Image generated successfully!");
  };

  // Generate video from image
  const handleGenerateVideo = async () => {
    if (credits < 2) {
      toast.error("Video generation requires 2 credits. Please buy more.");
      setActiveTab("credits");
      return;
    }

    setIsGeneratingVideo(true);

    // Simulate video generation
    await new Promise((resolve) => setTimeout(resolve, 4000));

    await authContext.useCredits(2);
    setGeneratedVideo("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4");
    setIsGeneratingVideo(false);
    toast.success("Video generated! (MOCKED - Demo video shown)");
  };

  // Reset form
  const handleReset = () => {
    setStep(1);
    setUploadedImage(null);
    setUploadedPreview(null);
    setJewelleryType("ring");
    setShootType("product");
    setSelectedPreset(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setGenerationProgress(0);
    setSelectedAspectRatio(null);
    setShowAspectRatioModal(false);
  };

  // Download generated image
  const handleDownload = () => {
    if (!generatedImage) return;

    try {
      // Create a specific filename
      const timestamp = Date.now();
      const fileName = `jewelai-shoot-${timestamp}.png`;

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

            // Cleanup
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

  // Buy credits (mocked)
  const handleBuyCredits = (amount) => {
    authContext.addCredits(amount);
    toast.success(`${amount} credits added to your account! (MOCKED)`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Gem className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-lg font-semibold text-foreground">JewelAI</span>
                <span className="block text-xs text-muted-foreground -mt-0.5">
                  by <a href="https://www.linkedin.com/in/sanjeevansahu/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Sanjeevan</a>
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => { setActiveTab("create"); handleReset(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "create"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <Sparkles className="w-5 h-5" />
              Create Shoot
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <History className="w-5 h-5" />
              History
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {history.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("credits")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "credits"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <Coins className="w-5 h-5" />
              Buy Credits
            </button>
          </nav>

          {/* Credits Badge */}
          <div className="p-4 border-t border-border">
            <div className="p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Available Credits</span>
                <Coins className="w-4 h-4 text-gold" />
              </div>
              <p className="text-2xl font-semibold text-foreground flex items-center gap-1.5">
                {credits}
              </p>
            </div>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex-1"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Gem className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold text-foreground">JewelAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-foreground">{credits}</span>
            </div>
          </div>
        </div>
        {/* Mobile Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => { setActiveTab("create"); handleReset(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === "create"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
              }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === "history"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
              }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("credits")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === "credits"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
              }`}
          >
            Credits
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">

          {/* Create Tab */}
          {activeTab === "create" && (
            <div className="animate-fade-in">
              {/* Step Progress */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                        }`}
                    >
                      {step > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    {s < 4 && (
                      <div
                        className={`w-12 lg:w-24 h-1 mx-2 rounded-full transition-colors ${step > s ? "bg-primary" : "bg-secondary"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Upload Image */}
              {step === 1 && (
                <Card className="elegant-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Upload Your Jewellery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`upload-zone flex flex-col items-center justify-center text-center ${isDragging ? "dragging" : ""
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {uploadedPreview ? (
                          <div className="relative">
                            <img
                              src={uploadedPreview}
                              alt="Uploaded jewellery"
                              className="max-h-64 rounded-xl"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setUploadedImage(null);
                                setUploadedPreview(null);
                              }}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-foreground font-medium mb-1">
                              Drop your jewellery image here
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or click to browse
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!uploadedImage}
                      variant="premium"
                      size="lg"
                      className="w-full mt-6"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Select Jewellery Type */}
              {step === 2 && (
                <Card className="elegant-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <Gem className="w-5 h-5 text-primary" />
                        What type of jewellery is this?
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {JEWELLERY_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setJewelleryType(type.id)}
                          className={`jewellery-chip p-4 rounded-xl border-2 text-center transition-all ${jewelleryType === type.id
                            ? "border-primary bg-primary/5 selected"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="mb-2 flex justify-center">
                            <JewelryIcon type={type.icon} className="w-12 h-12" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => setStep(3)}
                      variant="premium"
                      size="lg"
                      className="w-full mt-6"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Select Shoot Type */}
              {step === 3 && (
                <Card className="elegant-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        Choose your shoot type
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => setShootType("product")}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${shootType === "product"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Camera className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                          Product Shoot
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Clean studio photography without models. Perfect for catalogs.
                        </p>
                      </button>
                      <button
                        onClick={() => setShootType("model")}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${shootType === "model"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                          Model Shoot
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Jewellery worn by realistic Indian models. Great for social media.
                        </p>
                      </button>
                    </div>

                    {/* Preset Selection */}
                    <h4 className="font-display text-base font-semibold text-foreground mb-4">
                      Select a style preset
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedPreset(preset)}
                          className={`preset-card aspect-square ${selectedPreset?.id === preset.id ? "selected" : ""
                            }`}
                        >
                          <img
                            src={preset.image}
                            alt={preset.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 preset-overlay" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-xs font-medium text-primary-foreground">
                              {preset.label}
                            </p>
                          </div>
                          {selectedPreset?.id === preset.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setStep(4)}
                      disabled={!selectedPreset}
                      variant="premium"
                      size="lg"
                      className="w-full mt-6"
                    >
                      Continue to Review
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Aspect Ratio Modal */}
              <AspectRatioModal
                isOpen={showAspectRatioModal}
                onClose={() => setShowAspectRatioModal(false)}
                onSelect={setSelectedAspectRatio}
                onConfirm={(ratio) => {
                  setShowAspectRatioModal(false);
                  handleGenerate(ratio);
                }}
                selectedRatio={selectedAspectRatio}
              />

              {/* Step 4: Review & Generate */}
              {step === 4 && (
                <Card className="elegant-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Review Your Shoot
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      {/* Original Image */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Your Jewellery
                        </p>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
                          <img
                            src={uploadedPreview}
                            alt="Original"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      {/* Selected Preset */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Style Preset
                        </p>
                        <div className="aspect-square rounded-2xl overflow-hidden">
                          <img
                            src={selectedPreset?.image}
                            alt={selectedPreset?.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-secondary/50 rounded-xl mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Jewellery Type</span>
                        <span className="font-medium text-foreground capitalize">
                          {jewelleryType}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shoot Type</span>
                        <span className="font-medium text-foreground capitalize">
                          {shootType} Shoot
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Style</span>
                        <span className="font-medium text-foreground">
                          {selectedPreset?.label}
                        </span>
                      </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
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

                    <div className="bg-secondary/40 border border-border rounded-2xl overflow-hidden mb-6">
                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Credit Cost</span>
                          <span className="text-xl font-display font-semibold text-primary">1 Credit</span>
                        </div>
                        <div className="h-px bg-border/50 w-full" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Credits After</span>
                          <span className={`font-semibold ${credits >= 1 ? "text-success" : "text-destructive"}`}>
                            {credits - 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isGenerating ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center generation-pulse">
                              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            <p className="text-foreground font-medium">
                              Creating your photoshoot...
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              This usually takes 10-15 seconds
                            </p>
                          </div>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowAspectRatioModal(true)}
                        disabled={credits < 1}
                        variant="premium"
                        size="xl"
                        className="w-full shadow-gold animate-pulse-glow"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Select Size & Generate (1 Credit)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Results */}
              {step === 5 && generatedImage && (
                <div className="space-y-6">
                  <Card className="elegant-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-display text-xl flex items-center gap-2">
                          <Check className="w-5 h-5 text-success" />
                          Your Photoshoot is Ready!
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                          <RefreshCw className="w-4 h-4 mr-1" /> Create New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-6 mb-6">
                        {/* Original */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Original
                          </p>
                          <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
                            <img
                              src={uploadedPreview}
                              alt="Original"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        {/* Generated */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            AI Generated ({selectedPreset?.label})
                          </p>
                          <div className="aspect-square rounded-2xl overflow-hidden">
                            <img
                              src={generatedImage}
                              alt="Generated"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="premium"
                          className="flex-1"
                          onClick={handleDownload}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Image
                        </Button>
                        <Button
                          variant="gold"
                          className="flex-1"
                          onClick={handleGenerateVideo}
                          disabled={isGeneratingVideo || credits < 2}
                        >
                          {isGeneratingVideo ? (
                            <>
                              <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Convert to Video (2 Credits)
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Video Result */}
                  {generatedVideo && (
                    <Card className="elegant-card animate-scale-in">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <Film className="w-5 h-5 text-primary" />
                          Video Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
                          <video
                            src={generatedVideo}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          Note: This is a demo video. Real video generation would use your generated image.
                        </p>
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Video
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
                Generation History
              </h2>
              {isLoadingHistory && history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
                  <p className="text-muted-foreground">Loading your generations...</p>
                </div>
              ) : history.length === 0 ? (
                <Card className="elegant-card">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">No generations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your generated images will appear here
                    </p>
                    <Button
                      variant="premium"
                      className="mt-6"
                      onClick={() => setActiveTab("create")}
                    >
                      Create Your First Shoot
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <Card
                      key={item.id}
                      className="elegant-card overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedHistoryItem(item)}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={item.generatedImage}
                          alt={item.preset?.label}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="font-medium text-foreground text-sm mb-1 truncate">
                          {item.preset?.label}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.jewelleryType} · {item.shootType}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown Date'}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-3 h-8 text-xs font-medium"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === "credits" && (
            <div className="animate-fade-in">
              <div className="mb-10">
                <h2 className="font-display text-4xl font-semibold text-foreground mb-2">
                  Credits
                </h2>
                <p className="text-muted-foreground">
                  Manage your credits and view transaction history
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 items-stretch">
                {CREDIT_PLANS.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col transition-all duration-300 ${plan.recommended
                      ? "ring-2 ring-[#99FF00] bg-black border-none"
                      : "bg-[#0A0A0A] border-zinc-800"
                      }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 right-6 px-4 py-1.5 bg-[#99FF00] rounded-full text-[10px] font-bold text-black uppercase tracking-wider shadow-lg">
                        Recommended
                      </div>
                    )}

                    <CardContent className="p-8 flex-1 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                        <p className="text-zinc-400 text-sm">{plan.id === 'trial' ? 'Try out JewelAI capabilities' : plan.label}</p>
                      </div>

                      <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-white">₹{plan.price.toLocaleString()}</span>
                        </div>
                        {plan.id !== 'trial' && (
                          <div className={`mt-3 inline-block px-3 py-1 rounded-md text-[11px] font-semibold ${plan.recommended ? "bg-[#99FF00]/10 text-[#99FF00]" : "bg-zinc-800 text-zinc-300"
                            }`}>
                            {plan.label}
                          </div>
                        )}
                        {plan.id === 'trial' && (
                          <div className="mt-3 inline-block px-3 py-1 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-300">
                            Standard Credits
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-10 flex-1">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className={`w-4 h-4 mt-0.5 ${plan.recommended ? "text-[#99FF00]" : "text-zinc-500"}`} />
                            <span className="text-sm text-zinc-300">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant={plan.recommended ? "default" : "secondary"}
                        className={`w-full h-12 font-bold transition-all ${plan.recommended
                          ? "bg-[#99FF00] hover:bg-[#88EE00] text-black"
                          : "bg-[#1A1A1A] hover:bg-[#252525] text-white border border-zinc-700"
                          }`}
                        onClick={() => handleBuyCredits(plan.credits)}
                      >
                        Buy Credits
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-12 p-6 bg-secondary/30 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-3xl font-display font-semibold text-foreground flex items-center gap-2">
                      <Coins className="w-6 h-6 text-gold" />
                      {credits} <span className="text-lg text-muted-foreground font-sans">credits</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* History Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-6xl my-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 md:-right-12 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedHistoryItem(null)}
            >
              <X className="w-8 h-8" />
            </Button>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Original Image */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-display">Original Image</h3>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
                  {selectedHistoryItem.originalImage ? (
                    <img
                      src={selectedHistoryItem.originalImage}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p>Original image not available for this generation</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                    Original
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preset</span>
                    <p className="font-medium text-foreground text-lg">{selectedHistoryItem.preset?.label || 'Custom'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</span>
                      <p className="font-medium text-foreground capitalize">{selectedHistoryItem.jewelleryType}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mode</span>
                      <p className="font-medium text-foreground capitalize">{selectedHistoryItem.shootType}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</span>
                    <p className="font-medium text-foreground">{new Date(selectedHistoryItem.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Generated Image */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-display">Generated Result</h3>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary border border-border shadow-2xl">
                  <img
                    src={selectedHistoryItem.generatedImage}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-success/90 backdrop-blur-md rounded-full text-xs font-medium text-white shadow-lg">
                    Completed
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="premium"
                    size="lg"
                    className="w-full h-12 text-base shadow-lg"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = selectedHistoryItem.generatedImage;
                      link.download = `jewelai-${selectedHistoryItem.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-5 h-5 mr-2" /> Download Image
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 border-primary/20 hover:bg-primary/5 hover:text-primary">
                      <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedHistoryItem.id);
                        toast.success("ID copied to clipboard");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy ID
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
