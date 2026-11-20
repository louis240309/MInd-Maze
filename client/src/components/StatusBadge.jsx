import React from "react";
import { CheckCircle2, Archive } from "lucide-react";

export const StatusBadge = ({ status }) => {
  const norm = (status || "active").toLowerCase();

  if (norm === "solved") {
    return (
      <span className="badge badge-solved">
        <CheckCircle2 size={12} strokeWidth={2.5} /> Case Solved
      </span>
    );
  }

  if (norm === "archived") {
    return (
      <span className="badge badge-archived">
        <Archive size={12} strokeWidth={2.5} /> Archived
      </span>
    );
  }

  return (
    <span className="badge badge-active">
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "#fbbf24",
          boxShadow: "0 0 6px #fbbf24",
          display: "inline-block",
        }}
      />
      Active Investigation
    </span>
  );
};
