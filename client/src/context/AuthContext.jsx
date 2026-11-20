import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("mindmaze_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("mindmaze_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post("/auth/logout").catch(() => {});
      }
    } finally {
      localStorage.removeItem("mindmaze_token");
      localStorage.removeItem("mindmaze_user");
      setToken(null);
      setUser(null);
    }
  }, [token]);

  // Verify and hydrate current user on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("mindmaze_user", JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn("[AuthContext] Token validation failed:", err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for automatic logout events from axios interceptor
    const handleLogoutEvent = () => logout();
    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => window.removeEventListener("auth:logout", handleLogoutEvent);
  }, [token, logout]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("mindmaze_token", newToken);
    localStorage.setItem("mindmaze_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", { name, email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("mindmaze_token", newToken);
    localStorage.setItem("mindmaze_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return response.data;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("mindmaze_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

