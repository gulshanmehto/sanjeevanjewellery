import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JEWELLERY_TYPES } from "@/lib/constants";
import { getPresetsForCategory } from "@/lib/categoryPresets";
import { Navbar } from "@/components/Navbar";
import { getImageFromIndexedDB } from "@/utils/imageStorage";

const CategoryStylePage = () => {
  const navigate = useNavigate();
  const { category } = useParams();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const categoryData = JEWELLERY_TYPES.find(t => t.id === category);
  const presets = getPresetsForCategory(category);
  
  useEffect(() => {
    const checkImage = async () => {
      const uploadedImage = await getImageFromIndexedDB("uploaded_image");
      
      if (!uploadedImage) {
        navigate("/app");
        return;
      }
      
      // Ensure the category from URL is stored in sessionStorage
      if (category) {
        sessionStorage.setItem("selected_category", category);
      }
      setIsLoading(false);
    };
    checkImage();
  }, [category, navigate]);

  const handleContinue = () => {
    if (!selectedPreset) {
      return;
    }
    const preset = presets.find(p => p.id === selectedPreset);
    sessionStorage.setItem("selected_preset", selectedPreset);
    sessionStorage.setItem("preset_name", preset.name);
    sessionStorage.setItem("preset_description", preset.description);
    navigate("/generation");
  };

  if (isLoading || !categoryData) {
    return null;
  }

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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-silver to-silver/80 text-black flex items-center justify-center font-semibold border-2 border-silver shadow-glow">
              3
            </div>
            <span className="text-sm text-foreground font-medium">Style</span>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              4
            </div>
            <span className="text-sm text-muted-foreground">Generate</span>
          </div>
        </div>

        {/* Style Selection */}
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
            Choose Your {categoryData.label} Style
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Select a preset style optimized for {categoryData.label.toLowerCase()}
          </p>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedPreset === preset.id
                    ? "border-silver shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "border-border hover:border-silver/50"
                }`}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">{preset.name}</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold mb-1">{preset.name}</h3>
                  <p className="text-white/70 text-sm">{preset.description}</p>
                </div>
                {selectedPreset === preset.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-silver rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/categories")}
            >
              Back to Categories
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedPreset}
              className="bg-silver hover:bg-silver/90 text-black"
            >
              Continue to Generation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryStylePage;
