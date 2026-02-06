import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Gem, Mail, User, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/config/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("signup"); // 'signup' or 'signin'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    if (mode === "signup" && !name) {
      toast.error("Please enter your name to sign up");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch(API_ENDPOINTS.SIGNUP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password, credits: 10 })
        });

        if (res.ok) {
          const data = await res.json();
          login(email, data?.name || name);
          toast.success("Account created! 10 credits added.");
          navigate("/app");
        } else {
          const errorData = await res.json();
          toast.error(errorData.detail || "Signup failed");
        }
      } else {
        // Sign In
        const response = await fetch(API_ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (response.ok) {
          const data = await response.json();
          login(email, data.name || email.split('@')[0]);
          toast.success("Welcome back!");
          navigate("/app");
        } else if (response.status === 404) {
          toast.error("Account not found. Please sign up first.");
          setMode("signup");
        } else if (response.status === 401) {
          toast.error("Invalid email or password.");
        } else {
          toast.error("Sign in failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Auth failed", error);
      toast.error("Connection error. Using offline mode.");
      login(email, name || email.split('@')[0]);
      navigate("/app");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <Card className="w-full max-w-md elegant-card animate-scale-in">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
                <Gem className="w-7 h-7 text-primary-foreground" />
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "Join JewelAI to transform your jewellery photography"
                : "Enter your email and password to continue"}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-secondary/50 rounded-xl mb-8">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Store / Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Rajesh Jewellers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "signup"}
                    className="input-elegant pl-11"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@jewellerystore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-elegant pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-elegant"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="premium"
              size="xl"
              className="w-full mt-6 h-14 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === "signup" ? "Create My Studio" : "Sign In to Studio"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
              &copy; 2024 JewelAI by <a href="https://www.linkedin.com/in/sanjeevansahu/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Sanjeevan</a>. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
