import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Sparkles,
  Shield,
  Flame,
  ArrowRight,
  AlertCircle,
  Cpu,
  Feather,
  Gem,
  Rocket,
  Mountain,
} from "lucide-react";

export const NewMysteryPage = () => {
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState("medium");
  const [selectedTheme, setSelectedTheme] = useState("Victorian Noir");
  const [customTheme, setCustomTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const THEMES = [
    {
      id: "Victorian Noir",
      title: "Old London",
      desc: "Dark streets, old houses, and a locked-room mystery.",
      icon: Feather,
    },
    {
      id: "Art Heist",
      title: "Museum Theft",
      desc: "A missing work of art, a dark museum, and rich guests.",
      icon: Gem,
    },
    {
      id: "Cyberpunk Syndicate",
      title: "Future City",
      desc: "Bright signs, clever machines, and missing computer files.",
      icon: Cpu,
    },
    {
      id: "Deep Space Outpost",
      title: "Space Station",
      desc: "A small crew, a broken door, and a problem in space.",
      icon: Rocket,
    },
    {
      id: "Mountain Lodge",
      title: "Snowy Mountain Inn",
      desc: "Guests are snowed in, and someone has taken a cup of tea.",
      icon: Mountain,
    },
  ];

  const LOADING_MESSAGES = [
    "Starting the mystery maker...",
    "Writing the story...",
    "Creating three suspects and their stories...",
    "Adding three clues...",
    "Preparing hints and the answer...",
    "Getting your mystery ready...",
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (isGenerating) return;
    setError("");
    setIsGenerating(true);
    setLoadingStep(0);

    // Step cycle interval for immersive atmosphere
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 1800);

    const effectiveTheme = customTheme.trim() ? customTheme.trim() : selectedTheme;

    try {
      const response = await api.post("/games", {
        difficulty,
        theme: effectiveTheme,
      });

      clearInterval(interval);

      if (response.data.success && response.data.game?.id && response.data.game?.generation_id) {
        navigate(`/games/${response.data.game.id}`);
      } else {
        throw new Error("Invalid response received from case generator.");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("[NewMystery] Generation failed:", err);
      const message = err.response?.data?.message || (
        err.code === "ECONNABORTED"
          ? "Gemini is taking longer than expected. Check your case history before retrying; the request may still finish."
          : !err.response
            ? "Could not reach the case server. Check your connection and retry."
            : "The case could not be generated. Please retry in a moment."
      );
      setError(message);
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "50px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "840px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              backgroundColor: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              color: "var(--accent-purple)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            <Sparkles size={14} /> New Mystery
          </div>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "10px" }}>
            Create a Mystery
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Choose how hard it is and where it happens. Your mystery will have
            three suspects, three clues, and one answer.
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
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "28px",
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "70px 30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), var(--shadow-glow-purple)",
              borderColor: "var(--accent-purple)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "4px solid rgba(139, 92, 246, 0.2)",
                borderTopColor: "var(--accent-purple)",
                borderRightColor: "var(--accent-cyan)",
                animation: "spin 1.2s linear infinite",
              }}
            />

            <div>
              <h3 style={{ fontSize: "1.4rem", color: "#fff", marginBottom: "8px" }}>
                Making Your Mystery
              </h3>
              <p
                style={{
                  color: "var(--accent-cyan)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  minHeight: "24px",
                  transition: "all 0.3s ease",
                }}
              >
                {LOADING_MESSAGES[loadingStep]}
              </p>
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                height: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((loadingStep + 1) / LOADING_MESSAGES.length) * 100}%`,
                  backgroundColor: "var(--accent-purple)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          /* Configuration Form */
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* 1. Difficulty Level Selector */}
            <div className="card" style={{ padding: "28px" }}>
              <label className="form-label" style={{ fontSize: "1rem", color: "#fff", marginBottom: "16px", display: "block" }}>
                1. Choose How Hard:
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* Easy */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={difficulty === "easy"}
                  onClick={() => setDifficulty("easy")}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDifficulty("easy"); } }}
                  style={{
                    backgroundColor: difficulty === "easy" ? "rgba(16, 185, 129, 0.15)" : "rgba(19, 24, 38, 0.6)",
                    border: `2px solid ${difficulty === "easy" ? "#10b981" : "var(--border-dark)"}`,
                    borderRadius: "12px",
                    padding: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: 700, marginBottom: "6px" }}>
                    <Sparkles size={18} /> Easy
                  </div>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Clear clues and simple story checks. 100 points; each hint costs 25.
                  </p>
                </div>

                {/* Medium */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={difficulty === "medium"}
                  onClick={() => setDifficulty("medium")}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDifficulty("medium"); } }}
                  style={{
                    backgroundColor: difficulty === "medium" ? "rgba(56, 189, 248, 0.15)" : "rgba(19, 24, 38, 0.6)",
                    border: `2px solid ${difficulty === "medium" ? "var(--accent-cyan)" : "var(--border-dark)"}`,
                    borderRadius: "12px",
                    padding: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", fontWeight: 700, marginBottom: "6px" }}>
                    <Shield size={18} /> Medium
                  </div>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Harder clues and stories that do not quite fit. 200 points; each hint costs 25.
                  </p>
                </div>

                {/* Hard */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={difficulty === "hard"}
                  onClick={() => setDifficulty("hard")}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDifficulty("hard"); } }}
                  style={{
                    backgroundColor: difficulty === "hard" ? "rgba(168, 85, 247, 0.15)" : "rgba(19, 24, 38, 0.6)",
                    border: `2px solid ${difficulty === "hard" ? "var(--accent-purple)" : "var(--border-dark)"}`,
                    borderRadius: "12px",
                    padding: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c084fc", fontWeight: 700, marginBottom: "6px" }}>
                    <Flame size={18} /> Hard
                  </div>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Clues that fit together in less obvious ways. 300 points; each hint costs 25.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Theme / Setting Selector */}
            <div className="card" style={{ padding: "28px" }}>
              <label className="form-label" style={{ fontSize: "1rem", color: "#fff", marginBottom: "16px", display: "block" }}>
                2. Choose a Place:
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {THEMES.map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = selectedTheme === theme.id && !customTheme.trim();
                  return (
                    <div
                      key={theme.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedTheme(theme.id);
                        setCustomTheme("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTheme(theme.id);
                          setCustomTheme("");
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? "rgba(139, 92, 246, 0.15)" : "rgba(19, 24, 38, 0.6)",
                        border: `2px solid ${isSelected ? "var(--accent-purple)" : "var(--border-dark)"}`,
                        borderRadius: "12px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isSelected ? "var(--accent-purple)" : "var(--accent-cyan)", fontWeight: 600, marginBottom: "6px" }}>
                        <Icon size={18} /> {theme.title}
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                        {theme.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Custom Theme Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="custom-theme-input">
                  Or choose your own place:
                </label>
                <input
                  id="custom-theme-input"
                  type="text"
                  className="form-input"
                  placeholder="For example: a train, an old library, or a submarine"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                />
              </div>
            </div>

            {/* Launch Action */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ gap: "10px", minWidth: "220px" }}
              >
                Make My Mystery <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
