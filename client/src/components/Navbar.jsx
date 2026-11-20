import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Compass,
  PlusCircle,
  History,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(7, 9, 14, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.15)",
        padding: "14px 0",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand / Logo */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          onClick={closeMenu}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8b5cf6, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Compass size={22} color="#07090e" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: "1.35rem",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, #ffffff, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mind<span style={{ color: "#38bdf8", WebkitTextFillColor: "#38bdf8" }}>Maze</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "8px",
          }}
          className="desktop-nav"
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`btn btn-sm ${isActive("/dashboard") ? "btn-secondary" : "btn-ghost"}`}
                style={{
                  color: isActive("/dashboard") ? "var(--accent-purple)" : "var(--text-muted)",
                  borderColor: isActive("/dashboard") ? "var(--accent-purple)" : "transparent",
                }}
              >
                <Compass size={16} /> Dashboard
              </Link>

              <Link
                to="/new-mystery"
                className={`btn btn-sm ${isActive("/new-mystery") ? "btn-primary" : "btn-secondary"}`}
              >
                <PlusCircle size={16} /> Open New Case
              </Link>

              <Link
                to="/history"
                className={`btn btn-sm ${isActive("/history") ? "btn-secondary" : "btn-ghost"}`}
                style={{
                  color: isActive("/history") ? "var(--accent-purple)" : "var(--text-muted)",
                  borderColor: isActive("/history") ? "var(--accent-purple)" : "transparent",
                }}
              >
                <History size={16} /> Case Archives
              </Link>

              <div
                style={{
                  width: "1px",
                  height: "22px",
                  backgroundColor: "var(--border-dark)",
                  margin: "0 8px",
                }}
              />

              <Link
                to="/profile"
                className={`btn btn-sm ${isActive("/profile") ? "btn-secondary" : "btn-ghost"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: isActive("/profile") ? "#38bdf8" : "var(--text-main)",
                }}
              >
                <User size={16} />
                <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "Detective"}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-sm btn-ghost"
                title="Sign Out"
                style={{ color: "#f43f5e" }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Join the Bureau <Sparkles size={14} />
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-sm mobile-trigger"
          style={{ padding: "8px" }}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "rgba(13, 17, 26, 0.98)",
            borderBottom: "1px solid var(--border-glow)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 20px 30px rgba(0,0,0,0.8)",
          }}
        >
          {isAuthenticated ? (
            <>
              <div
                style={{
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border-dark)",
                  color: "var(--accent-cyan)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Logged in as: {user?.name}
              </div>
              <Link to="/dashboard" onClick={closeMenu} className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                <Compass size={18} /> Dashboard
              </Link>
              <Link to="/new-mystery" onClick={closeMenu} className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                <PlusCircle size={18} /> Open New Case
              </Link>
              <Link to="/history" onClick={closeMenu} className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                <History size={18} /> Case Archives
              </Link>
              <Link to="/profile" onClick={closeMenu} className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                <User size={18} /> Detective Profile
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="btn btn-danger"
                style={{ justifyContent: "flex-start" }}
              >
                <LogOut size={18} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="btn btn-secondary" style={{ justifyContent: "center" }}>
                Sign In
              </Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary" style={{ justifyContent: "center" }}>
                Join the Bureau
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-trigger {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
