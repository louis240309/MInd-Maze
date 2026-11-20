import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { SuspectCard } from "../components/SuspectCard";
import { ClueCard } from "../components/ClueCard";
import { HintSystem } from "../components/HintSystem";
import { AccusationConsole } from "../components/AccusationConsole";
import { StatusBadge } from "../components/StatusBadge";
import { DifficultyBadge } from "../components/DifficultyBadge";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  FileText,
  Users,
  Search,
} from "lucide-react";

export const InvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // Selection & Deduction State
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [isSubmittingSolve, setIsSubmittingSolve] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Hint State
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Fetch Game Dossier
  const fetchGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(`/games/${id}`);
      if (response.data.success && response.data.game) {
        setGame(response.data.game);
        setTitleInput(response.data.game.title);
      }
    } catch (err) {
      console.error("[InvestigationPage] Fetch error:", err);
      setError(
        err.response?.data?.message || "Could not load this mystery."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Request Hint Handler
  const handleRequestHint = async () => {
    if (!game || isLoadingHint) return;
    try {
      setIsLoadingHint(true);
      const res = await api.post(`/games/${id}/hint`);
      if (res.data.success) {
        setGame((prev) => ({
          ...prev,
          hint_count: res.data.hint_count,
          hints: res.data.unlocked_hints,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not get a hint.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit Accusation Handler
  const handleSubmitDeduction = async ({ suspect_id, suspect_name, answer }) => {
    if (!game || isSubmittingSolve) return;
    try {
      setIsSubmittingSolve(true);
      setEvaluationResult(null);

      const res = await api.post(`/games/${id}/solve`, {
        answer,
        suspect_id,
        suspect_name,
      });

      setEvaluationResult(res.data);

      if (res.data.correct) {
        // Update game to solved and show solution
        setGame((prev) => ({
          ...prev,
          status: "solved",
          solution: res.data.solution,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not check your answer.");
    } finally {
      setIsSubmittingSolve(false);
    }
  };

  // Archive / Restore Handler
  const handleToggleArchive = async () => {
    if (!game) return;
    const nextStatus = game.status === "archived" ? "active" : "archived";
    try {
      const res = await api.put(`/games/${id}`, { status: nextStatus });
      if (res.data.success) {
        setGame((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete Case Handler
  const handleDeleteCase = async () => {
    if (!window.confirm("Delete this mystery and all your progress? This cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/games/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to delete case: " + (err.response?.data?.message || err.message));
    }
  };

  // Save Title Edit
  const handleSaveTitle = async (e) => {
    e.preventDefault();
    if (!titleInput.trim() || titleInput.trim() === game.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await api.put(`/games/${id}`, { title: titleInput.trim() });
      if (res.data.success) {
        setGame((prev) => ({ ...prev, title: titleInput.trim() }));
      }
    } catch (err) {
      alert("Failed to update title: " + (err.response?.data?.message || err.message));
    } finally {
      setIsEditingTitle(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "var(--accent-purple)",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading mystery...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "540px" }}>
          <div
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "14px",
              padding: "36px",
            }}
          >
            <AlertCircle size={40} color="#f43f5e" style={{ margin: "0 auto 16px auto" }} />
            <h3 style={{ color: "#fff", marginBottom: "10px" }}>
              Mystery Not Found
            </h3>
            <p style={{ color: "#fda4af", fontSize: "0.95rem", marginBottom: "24px" }}>
              {error || "We could not find this mystery."}
            </p>
            <Link to="/dashboard" className="btn btn-secondary">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSolved = game.status === "solved";
  const isArchived = game.status === "archived";
  const culpritId = isSolved
    ? game.solution?.match(/^Guilty suspect:\s*(suspect_[123])\s*[-—–:]/i)?.[1]
    : null;

  return (
    <div style={{ padding: "30px 0 90px 0" }}>
      <div className="container">
        {/* Navigation Breadcrumb & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <Link
            to="/dashboard"
            className="btn btn-ghost btn-sm"
            style={{ gap: "6px", color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleToggleArchive}
              className="btn btn-secondary btn-sm"
              title={isArchived ? "Restore to Active" : "Archive Case"}
            >
              <Archive size={14} /> {isArchived ? "Restore Case" : "Archive"}
            </button>
            <button
              onClick={handleDeleteCase}
              className="btn btn-danger btn-sm"
              title="Delete Case"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Dossier Banner Card */}
        <div
          className="card"
          style={{
            backgroundColor: "rgba(13, 17, 26, 0.9)",
            borderColor: isSolved ? "#10b981" : "var(--border-glow)",
            padding: "30px",
            marginBottom: "32px",
            boxShadow: isSolved
              ? "0 10px 30px rgba(16, 185, 129, 0.15)"
              : "0 10px 30px rgba(0, 0, 0, 0.5), var(--shadow-glow-purple)",
          }}
        >
          {/* Metadata Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <StatusBadge status={game.status} />
              <DifficultyBadge difficulty={game.difficulty} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-dim)" }}>
              <Calendar size={14} />
              <span>
                Opened:{" "}
                {new Date(game.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Title & Edit */}
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="form-input"
                style={{ fontSize: "1.4rem", fontWeight: 700 }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleInput(game.title);
                  setIsEditingTitle(false);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", margin: 0, color: "#fff" }}>
                {game.title}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "6px", color: "var(--text-dim)" }}
                title="Edit Mystery Title"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}

          {/* Crime Scene Incident Narrative */}
          <div
            style={{
              backgroundColor: "rgba(19, 24, 38, 0.7)",
              border: "1px solid var(--border-dark)",
              borderLeft: "4px solid var(--accent-purple)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--accent-purple)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "8px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <FileText size={14} /> THE STORY
            </div>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-main)",
                lineHeight: "1.7",
                whiteSpace: "pre-line",
              }}
            >
              {game.story}
            </p>
          </div>
        </div>

        {/* SECTION 1: THE THREE SUSPECTS */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Users size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.45rem", margin: 0 }}>
              The Suspects (3)
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
            Read each person's reason, their story, and what they said.
            {!isSolved && " Choose a suspect to make your guess."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {(game.suspects || []).map((suspect) => {
              const isGuilty = suspect.id === culpritId;

              return (
                <SuspectCard
                  key={suspect.id}
                  suspect={suspect}
                  isSelected={selectedSuspectId === suspect.id}
                  onSelect={() => setSelectedSuspectId(suspect.id)}
                  isSolved={isSolved}
                  isGuilty={isGuilty}
                />
              );
            })}
          </div>
        </section>

        {/* SECTION 2: THE THREE CLUES */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Search size={22} color="#34d399" />
            <h2 style={{ fontSize: "1.45rem", margin: 0 }}>
              The Clues (3)
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
            Compare the clues with each person's story.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {(game.clues || []).map((clue, idx) => (
              <ClueCard key={clue.id || idx} clue={clue} index={idx} />
            ))}
          </div>
        </section>

        {/* SECTION 3: PROGRESSIVE HINTS SYSTEM */}
        <section style={{ marginBottom: "40px" }}>
          <HintSystem
            hints={game.hints || []}
            hintCount={game.hint_count || 0}
            maxHints={3}
            onRequestHint={handleRequestHint}
            isLoadingHint={isLoadingHint}
            isSolved={isSolved}
          />
        </section>

        {/* SECTION 4: FORMAL INDICTMENT & ACCUSATION CONSOLE */}
        <section>
          <AccusationConsole
            suspects={game.suspects || []}
            selectedSuspectId={selectedSuspectId}
            onSelectSuspect={(suspectId) => setSelectedSuspectId(suspectId)}
            onSubmitDeduction={handleSubmitDeduction}
            isSubmitting={isSubmittingSolve}
            evaluationResult={evaluationResult}
            solution={game.solution}
            isSolved={isSolved}
          />
        </section>
      </div>
    </div>
  );
};
