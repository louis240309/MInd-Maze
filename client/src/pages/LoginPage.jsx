import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Compass, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Authentication failed. Please verify your email and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo shortcut helper for testing
  const handleQuickDemo = () => {
    setEmail("detective@mindmaze.test");
    setPassword("detective123");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        minHeight: "75vh",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6), var(--shadow-glow-purple)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Compass size={26} color="#07090e" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>
            Detective Access
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Log in to view your cases.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fda4af",
              padding: "12px 14px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              marginBottom: "20px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Badge Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="inspector@mindmaze.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{ paddingLeft: "38px" }}
              />
              <Mail
                size={16}
                color="var(--text-dim)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Security Passcode
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingLeft: "38px" }}
              />
              <Lock
                size={16}
                color="var(--text-dim)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "12px" }}
          >
            {isSubmitting ? "Verifying Credentials..." : "Access Case Files"}
          </button>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", marginTop: "10px", fontSize: "0.8rem", color: "var(--accent-cyan)" }}
          >
            <Sparkles size={13} /> Fill Demo Detective Credentials
          </button>
        </form>

        {/* Footer Links */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-dark)",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          New to the Bureau?{" "}
          <Link
            to="/register"
            style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
          >
            Register as Detective
          </Link>
        </div>
      </div>
    </div>
  );
};
