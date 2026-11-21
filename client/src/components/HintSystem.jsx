import React, { useState } from "react";
import { Key, Lock, Sparkles, AlertCircle } from "lucide-react";
import { DictionaryText } from "./DetectiveDictionary";

export const HintSystem = ({
  hints = [],
  hintCount = 0,
  maxHints = 3,
  onRequestHint,
  isLoadingHint,
  isSolved,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const hintsRemaining = Math.max(0, maxHints - hintCount);

  const handleRequestClick = () => {
    if (hintsRemaining <= 0 || isLoadingHint) return;
    setShowConfirm(true);
  };

  const confirmRequest = async () => {
    setShowConfirm(false);
    await onRequestHint();
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(13, 17, 26, 0.75)",
        border: "1px solid var(--border-dark)",
        borderRadius: "14px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Header and Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Key size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: "1.15rem", color: "#fff" }}>
              Hints
            </h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Need help? Ask for a hint.
          </p>
        </div>

        {/* Counter & Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              background: "rgba(19, 24, 38, 0.8)",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-dark)",
            }}
          >
            <span style={{ color: hintCount > 0 ? "var(--accent-purple)" : "inherit", fontWeight: 700 }}>
              {hintCount}
            </span>
            <span>/</span>
            <span>of {maxHints} hints</span>
          </div>

          {!isSolved && (
            <button
              onClick={handleRequestClick}
              disabled={hintsRemaining === 0 || isLoadingHint}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: hintsRemaining > 0 ? "var(--accent-purple)" : "transparent",
                color: hintsRemaining > 0 ? "#fff" : "var(--text-dim)",
              }}
            >
              {isLoadingHint ? (
                "Getting a hint…"
              ) : hintsRemaining === 0 ? (
                <>
                  <Lock size={14} /> No Hints Left
                </>
              ) : (
                <>
                  <Sparkles size={14} color="var(--accent-cyan)" /> Get a Hint ({hintsRemaining} left)
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation prompt */}
      {showConfirm && (
        <div
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            border: "1px solid var(--accent-purple)",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={20} color="var(--accent-purple)" />
            <span style={{ fontSize: "0.9rem", color: "#fff" }}>
              This uses one of your three hints. Continue?
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={confirmRequest} className="btn btn-primary btn-sm">
              Show Hint
            </button>
            <button onClick={() => setShowConfirm(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unlocked Hints List */}
      {hints.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            background: "rgba(19, 24, 38, 0.4)",
            borderRadius: "10px",
            border: "1px dashed var(--border-dark)",
            color: "var(--text-dim)",
            fontSize: "0.875rem",
          }}
        >
          No hints yet. Ask for one if you get stuck.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {hints.map((hintText, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "rgba(19, 24, 38, 0.9)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                borderLeft: "4px solid var(--accent-purple)",
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--accent-purple)",
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "rgba(139, 92, 246, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                HINT #{idx + 1}
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.5" }}>
                <DictionaryText>{hintText}</DictionaryText>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
