import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarLayout } from "@/components/SidebarLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import UploadPage from "@/pages/UploadPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryStylePage from "@/pages/CategoryStylePage";
import GenerationPage from "@/pages/GenerationPage";
import AdminPage from "@/pages/AdminPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SidebarLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/app" element={<UploadPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/:category" element={<CategoryStylePage />} />
              <Route path="/generation" element={<GenerationPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SidebarLayout>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
