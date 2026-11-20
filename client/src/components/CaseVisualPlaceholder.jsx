import React from "react";

export const CaseVisualPlaceholder = ({ type = "generic", compact = false }) => (
  <div
    className={`case-visual-placeholder${compact ? " compact" : ""} ${type}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 400 300" focusable="false">
      <path className="placeholder-frame" d="M24 24h352v252H24z" />
      {type === "crime_scene" && (
        <>
          <path className="placeholder-line" d="M70 226V106l130-50 130 50v120M70 106h260M200 56v170" />
          <path className="placeholder-accent" d="M140 226v-68h120v68M174 158v-40h52v40" />
          <circle className="placeholder-dot" cx="200" cy="90" r="13" />
        </>
      )}
      {type === "evidence" && (
        <>
          <circle className="placeholder-accent" cx="184" cy="140" r="62" />
          <path className="placeholder-line" d="m229 185 70 70M159 124c0-20 12-32 28-32s28 12 28 32-12 32-28 32-28-12-28-32Zm-22 8c0-34 20-54 50-54m-50 92c-16-14-24-31-24-52" />
          <circle className="placeholder-dot" cx="184" cy="140" r="7" />
        </>
      )}
      {(type === "suspect" || type === "generic") && (
        <>
          <circle className="placeholder-accent" cx="200" cy="119" r="43" />
          <path className="placeholder-accent" d="M105 250c8-54 43-82 95-82s87 28 95 82" />
          <path className="placeholder-line" d="M122 250h156" />
          <circle className="placeholder-dot" cx="184" cy="118" r="3" />
          <circle className="placeholder-dot" cx="216" cy="118" r="3" />
          <path className="placeholder-line" d="M186 139q14 9 28 0" />
        </>
      )}
    </svg>
    {!compact && <span>ILLUSTRATIVE PLACEHOLDER</span>}
  </div>
);
