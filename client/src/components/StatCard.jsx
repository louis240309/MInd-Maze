import React from "react";

export const StatCard = ({ icon: Icon, label, value, subtext, color = "var(--accent-purple)" }) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(13, 17, 26, 0.8)",
        border: "1px solid var(--border-dark)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        transition: "all 0.2s ease",
      }}
      className="card"
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: `${color}18`,
          border: `1px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>

      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", lineHeight: "1.1" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
          {label}
        </div>
        {subtext && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

