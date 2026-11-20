import React from "react";
import { FileText, Fingerprint, MessageSquareQuote, Box } from "lucide-react";

export const ClueCard = ({ clue, index }) => {
  const getTypeMeta = (type) => {
    const t = (type || "physical").toLowerCase();
    switch (t) {
      case "forensic":
        return {
          icon: Fingerprint,
          label: "Test Results",
          color: "#c084fc",
          bg: "rgba(168, 85, 247, 0.12)",
        };
      case "document":
        return {
          icon: FileText,
          label: "Written Record",
          color: "#38bdf8",
          bg: "rgba(56, 189, 248, 0.12)",
        };
      case "testimony":
        return {
          icon: MessageSquareQuote,
          label: "Witness Story",
          color: "#fbbf24",
          bg: "rgba(245, 158, 11, 0.12)",
        };
      default:
        return {
          icon: Box,
          label: "Object Clue",
          color: "#34d399",
          bg: "rgba(16, 185, 129, 0.12)",
        };
    }
  };

  const meta = getTypeMeta(clue.type);
  const IconComponent = meta.icon;

  return (
    <div
      style={{
        backgroundColor: "rgba(13, 17, 26, 0.8)",
        border: "1px solid var(--border-dark)",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        transition: "all 0.25s ease",
      }}
      className="card"
    >
      {/* Evidence Tag Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          CLUE #{index + 1}
        </span>

        <span
          className="badge"
          style={{
            backgroundColor: meta.bg,
            color: meta.color,
            borderColor: "transparent",
            fontSize: "0.725rem",
          }}
        >
          <IconComponent size={12} /> {meta.label}
        </span>
      </div>

      {/* Clue Name */}
      <h4 style={{ fontSize: "1.1rem", color: "#fff", lineHeight: "1.3" }}>
        {clue.name}
      </h4>

      {/* Physical Description */}
      <p style={{ fontSize: "0.875rem", color: "var(--text-main)", lineHeight: "1.5" }}>
        {clue.description}
      </p>

      {/* Relevance Callout */}
      <div
        style={{
          marginTop: "auto",
          backgroundColor: "rgba(19, 24, 38, 0.8)",
          borderLeft: `3px solid ${meta.color}`,
          padding: "10px 12px",
          borderRadius: "0 6px 6px 0",
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: "0.725rem",
            color: meta.color,
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: "3px",
            letterSpacing: "0.05em",
          }}
        >
          Why It Matters
        </span>
        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
          {clue.relevance}
        </p>
      </div>
    </div>
  );
};
