import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { StatCard } from "../components/StatCard";
import {
  User,
  Mail,
  Calendar,
  Sparkles,
  Award,
  Edit2,
  LogOut,
  FolderOpen,
  CheckCircle2,
  BarChart3,
  Key,
  Shield,
  Flame,
  Compass,
  AlertCircle,
} from "lucide-react";

export const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileRetry, setProfileRetry] = useState(0);

  // Edit name state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const retryProfile = () => {
    setIsLoading(true);
    setError("");
    setProfileRetry((attempt) => attempt + 1);
  };

  useEffect(() => {
    let isCurrent = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        if (isCurrent && res.data.success) {
          setProfile(res.data.profile);
          setStats(res.data.profile.stats);
          setNameInput(res.data.profile.name);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (isCurrent) setError(err.response?.data?.message || "Detective profile could not be loaded. Check your connection and retry.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadProfile();
    return () => { isCurrent = false; };
  }, [profileRetry]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === profile?.name) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put("/users/profile", { name: nameInput.trim() });
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, name: res.data.user.name }));
        updateUser(res.data.user);
        setSuccessMsg("Detective codename updated successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert("Failed to update name: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const formattedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  // Badges calculation
  const solvedCount = stats?.solved_cases || 0;
  const badges = [
    {
      title: "First Case Closed",
      desc: "Successfully crack your very first mystery investigation.",
      unlocked: solvedCount >= 1,
      icon: Award,
      color: "#10b981",
    },
    {
      title: "Sharpshooter Sleuth",
      desc: "Solve 2 or more criminal investigations.",
      unlocked: solvedCount >= 2,
      icon: Compass,
      color: "#38bdf8",
    },
    {
      title: "Senior Inspector",
      desc: "Solve 5 or more complex investigations.",
      unlocked: solvedCount >= 5,
      icon: Shield,
      color: "#8b5cf6",
    },
    {
      title: "Mastermind Breaker",
      desc: "Solve 10 or more cases with supreme forensic precision.",
      unlocked: solvedCount >= 10,
      icon: Flame,
      color: "#f59e0b",
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
        Loading detective dossier...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
        <AlertCircle size={28} color="#f43f5e" style={{ marginBottom: "12px" }} />
        <p role="alert" style={{ marginBottom: "18px" }}>{error}</p>
        <button type="button" onClick={retryProfile} className="btn btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "940px" }}>
        {/* Profile Card Header */}
        <div
          className="card"
          style={{
            padding: "36px",
            marginBottom: "32px",
            backgroundColor: "rgba(13, 17, 26, 0.9)",
            border: "1px solid var(--border-glow)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), var(--shadow-glow-purple)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            {/* Avatar & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #8b5cf6, #38bdf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
                  color: "#07090e",
                  flexShrink: 0,
                }}
              >
                <User size={38} strokeWidth={2.2} />
              </div>

              <div>
                {isEditing ? (
                  <form onSubmit={handleSaveName} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="form-input"
                      style={{ padding: "6px 12px", fontSize: "1.1rem" }}
                      autoFocus
                    />
                    <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h2 style={{ fontSize: "1.8rem", margin: 0 }}>
                      {profile?.name || user?.name || "Detective"}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "4px", color: "var(--text-dim)" }}
                      title="Edit Codename"
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "16px", color: "var(--text-muted)", fontSize: "0.875rem", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Mail size={14} color="var(--text-dim)" /> {profile?.email || user?.email}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} color="var(--text-dim)" /> Enlisted: {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank Badge & Sign Out */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
              {stats?.detective_rank && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${stats.badge_color || "#8b5cf6"}25`,
                    color: stats.badge_color || "#c084fc",
                    borderColor: stats.badge_color || "#8b5cf6",
                    fontSize: "0.85rem",
                    padding: "6px 14px",
                  }}
                >
                  <Sparkles size={14} /> {stats.detective_rank}
                </span>
              )}

              <button onClick={logout} className="btn btn-danger btn-sm" style={{ gap: "6px" }}>
                <LogOut size={14} /> Sign Out of Bureau
              </button>
            </div>
          </div>

          {successMsg && (
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34d399",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                display: "inline-block",
              }}
            >
              {successMsg}
            </div>
          )}
        </div>

        {/* Statistics Section */}
        <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#fff" }}>
          Career Investigation Performance
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          <StatCard
            icon={FolderOpen}
            label="Total Cases"
            value={stats ? stats.total_cases : "--"}
            subtext="Assigned dossiers"
            color="var(--accent-purple)"
          />
          <StatCard
            icon={CheckCircle2}
            label="Solved Cases"
            value={stats ? stats.solved_cases : "--"}
            subtext="Perpetrators caught"
            color="#34d399"
          />
          <StatCard
            icon={BarChart3}
            label="Solve Accuracy"
            value={stats ? `${stats.solve_rate}%` : "--"}
            subtext="Verdict success rate"
            color="#38bdf8"
          />
          <StatCard
            icon={Key}
            label="Forensic Hints"
            value={stats ? stats.total_hints_used : "--"}
            subtext={`Avg ${stats?.avg_hints_per_case || 0} per case`}
            color="#fbbf24"
          />
        </div>

        {/* Achievements / Badges Section */}
        <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#fff" }}>
          Bureau Commendations & Badges
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: "20px",
                  opacity: badge.unlocked ? 1 : 0.45,
                  backgroundColor: badge.unlocked
                    ? "rgba(13, 17, 26, 0.85)"
                    : "rgba(13, 17, 26, 0.4)",
                  borderColor: badge.unlocked ? `${badge.color}60` : "var(--border-dark)",
                  filter: badge.unlocked ? "none" : "grayscale(0.7)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: `${badge.color}20`,
                    color: badge.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Icon size={20} />
                </div>
                <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "4px" }}>
                  {badge.title}
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  {badge.desc}
                </p>
                <div style={{ marginTop: "12px", fontSize: "0.75rem", fontWeight: 700, color: badge.unlocked ? badge.color : "var(--text-dim)" }}>
                  {badge.unlocked ? "✓ COMMENDED" : "LOCKED"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
