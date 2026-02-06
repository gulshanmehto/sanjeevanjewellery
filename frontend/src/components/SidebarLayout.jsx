import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, History, Coins, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { removeImageFromIndexedDB, saveImageToIndexedDB } from "@/utils/imageStorage";

export const SidebarLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("create");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [history] = useState(() => {
    try {
      const stored = localStorage.getItem("jewelai_history");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse history from local storage", e);
      return [];
    }
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNewGeneration = async () => {
    // Clear workflow state
    await removeImageFromIndexedDB("uploaded_image");
    sessionStorage.removeItem("uploaded_image");
    sessionStorage.removeItem("selected_category");
    sessionStorage.removeItem("selected_preset");
    sessionStorage.removeItem("preset_name");
    sessionStorage.removeItem("preset_description");
    navigate("/app");
    setActiveTab("create");
    setIsMobileMenuOpen(false);
  };

  const handleHistorySelect = async (item) => {
    // Load history item back into the workflow
    // Note: originalImage is no longer stored in DB due to size limits
    // User will need to re-upload the image to regenerate
    sessionStorage.setItem("selected_category", item.jewellery_type);
    sessionStorage.setItem("selected_preset", item.preset_name || "");
    // Navigate to category page (user will need to re-upload if they want to regenerate)
    navigate(`/${item.jewellery_type}`);
    setIsMobileMenuOpen(false);
  };

  // Don't show sidebar on certain routes
  const hideSidebarRoutes = ["/", "/login"];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname) && isAuthenticated;

  if (!shouldShowSidebar) {
    return children;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 hover:bg-card rounded-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-card border-r border-border transition-transform duration-300 z-50 flex flex-col pt-20 lg:pt-4`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          {/* User Info */}
          {user && (
            <div className="mb-8 pb-6 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Welcome</p>
              <p className="font-semibold text-foreground truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground mt-2">Credits: {user.credits || 0}</p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="space-y-2 mb-8">
            <button
              onClick={handleNewGeneration}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-silver text-black"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Create New</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-silver text-black"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <History className="w-4 h-4" />
              <span>History ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("credits")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "credits"
                  ? "bg-silver text-black"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Buy Credits</span>
            </button>
          </div>

          {/* History Panel */}
          {activeTab === "history" && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Generation History</h3>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No generations yet. Start creating!
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.slice().reverse().map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistorySelect(item)}
                      className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors text-xs"
                    >
                      <p className="font-medium text-foreground truncate">
                        {item.jewelleryType && item.jewelleryType.charAt(0).toUpperCase() + item.jewelleryType.slice(1)}
                      </p>
                      <p className="text-muted-foreground truncate">{item.selectedPreset}</p>
                      <p className="text-muted-foreground text-2xs">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Credits Panel */}
          {activeTab === "credits" && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Buy Credits</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-lg font-semibold text-silver">{user?.credits || 0}</p>
                </div>
                <Button variant="outline" className="w-full text-xs" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {isAuthenticated && (
          <div className="p-6 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        {children}
      </main>
    </div>
  );
};
