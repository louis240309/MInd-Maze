import React, { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { DifficultyBadge } from "./DifficultyBadge";
import {
  ArrowRight,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

export const MysteryCard = ({
  game,
  onArchive,
  onDelete,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(game.title);

  const handleSaveTitle = (e) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle.trim() !== game.title) {
      onUpdateTitle(game.id, newTitle.trim());
    }
    setIsEditing(false);
  };

  const formattedDate = new Date(game.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isSolved = game.status === "solved";
  const isArchived = game.status === "archived";

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        borderColor: isSolved ? "rgba(16, 185, 129, 0.25)" : "var(--border-dark)",
      }}
    >
      {/* Top Banner: Status & Difficulty */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusBadge status={game.status} />
            <DifficultyBadge difficulty={game.difficulty} />
          </div>
          <span
            style={{
              fontSize: "0.785rem",
              color: "var(--text-dim)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Calendar size={12} /> {formattedDate}
          </span>
        </div>

        {isSolved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              fontSize: "0.8rem",
              color: "#fbbf24",
            }}
          >
            <CheckCircle size={13} />
            <strong>{game.points_earned || 0} points earned</strong>
          </div>
        )}

        {/* Title / Inline Edit */}
        {isEditing ? (
          <form onSubmit={handleSaveTitle} style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="form-input"
              style={{ padding: "6px 10px", fontSize: "0.95rem" }}
              autoFocus
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setNewTitle(game.title);
                setIsEditing(false);
              }}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <h3
              style={{
                fontSize: "1.2rem",
                color: "#fff",
                lineHeight: "1.3",
                marginBottom: "8px",
              }}
            >
              <Link
                to={`/games/${game.id}`}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "var(--accent-cyan)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
              >
                {game.title}
              </Link>
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px", color: "var(--text-dim)" }}
              title="Edit Case Title"
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}

        {/* Story Teaser */}
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            lineHeight: "1.5",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          {game.story}
        </p>

        {/* Hints used metric */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            color: "var(--text-dim)",
          }}
        >
          <HelpCircle size={13} color="var(--accent-purple)" />
          <span>
            Forensic Hints:{" "}
            <strong style={{ color: "var(--text-main)" }}>
              {game.hint_count || 0}/3
            </strong>{" "}
            unlocked
          </span>
        </div>

        {isSolved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              fontSize: "0.8rem",
              color: "#fbbf24",
            }}
          >
            <CheckCircle size={13} />
            <strong>{game.points_earned || 0} points earned</strong>
          </div>
        )}

      </div>

      {/* Action Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          paddingTop: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => onArchive(game.id, isArchived ? "active" : "archived")}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "0.8rem", padding: "6px 8px" }}
            title={isArchived ? "Restore Case to Active" : "Archive Case"}
          >
            <Archive size={14} />
            {isArchived ? "Restore" : "Archive"}
          </button>

          <button
            onClick={() => onDelete(game.id)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "0.8rem", padding: "6px 8px", color: "#f43f5e" }}
            title="Delete Case Dossier"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <Link
          to={`/games/${game.id}`}
          className={`btn btn-sm ${isSolved ? "btn-secondary" : "btn-primary"}`}
          style={{
            gap: "6px",
            fontWeight: 600,
          }}
        >
          {isSolved ? (
            <>
              Review Dossier <CheckCircle size={14} color="#10b981" />
            </>
          ) : (
            <>
              Investigate <ArrowRight size={14} />
            </>
          )}
        </Link>
      </div>
    </div>
  );
};
