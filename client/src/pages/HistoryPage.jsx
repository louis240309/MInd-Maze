import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { MysteryCard } from "../components/MysteryCard";
import {
  History,
  Search,
  AlertCircle,
} from "lucide-react";

export const HistoryPage = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get("/games", {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
          search: searchQuery.trim() || undefined,
          sort: sortBy,
        },
      });
      if (response.data.success) {
        setGames(response.data.games || []);
      }
    } catch (err) {
      console.error("[HistoryPage] Error:", err);
      setError("Failed to fetch historical case logs.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, difficultyFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleArchive = async (gameId, newStatus) => {
    try {
      await api.put(`/games/${gameId}`, { status: newStatus });
      fetchGames();
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (gameId) => {
    if (!window.confirm("Permanently purge this historical case record?")) return;
    try {
      await api.delete(`/games/${gameId}`);
      fetchGames();
    } catch (err) {
      alert("Error deleting case: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateTitle = async (gameId, newTitle) => {
    try {
      await api.put(`/games/${gameId}`, { title: newTitle });
      fetchGames();
    } catch (err) {
      alert("Error updating title: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: "40px 0 80px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <History size={26} color="var(--accent-purple)" />
            <h1 style={{ fontSize: "2rem", margin: 0 }}>
              Bureau Case Archives
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Permanent historical records of all opened, solved, and archived investigations.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            backgroundColor: "rgba(13, 17, 26, 0.8)",
            border: "1px solid var(--border-dark)",
            borderRadius: "14px",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          {/* Top Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Archives" },
                { id: "solved", label: "Solved Verdicts" },
                { id: "active", label: "Active Pursuits" },
                { id: "archived", label: "Cold/Archived" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`btn btn-sm ${statusFilter === tab.id ? "btn-primary" : "btn-ghost"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              {games.length} total records cataloged
            </span>
          </div>

          {/* Search & Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search case records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "36px", fontSize: "0.9rem" }}
              />
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="difficulty">Sort: Difficulty Level</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fda4af",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={18} />
              <span role="alert" style={{ flex: 1 }}>{error}</span>
              <button type="button" onClick={fetchGames} disabled={isLoading} className="btn btn-secondary btn-sm">
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
            Loading archive records...
          </div>
        ) : games.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "rgba(13, 17, 26, 0.5)",
              border: "1px dashed var(--border-dark)",
              borderRadius: "16px",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "8px" }}>
              No Historical Files Found
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
              No investigations match the specified archive filters.
            </p>
            <Link to="/new-mystery" className="btn btn-primary">
              Open A New Mystery
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "22px",
            }}
          >
            {games.map((game) => (
              <MysteryCard
                key={game.id}
                game={game}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onUpdateTitle={handleUpdateTitle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
