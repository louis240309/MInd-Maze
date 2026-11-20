import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Quote, CheckCircle } from "lucide-react";
import { CaseVisualPlaceholder } from "./CaseVisualPlaceholder";

export const SuspectCard = ({
  suspect,
  isSelected,
  onSelect,
  isSolved,
  isGuilty,
  imageUrl,
}) => {
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const visibleImageUrl = imageUrl === failedImageUrl ? null : imageUrl;

  return (
    <div
      onClick={!isSolved ? onSelect : undefined}
      onKeyDown={!isSolved ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      } : undefined}
      role={!isSolved ? "button" : undefined}
      tabIndex={!isSolved ? 0 : undefined}
      aria-pressed={!isSolved ? isSelected : undefined}
      style={{
        backgroundColor: isSelected
          ? "rgba(139, 92, 246, 0.15)"
          : "rgba(13, 17, 26, 0.8)",
        border: `2px solid ${
          isSolved && isGuilty
            ? "#10b981"
            : isSelected
            ? "var(--accent-purple)"
            : "var(--border-dark)"
        }`,
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        cursor: !isSolved ? "pointer" : "default",
        transition: "all 0.25s ease",
        position: "relative",
        boxShadow: isSelected ? "var(--shadow-glow-purple)" : "none",
      }}
    >
      {/* Top Header: Avatar, Name, Role & Selection Indicator */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: isSelected ? "var(--accent-purple)" : "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSelected ? "#fff" : "var(--accent-cyan)",
              flexShrink: 0,
            }}
          >
            {visibleImageUrl
              ? <img src={visibleImageUrl} alt={suspect.name} onError={() => setFailedImageUrl(visibleImageUrl)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9px" }} />
              : <CaseVisualPlaceholder type="suspect" compact />}
          </div>

          <div>
            <h4 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "2px" }}>
              {suspect.name}
            </h4>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--accent-cyan)",
                fontWeight: 500,
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                padding: "2px 8px",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              {suspect.role}
            </span>
            {suspect.age && <span style={{ display: "block", marginTop: "5px", color: "var(--text-muted)", fontSize: "0.78rem" }}>Age {suspect.age}</span>}
          </div>
        </div>

        {/* Selection Badge / Solved Result */}
        {isSolved ? (
          isGuilty ? (
            <span
              className="badge"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                color: "#34d399",
                borderColor: "#10b981",
              }}
            >
              <CheckCircle size={12} /> Guilty
            </span>
          ) : (
            <span
              className="badge"
              style={{
                backgroundColor: "rgba(148, 163, 184, 0.1)",
                color: "#94a3b8",
              }}
            >
              Not Guilty
            </span>
          )
        ) : (
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              border: `2px solid ${isSelected ? "var(--accent-purple)" : "var(--text-dim)"}`,
              backgroundColor: isSelected ? "var(--accent-purple)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />}
          </div>
        )}
      </div>

      {(suspect.background || suspect.relationship) && <div style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>
        {suspect.background && <p style={{ margin: "0 0 5px" }}>{suspect.background}</p>}
        {suspect.relationship && <p style={{ margin: 0 }}><strong style={{ color: "var(--text-main)" }}>Case connection:</strong> {suspect.relationship}</p>}
      </div>}

      {/* Motive Details */}
      <div
        style={{
          backgroundColor: "rgba(244, 63, 94, 0.06)",
          borderLeft: "3px solid #f43f5e",
          padding: "10px 12px",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fda4af", fontSize: "0.785rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
          <AlertTriangle size={13} /> Possible Reason
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: "1.4" }}>
          {suspect.motive}
        </p>
      </div>

      {/* Alibi Details */}
      <div
        style={{
          backgroundColor: "rgba(56, 189, 248, 0.06)",
          borderLeft: "3px solid var(--accent-cyan)",
          padding: "10px 12px",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-cyan)", fontSize: "0.785rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
          <ShieldCheck size={13} /> Their Story
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: "1.4" }}>
          {suspect.alibi}
        </p>
      </div>

      {/* Interrogation Statement */}
      <div
        style={{
          backgroundColor: "rgba(19, 24, 38, 0.9)",
          border: "1px dashed var(--border-dark)",
          borderRadius: "8px",
          padding: "12px",
          position: "relative",
        }}
      >
        <Quote size={16} color="var(--accent-purple)" style={{ opacity: 0.5, marginBottom: "4px" }} />
        <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--text-muted)", lineHeight: "1.45" }}>
          "{suspect.statement}"
        </p>
      </div>
    </div>
  );
};
