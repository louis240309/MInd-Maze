import React, { useState } from "react";
import {
  Gavel,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Award,
} from "lucide-react";

export const AccusationConsole = ({
  suspects = [],
  selectedSuspectId,
  onSelectSuspect,
  onSubmitGuess,
  isSubmitting,
  evaluationResult,
  solution,
  isSolved,
}) => {
  const [errorMsg, setErrorMsg] = useState("");

  const selectedSuspect = suspects.find((s) => s.id === selectedSuspectId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedSuspectId) {
      setErrorMsg("Choose a suspect first.");
      return;
    }

    onSubmitGuess({
      suspect_id: selectedSuspectId,
      suspect_name: selectedSuspect ? selectedSuspect.name : "",
    });
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(13, 17, 26, 0.95)",
        border: "1px solid var(--border-glow)",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), var(--shadow-glow-purple)",
        position: "relative",
      }}
    >
      {/* Solved View */}
      {isSolved ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                flexShrink: 0,
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ color: "#34d399", fontSize: "1.2rem", marginBottom: "2px" }}>
                Case Solved
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                You found the guilty person.
              </p>
            </div>
          </div>

          {/* Reveal Solution */}
          <div
            style={{
              backgroundColor: "rgba(19, 24, 38, 0.9)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderLeft: "4px solid #10b981",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#34d399",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
                fontFamily: "var(--font-mono)",
              }}
            >
              THE ANSWER
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--text-main)", lineHeight: "1.6" }}>
              {solution}
            </p>
          </div>
        </div>
      ) : (
        /* Active Accusation Form */
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Gavel size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>
                Make Your Guess
              </h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Choose who you think did it.
            </p>
          </div>

          {/* Suspect Selector Pill List */}
          <div>
            <label className="form-label" style={{ marginBottom: "10px", display: "block" }}>
              1. Choose a Suspect:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {suspects.map((s) => {
                const isThisSelected = s.id === selectedSuspectId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSuspect(s.id)}
                    style={{
                      backgroundColor: isThisSelected ? "rgba(139, 92, 246, 0.2)" : "rgba(19, 24, 38, 0.6)",
                      border: `1.5px solid ${isThisSelected ? "var(--accent-purple)" : "var(--border-dark)"}`,
                      borderRadius: "10px",
                      padding: "12px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: isThisSelected ? "#fff" : "var(--text-main)", fontSize: "0.9rem" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {s.role}
                      </div>
                    </div>
                    {isThisSelected && <CheckCircle2 size={16} color="var(--accent-purple)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Error */}
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#fda4af",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            >
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          {/* Feedback Display from previous evaluation attempt */}
          {evaluationResult && !evaluationResult.correct && (
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                gap: "12px",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <ShieldAlert size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h5 style={{ color: "#fbbf24", marginBottom: "4px", fontSize: "0.95rem" }}>
                  Try Again
                </h5>
                <p style={{ color: "var(--text-main)", fontSize: "0.875rem", lineHeight: "1.5" }}>
                  {evaluationResult.feedback}
                </p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ gap: "10px" }}
            >
              {isSubmitting ? (
                "Checking your guess..."
              ) : (
                <>
                  Check My Guess <Gavel size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
