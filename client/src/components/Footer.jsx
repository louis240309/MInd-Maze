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
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>MindMaze Detective Bureau</span>
          <span>•</span>
          <span>AI-Powered Mystery Investigation Engine</span>
        </div>

        <p style={{ maxWidth: "600px" }}>
          Engineered for investigative minds. Dynamic suspect profiling, cryptographic forensic clues, and deductive evaluations powered by Gemini.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Restricted Access: Confidential Detective Dossiers Encrypted</span>
        </div>
      </div>
    </footer>
  );
};

