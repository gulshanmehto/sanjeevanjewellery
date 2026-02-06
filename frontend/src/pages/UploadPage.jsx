import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { saveImageToIndexedDB, removeImageFromIndexedDB } from "@/utils/imageStorage";

const UploadPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const processFile = useCallback((file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      setUploadedPreview(result);
      // Store in IndexedDB instead of sessionStorage to avoid quota issues
      await saveImageToIndexedDB("uploaded_image", result);
    };
    reader.readAsDataURL(file);
    toast.success("Image uploaded successfully!");
  }, []);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = async () => {
    setUploadedImage(null);
    setUploadedPreview(null);
    await removeImageFromIndexedDB("uploaded_image");
  };

  const handleContinue = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }
    navigate("/categories");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-silver to-silver/80 text-black flex items-center justify-center font-semibold border-2 border-silver shadow-glow">
              1
            </div>
            <span className="text-sm text-foreground font-medium">Upload</span>
          </div>
          
          <div className="h-0.5 w-12 bg-border" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              2
            </div>
            <span className="text-sm text-muted-foreground">Category</span>
          </div>
          
          <div className="h-0.5 w-12 bg-border" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              3
            </div>
            <span className="text-sm text-muted-foreground">Style</span>
          </div>
          
          <div className="h-0.5 w-12 bg-border" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              4
            </div>
            <span className="text-sm text-muted-foreground">Generate</span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
            Upload Your Jewelry
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Upload a clear image of your jewelry piece to get started
          </p>

          {!uploadedPreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                isDragging
                  ? "border-silver bg-silver/5"
                  : "border-border hover:border-silver/50"
              }`}
            >
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Drag and drop your image here
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  or click to browse from your device
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="default"
                    className="bg-silver hover:bg-silver/90 text-black"
                    asChild
                  >
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative bg-card border border-border rounded-xl p-6">
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 w-8 h-8 bg-destructive/10 hover:bg-destructive/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-destructive" />
                </button>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={uploadedPreview}
                    alt="Uploaded jewelry"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="bg-silver hover:bg-silver/90 text-black min-w-[200px]"
                >
                  Continue to Categories
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
