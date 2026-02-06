import { useState, useEffect, createContext, useContext } from "react";

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jewelai_user");
      if (stored) return JSON.parse(stored);
    }
    return null;
  });

  const [credits, setCredits] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jewelai_credits");
      if (stored) return parseInt(stored, 10);
    }
    return 10;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("jewelai_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("jewelai_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("jewelai_credits", credits.toString());
  }, [credits]);

  // Sync with backend on login
  useEffect(() => {
    const syncUser = async () => {
      if (user?.email) {
        try {
          const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://jewel-ai-backend-3a5d21834ffb.herokuapp.com";
          const API_URL = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

          const response = await fetch(`${API_URL}/api/user/${user.email}/credits`);
          if (response.ok) {
            const data = await response.json();
            setCredits(data.credits);
          }
        } catch (error) {
          console.error("Failed to sync user with backend", error);
        }
      }
    };
    syncUser();
  }, [user]);

  const login = (email, name) => {
    setUser({ email, name: name || email.split("@")[0] });
  };

  const logout = () => {
    setUser(null);
    setCredits(10);
  };

  const useCredits = async (amount = 1) => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);

      // Sync deduction with backend
      if (user?.email) {
        try {
          const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://jewel-ai-backend-3a5d21834ffb.herokuapp.com";
          const API_URL = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
          await fetch(`${API_URL}/api/user/${user.email}/use-credits?amount=${amount}`, {
            method: 'POST'
          });
        } catch (error) {
          console.error("Failed to sync credit deduction", error);
        }
      }
      return true;
    }
    return false;
  };

  const addCredits = (amount) => {
    setCredits(prev => prev + amount);
  };

  return (
    <AuthContext.Provider value={{
      user,
      credits,
      login,
      logout,
      useCredits,
      addCredits,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
