import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JEWELLERY_TYPES } from "@/lib/constants";
import { JewelryIcon } from "@/components/JewelryIcons";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getImageFromIndexedDB } from "@/utils/imageStorage";

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUploadedImage = async () => {
      const image = await getImageFromIndexedDB("uploaded_image");
      setUploadedImage(image);
      setIsLoading(false);
      
      if (!image) {
        navigate("/app");
      }
    };
    checkUploadedImage();
  }, [navigate]);

  const handleCategorySelect = (categoryId) => {
    sessionStorage.setItem("selected_category", categoryId);
    navigate(`/${categoryId}`);
  };

  if (isLoading || !uploadedImage) {
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-silver to-silver/80 text-black flex items-center justify-center font-semibold border-2 border-silver shadow-glow">
              2
            </div>
            <span className="text-sm text-foreground font-medium">Category</span>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              3
            </div>
            <span className="text-sm text-muted-foreground">Style</span>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-border text-muted-foreground flex items-center justify-center font-semibold">
              4
            </div>
            <span className="text-sm text-muted-foreground">Generate</span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
            Select Jewelry Category
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Choose the type of jewelry you want to generate
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {JEWELLERY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleCategorySelect(type.id)}
                className="group relative bg-card hover:bg-card/80 border border-border hover:border-silver/50 rounded-xl p-6 transition-all duration-300 text-center"
              >
                <div className="mb-4 flex justify-center">
                  <JewelryIcon type={type.icon} className="w-16 h-16" />
                </div>
                <h3 className="text-lg font-medium text-foreground group-hover:text-silver transition-colors">
                  {type.label}
                </h3>
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/app")}
            >
              Back to Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
