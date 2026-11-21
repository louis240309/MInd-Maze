import React from "react";

const narrativeBeats = (story) => String(story || "")
  .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
  .map((beat) => beat.trim())
  .filter(Boolean)
  .slice(0, 8);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not recorded"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const CaseDocuments = ({ game }) => {
  const clues = Array.isArray(game.clues) ? game.clues : [];
  const suspects = Array.isArray(game.suspects) ? game.suspects : [];
  const beats = narrativeBeats(game.story);
  const storyExcerpt = String(game.story || "").trim();

  return (
    <section className="case-file-panel">
      <h2 className="case-section-title">Case documents &amp; chronology</h2>
      <p className="case-file-caption">
        Original documents assembled from this case file. No external image service or stock imagery is used.
      </p>

      <div className="case-documents-grid">
        <article className="case-document evidence-report">
          <div className="document-masthead">
            <span>INVESTIGATION UNIT</span>
            <span>CASE {String(game.id || "").slice(0, 8).toUpperCase() || "FILE"}</span>
          </div>
          <h3>Evidence examination report</h3>
          <p className="document-meta">{game.title} · Opened {formatDate(game.created_at)}</p>
          {clues.length ? clues.map((clue, index) => (
            <section className="document-evidence-entry" key={clue.id || `${clue.name}-${index}`}>
              <strong>EXHIBIT {String(index + 1).padStart(2, "0")} · {clue.name}</strong>
              <p>{clue.description}</p>
              {clue.relevance && <small>Case relevance: {clue.relevance}</small>}
            </section>
          )) : <p>No evidence items are recorded in this case file.</p>}
        </article>

        <article className="case-document investigator-note">
          <div className="document-masthead">
            <span>WORKING NOTES</span>
            <span>{formatDate(game.created_at)}</span>
          </div>
          <h3>Investigator&apos;s case note</h3>
          <p><strong>File:</strong> {game.title}</p>
          <p>{storyExcerpt || "No narrative has been recorded for this case."}</p>
          <h4>Items to cross-reference</h4>
          <ul>{clues.map((clue, index) => <li key={clue.id || `${clue.name}-${index}`}>{clue.name}</li>)}</ul>
          <small>Prepared from the case narrative and filed evidence; no additional facts have been added.</small>
        </article>

        <article className="case-document newspaper-clipping">
          <div className="newspaper-name">THE CASE FILE CHRONICLE</div>
          <div className="newspaper-rule" />
          <p className="newspaper-kicker">FICTIONAL ARCHIVE · {formatDate(game.created_at)}</p>
          <h3>{game.title}</h3>
          <p className="newspaper-deck">{storyExcerpt || "The case narrative has not been recorded."}</p>
          <div className="newspaper-rule" />
          <small>ARCHIVE REPRODUCTION · All people and events belong to this fictional mystery.</small>
        </article>

        <article className="case-document case-timeline">
          <div className="document-masthead">
            <span>NARRATIVE RECONSTRUCTION</span>
            <span>SEQUENCE ONLY</span>
          </div>
          <h3>Case chronology</h3>
          <p className="timeline-disclaimer">
            Story beats are shown in the order written. The case file provides no verified clock times, so none are inferred.
          </p>
          {beats.length ? (
            <ol className="narrative-timeline">
              {beats.map((beat, index) => <li key={`${index}-${beat}`}><span>BEAT {String(index + 1).padStart(2, "0")}</span><p>{beat}</p></li>)}
            </ol>
          ) : <p>No narrative events are available to reconstruct.</p>}
        </article>

        {suspects.map((suspect, index) => (
          <article className="case-document suspect-dossier" key={suspect.id || `${suspect.name}-${index}`}>
            <div className="document-masthead">
              <span>PERSON OF INTEREST</span>
              <span>PROFILE {String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3>{suspect.name}</h3>
            <p className="document-meta">{suspect.role}{suspect.age ? ` · Age ${suspect.age}` : ""}</p>
            {suspect.background && <p>{suspect.background}</p>}
            {suspect.relationship && <p><strong>Case connection:</strong> {suspect.relationship}</p>}
            {suspect.alibi && <blockquote>{suspect.alibi}</blockquote>}
            {suspect.statement && <p className="suspect-quote">“{suspect.statement}”</p>}
          </article>
        ))}
      </div>
    </section>
  );
};
