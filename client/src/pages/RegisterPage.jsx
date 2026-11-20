import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide a detective name (at least 2 characters).");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Passcode must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passcodes do not match. Please re-enter.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. An account with this email may already exist."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 20px",
        minHeight: "75vh",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6), var(--shadow-glow-purple)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
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
            <ShieldCheck size={26} color="#07090e" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>
            Bureau Enlistment
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Create your investigator profile to start cracking cases.
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
            <label className="form-label" htmlFor="register-name">
              Detective Name / Codename
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="Inspector Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ paddingLeft: "38px" }}
              />
              <User
                size={16}
                color="var(--text-dim)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Badge Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="register-email"
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
            <label className="form-label" htmlFor="register-password">
              Security Passcode (min 6 chars)
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="register-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Passcode
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="register-confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
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
            {isSubmitting ? "Commissioning Badge..." : "Enlist as Detective"}
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
          Already holding a detective badge?{" "}
          <Link
            to="/login"
            style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
