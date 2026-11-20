import React from "react";
import { Sparkles, Shield, Flame } from "lucide-react";

export const DifficultyBadge = ({ difficulty }) => {
  const norm = (difficulty || "medium").toLowerCase();

  if (norm === "easy") {
    return (
      <span className="badge badge-easy">
        <Sparkles size={11} /> Easy
      </span>
    );
  }

  if (norm === "hard") {
    return (
      <span className="badge badge-hard">
        <Flame size={11} /> Hard
      </span>
    );
  }

  return (
    <span className="badge badge-medium">
      <Shield size={11} /> Medium
    </span>
  );
};

