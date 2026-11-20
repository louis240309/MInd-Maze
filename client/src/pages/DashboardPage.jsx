import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { MysteryCard } from "../components/MysteryCard";
import { StatCard } from "../components/StatCard";
import {
  Compass,
  PlusCircle,
  Search,
  CheckCircle2,
  FolderOpen,
  BarChart3,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();

  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch games & statistics
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [gamesRes, statsRes] = await Promise.all([
        api.get("/games", {
          params: {
            status: statusFilter !== "all" ? statusFilter : undefined,
            difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
            search: searchQuery.trim() || undefined,
            sort: sortBy,
          },
        }),
        api.get("/games/stats"),
      ]);

      if (gamesRes.data.success) {
        setGames(gamesRes.data.games || []);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats || null);
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching cases:", err);
      setError("Failed to load investigation dossiers from server.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, difficultyFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for game card actions
  const handleArchive = async (gameId, newStatus) => {
    try {
      await api.put(`/games/${gameId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update case status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (gameId) => {
    if (!window.confirm("Permanently incinerate this confidential case file? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/games/${gameId}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete case: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateTitle = async (gameId, newTitle) => {
    try {
      await api.put(`/games/${gameId}`, { title: newTitle });
      fetchData();
    } catch (err) {
      alert("Failed to update case title: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: "40px 0 80px 0" }}>
      <div className="container">
        {/* Welcome Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "2rem", margin: 0 }}>
                Investigator Headquarters
              </h1>
              {stats?.detective_rank && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${stats.badge_color || "#8b5cf6"}20`,
                    color: stats.badge_color || "#c084fc",
                    borderColor: stats.badge_color || "#8b5cf6",
                    fontSize: "0.8rem",
                  }}
                >
                  <Sparkles size={12} /> {stats.detective_rank}
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Welcome back, <strong style={{ color: "#fff" }}>{user?.name}</strong>. Here is your current investigative roster.
            </p>
          </div>

          <Link to="/new-mystery" className="btn btn-primary btn-lg" style={{ gap: "8px" }}>
            <PlusCircle size={20} /> Open New Case
          </Link>
        </div>

        {/* Statistics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "36px",
          }}
        >
          <StatCard
            icon={FolderOpen}
            label="Total Cases"
            value={stats ? stats.total_cases : "--"}
            subtext="Lifetime investigations"
            color="var(--accent-purple)"
          />
          <StatCard
            icon={Compass}
            label="Active Cases"
            value={stats ? stats.active_cases : "--"}
            subtext="In-progress investigations"
            color="#fbbf24"
          />
          <StatCard
            icon={CheckCircle2}
            label="Solved Cases"
            value={stats ? stats.solved_cases : "--"}
            subtext="Verdicts confirmed"
            color="#34d399"
          />
          <StatCard
            icon={BarChart3}
            label="Solve Accuracy"
            value={stats ? `${stats.solve_rate}%` : "--"}
            subtext={`Avg ${stats?.avg_hints_per_case || 0} hints / case`}
            color="#38bdf8"
          />
        </div>

        {/* Filter & Search Bar */}
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
          {/* Top row: Status Filter Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Cases" },
                { id: "active", label: "Active" },
                { id: "solved", label: "Solved" },
                { id: "archived", label: "Archived" },
              ].map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-ghost"}`}
                    style={{
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Count */}
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Showing {games.length} {games.length === 1 ? "case file" : "case files"}
            </span>
          </div>

          {/* Bottom row: Search & Dropdowns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search cases by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "36px", paddingRight: "14px", fontSize: "0.9rem" }}
              />
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>

            {/* Difficulty Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: "0.9rem" }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy (Novice)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Mastermind)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fda4af",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "24px",
            }}
          >
            <AlertCircle size={20} />
            <span role="alert" style={{ flex: 1 }}>{error}</span>
            <button type="button" onClick={fetchData} disabled={isLoading} className="btn btn-secondary btn-sm">
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(139, 92, 246, 0.2)",
                borderTopColor: "var(--accent-purple)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Retrieving case records from central archives...</p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : games.length === 0 ? (
          /* Empty State */
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "rgba(13, 17, 26, 0.5)",
              border: "1px dashed var(--border-dark)",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                color: "var(--accent-purple)",
              }}
            >
              <Compass size={28} />
            </div>
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "8px" }}>
              No Investigation Files Found
            </h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto 24px auto", fontSize: "0.9rem" }}>
              {searchQuery || statusFilter !== "all" || difficultyFilter !== "all"
                ? "No cases match your active filters. Try adjusting your search query or difficulty setting."
                : "Your investigation queue is currently empty. Commission your first AI-generated mystery case now!"}
            </p>
            <Link to="/new-mystery" className="btn btn-primary">
              <PlusCircle size={16} /> Open First Mystery
            </Link>
          </div>
        ) : (
          /* Mystery Cards Grid */
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
