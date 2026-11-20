import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  Search,
  Sparkles,
  Key,
  Users,
} from "lucide-react";

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "70px 0 50px 0",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="container" style={{ maxWidth: "880px" }}>
          {/* Tag Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "9999px",
              backgroundColor: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              color: "var(--accent-purple)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            <Sparkles size={14} /> AI-Powered Detective Investigation Engine
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: "1.1",
              letterSpacing: "-0.03em",
              marginBottom: "20px",
            }}
          >
            Unravel The Unsolved. <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Challenge The Mind.
            </span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--text-muted)",
              lineHeight: "1.6",
              maxWidth: "680px",
              margin: "0 auto 36px auto",
            }}
          >
            Every case is dynamically generated with three suspects, three forensic clues,
            and an encrypted truth. Analyze evidence, challenge fabricated alibis, and crack the mystery.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="btn btn-primary btn-lg"
              style={{ minWidth: "190px" }}
            >
              {isAuthenticated ? "Enter Bureau Dashboard" : "Begin Investigation"}{" "}
              <ArrowRight size={18} />
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn btn-secondary btn-lg"
                style={{ minWidth: "150px" }}
              >
                Detective Login
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <div
            style={{
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>
              Investigative Protocol
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto" }}>
              MindMaze combines narrative mystery design with strict logical deduction.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Feature 1 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(139, 92, 246, 0.15)",
                  color: "var(--accent-purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                AI Case Architect
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Procedural storytelling powered by Gemini. Unique settings from cyberpunk penthouses to gaslit Victorian manors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                Triad of Suspects
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Exactly three suspects per dossier. One true culprit and two innocent persons harboring suspicious secrets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Search size={22} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                Forensic Clues
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Three distinct evidence tokens: physical residues, surveillance loops, and documentary inconsistencies.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Key size={22} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                Tiered Hint System
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Need assistance? Unlock up to three progressive hints that point out synergies without spoiling the solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Case CTA: keep the landing page free of a reusable sample dossier. */}
      <section style={{ padding: "40px 0" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div
            className="card"
            style={{
              padding: "32px",
              borderColor: "var(--border-glow)",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45), var(--shadow-glow-purple)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 16px",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                color: "var(--accent-purple)",
                backgroundColor: "rgba(139, 92, 246, 0.15)",
              }}
            >
              <Sparkles size={22} />
            </div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "10px" }}>
              Your Next Case Is Generated On Demand
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "620px", margin: "0 auto 22px" }}>
              Every new dossier is created by Gemini for your selected setting and difficulty. No preview case is reused when you open a new investigation.
            </p>
            <Link
              to={isAuthenticated ? "/new-mystery" : "/register"}
              className="btn btn-primary"
            >
              {isAuthenticated ? "Generate a New Case" : "Create Your Detective Account"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
