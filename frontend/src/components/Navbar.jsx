import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";

export const Navbar = ({ variant = "landing" }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, credits, isAuthenticated } = useAuth();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Presets", href: "#presets" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/logo.png" 
              alt="JewelAI Logo" 
              className="h-10 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {variant === "landing" && navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full credit-badge">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">{credits}</span>
                </div>
                <Link to="/app">
                  <Button variant="premium" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="premium" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-2">
              {variant === "landing" && navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="text-sm text-muted-foreground">{credits} credits</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
