import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: "16px",
      }}>
        <div style={{
          width: "42px",
          height: "42px",
          border: "3px solid rgba(139, 92, 246, 0.2)",
          borderTopColor: "var(--accent-purple)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Decrypting detective credentials...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

