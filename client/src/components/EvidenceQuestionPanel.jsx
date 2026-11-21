import React, { useState } from "react";
import { MessageSquareText, Search } from "lucide-react";
import { DictionaryText } from "./DetectiveDictionary";

export const EvidenceQuestionPanel = ({ suspects, evidence, initialEvidenceId = "" }) => {
  const [suspectId, setSuspectId] = useState(suspects[0]?.id || "");
  const [evidenceId, setEvidenceId] = useState(initialEvidenceId || evidence[0]?.id || "");
  const [hasAsked, setHasAsked] = useState(false);
  const activeSuspectId = suspects.some(({ id }) => id === suspectId) ? suspectId : suspects[0]?.id || "";
  const activeEvidenceId = evidence.some(({ id }) => id === evidenceId) ? evidenceId : evidence[0]?.id || "";
  const suspect = suspects.find(({ id }) => id === activeSuspectId);
  const clue = evidence.find(({ id }) => id === activeEvidenceId);

  return (
    <section className="evidence-question-panel">
      <h3><MessageSquareText size={19} /> Question a suspect with evidence</h3>
      <p>Choose a suspect and a clue. Compare it with their recorded statement.</p>
      {evidence.length ? (
        <>
          <div className="evidence-question-controls">
            <label>
              Suspect
              <select value={activeSuspectId} onChange={(event) => { setSuspectId(event.target.value); setHasAsked(false); }}>
                {suspects.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </label>
            <label>
              Evidence
              <select value={activeEvidenceId} onChange={(event) => { setEvidenceId(event.target.value); setHasAsked(false); }}>
                {evidence.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-primary" disabled={!suspect || !clue} onClick={() => setHasAsked(true)}>
              <Search size={15} /> Prepare question
            </button>
          </div>
          {hasAsked && suspect && clue && (
            <div className="evidence-question-result" aria-live="polite">
              <div>
                <strong>Your question</strong>
                <p>“How does <DictionaryText>{clue.name}</DictionaryText> fit with your statement?”</p>
              </div>
              <div>
                <strong>{suspect.name}&apos;s recorded statement</strong>
                <p>“<DictionaryText>{suspect.statement}</DictionaryText>”</p>
              </div>
              <small>This review uses the case facts already on file. It does not add new facts.</small>
            </div>
          )}
        </>
      ) : (
        <div className="evidence-question-empty">Explore the scene to collect evidence you can compare with each statement.</div>
      )}
    </section>
  );
};
