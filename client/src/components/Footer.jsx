import React from "react";
import { Compass, ShieldCheck } from "lucide-react";

export const Footer = () => {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
        backgroundColor: "rgba(7, 9, 14, 0.9)",
        padding: "36px 0 24px 0",
        color: "var(--text-dim)",
        fontSize: "0.875rem",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
          <Compass size={18} color="#8b5cf6" />
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>MindMaze</span>
          <span>•</span>
          <span>AI-Powered Mystery Game</span>
        </div>

        <p style={{ maxWidth: "600px" }}>
          Read each case, compare the clues, and find out who did it. Gemini helps create the mysteries.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Your cases are private to your account.</span>
        </div>
      </div>
    </footer>
  );
};
