import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

export const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <div className="card" style={{ maxWidth: "480px", padding: "40px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(139, 92, 246, 0.15)",
            color: "var(--accent-purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
          }}
        >
          <Compass size={32} />
        </div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>404</h1>
        <h2 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "12px" }}>
          Uncharted Cold Case
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "28px" }}>
          The case file or coordinates you requested do not exist in the bureau archives.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ gap: "8px" }}>
          <ArrowLeft size={16} /> Return to Investigation HQ
        </Link>
      </div>
    </div>
  );
};

