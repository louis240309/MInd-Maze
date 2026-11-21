import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MapPin,
  Search,
  ZoomIn,
} from "lucide-react";
import { CaseVisualPlaceholder } from "./CaseVisualPlaceholder";
import { ClueCard } from "./ClueCard";
import { DictionaryText } from "./DetectiveDictionary";

const motifForObject = (category) => ({
  document: "document",
  container: "glass",
  personal_item: "key",
  fixture: "timepiece",
  furniture: "evidence",
  other: "evidence",
}[category] || "evidence");

const ProgressBar = ({ label, value, total }) => (
  <div className="scene-progress-item">
    <div><span>{label}</span><strong>{value}/{total}</strong></div>
    <progress value={value} max={Math.max(total, 1)} aria-label={`${label}: ${value} of ${total}`} />
  </div>
);

export const CrimeSceneExplorer = ({
  scene,
  isLoading,
  error,
  isInspecting,
  actionMessage,
  actionError,
  onInspect,
  onLoadPhoto,
  onZoom,
  onUseEvidence,
}) => {
  const [selection, setSelection] = useState({ caseId: "", areaId: "", objectId: "" });
  const [photoState, setPhotoState] = useState({ key: "", status: "loading" });
  const attemptedPhotos = useRef(new Set());
  const areas = scene?.areas || [];
  const sameCase = selection.caseId === scene?.case_id;
  const activeAreaId = sameCase ? selection.areaId : "";
  const selectedObjectId = sameCase ? selection.objectId : "";
  const activeArea = areas.find(({ id }) => id === activeAreaId) || areas[0];
  const selectedObject = activeArea?.objects.find(({ id }) => id === selectedObjectId) || null;
  const progress = scene?.progress;
  const photoKey = activeArea ? `${scene?.case_id}:${activeArea.id}:${activeArea.photo?.image_url || ""}` : "";
  const photoStatus = photoState.key === photoKey
    ? photoState.status
    : activeArea?.photo ? "loading" : "fallback";

  useEffect(() => {
    if (!activeArea || activeArea.photo || !onLoadPhoto) return;
    const requestKey = `${scene.case_id}:${activeArea.id}`;
    if (attemptedPhotos.current.has(requestKey)) return;
    attemptedPhotos.current.add(requestKey);
    onLoadPhoto(activeArea).then((photo) => {
      if (photo) setPhotoState({ key: `${requestKey}:${photo.image_url}`, status: "loading" });
    });
  }, [activeArea, activeArea?.photo?.image_url, onLoadPhoto, scene?.case_id]);

  const evidenceById = useMemo(
    () => new Map((scene?.evidence || []).map((evidence) => [evidence.id, evidence])),
    [scene?.evidence]
  );
  const recoveredClue = selectedObject?.evidence_id ? evidenceById.get(selectedObject.evidence_id) : null;

  if (isLoading) {
    return <div className="crime-scene-loading" role="status">Preparing the scene...</div>;
  }
  if (error || !scene) {
    return <div className="case-visual-alert" role="alert">{error || "The crime scene could not be loaded."}</div>;
  }

  return (
    <div className="crime-scene-explorer">
      <header className="crime-scene-header">
        <div>
          <span className="evidence-stamp">CRIME SCENE</span>
          <h3>{scene.name}</h3>
          <p>{scene.description}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onZoom({
            asset_type: "crime_scene",
            theme_key: scene.scene_type,
            motif: scene.scene_type,
            name: `${scene.name} — ${activeArea.name}`,
            photo: activeArea.photo,
          })}
        >
          <ZoomIn size={15} /> Zoom scene
        </button>
      </header>

      <div className="crime-scene-progress" aria-label="Exploration progress">
        <ProgressBar label="Objects examined" value={progress.objects_examined} total={progress.total_objects} />
        <ProgressBar label="Evidence found" value={progress.evidence_discovered} total={progress.total_evidence} />
        <ProgressBar label="Locations explored" value={progress.locations_explored} total={progress.total_locations} />
      </div>

      <p className="crime-scene-instructions">
        Choose a location, then select an object. Inspect it, and look closer when you are ready.
      </p>

      <nav className="crime-scene-areas" aria-label="Crime scene locations">
        {areas.map((area) => (
          <button
            type="button"
            key={area.id}
            className={area.id === activeArea.id ? "active" : ""}
            aria-pressed={area.id === activeArea.id}
            onClick={() => {
              setSelection({ caseId: scene.case_id, areaId: area.id, objectId: "" });
            }}
          >
            <MapPin size={15} /> {area.name}
          </button>
        ))}
      </nav>

      <div className="crime-scene-layout">
        <div className="crime-scene-main">
          <div className={`crime-scene-art${activeArea.photo && photoStatus === "loaded" ? " has-photo" : ""}`}>
            <CaseVisualPlaceholder type="crime_scene" themeKey={scene.scene_type} motif={scene.scene_type} />
            {activeArea.photo && photoStatus !== "failed" && (
              <>
                <img
                  className={`crime-scene-photo${photoStatus === "loaded" ? " loaded" : ""}`}
                  src={activeArea.photo.image_url}
                  alt={activeArea.photo.alt_text}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setPhotoState({ key: photoKey, status: "loaded" })}
                  onError={() => setPhotoState({ key: photoKey, status: "failed" })}
                />
                {photoStatus === "loading" && <span className="crime-scene-photo-loading" role="status">Loading location photo...</span>}
              </>
            )}
            {activeArea.objects.map((object, index) => (
              <button
                type="button"
                key={object.id}
                className={`crime-scene-hotspot${object.id === selectedObjectId ? " selected" : ""}${object.examined ? " examined" : ""}${!object.available ? " locked" : ""}`}
                style={{ left: `${object.x}%`, top: `${object.y}%`, "--hotspot-order": index }}
                aria-label={`${object.name}${object.examined ? ", examined" : ""}${!object.available ? ", locked" : ""}`}
                aria-pressed={object.id === selectedObjectId}
                title={object.available ? object.name : "Find another clue to inspect this object"}
                onClick={() => setSelection({ caseId: scene.case_id, areaId: activeArea.id, objectId: object.id })}
              >
                {!object.available ? <LockKeyhole size={15} /> : object.examined ? <CheckCircle2 size={15} /> : <Search size={15} />}
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
          {activeArea.photo && photoStatus === "loaded" && (
            <div className="crime-scene-photo-caption">
              <span>Illustrative location photo. Markers are case objects, not photographic evidence.</span>
              <span>
                Photo by{" "}
                <a href={activeArea.photo.photographer_url} target="_blank" rel="noreferrer">
                  {activeArea.photo.photographer_name}
                </a>{" "}
                on{" "}
                <a href={activeArea.photo.photo_page_url} target="_blank" rel="noreferrer">Unsplash</a>
              </span>
            </div>
          )}
          <div className="crime-scene-object-list" aria-label={`${activeArea.name} objects`}>
            {activeArea.objects.map((object) => (
              <button
                type="button"
                key={object.id}
                className={object.id === selectedObjectId ? "selected" : ""}
                disabled={!object.available}
                onClick={() => setSelection({ caseId: scene.case_id, areaId: activeArea.id, objectId: object.id })}
              >
                {!object.available
                  ? <LockKeyhole size={15} />
                  : object.category === "document"
                    ? <FileText size={15} />
                    : object.examined
                      ? <CheckCircle2 size={15} />
                      : <Search size={15} />}
                <span>{object.name}</span>
                {object.evidence_status === "found" && <small>Evidence</small>}
              </button>
            ))}
          </div>
        </div>

        <aside className="crime-inspection-panel" aria-live="polite">
          {selectedObject ? (
            <>
              <div className="crime-inspection-title">
                <div>
                  <span>{activeArea.name}</span>
                  <h3>{selectedObject.name}</h3>
                </div>
                <button
                  type="button"
                  className="crime-object-zoom"
                  aria-label={`Zoom ${selectedObject.name} illustration`}
                  onClick={() => onZoom({
                    asset_type: "evidence",
                    theme_key: scene.scene_type,
                    motif: motifForObject(selectedObject.category),
                    name: selectedObject.name,
                  })}
                >
                  <ZoomIn size={17} />
                </button>
              </div>
              <p className="crime-object-description"><DictionaryText>{selectedObject.description}</DictionaryText></p>

              {selectedObject.category === "document" && (
                <article className="case-document crime-inspection-document">
                  <div className="document-masthead"><span>CASE DOCUMENT</span><span>{activeArea.name}</span></div>
                  <h3>{selectedObject.name}</h3>
                  <p><DictionaryText>{selectedObject.description}</DictionaryText></p>
                  {selectedObject.examined && <p><DictionaryText>{selectedObject.inspection_text}</DictionaryText></p>}
                  {selectedObject.closer_inspected && <p><DictionaryText>{selectedObject.closer_text}</DictionaryText></p>}
                </article>
              )}

              {selectedObject.examined && selectedObject.inspection_text && (
                <div className="crime-inspection-detail">
                  <span><BookOpen size={14} /> Inspection notes</span>
                  <p><DictionaryText>{selectedObject.inspection_text}</DictionaryText></p>
                </div>
              )}
              {selectedObject.closer_inspected && selectedObject.closer_text && (
                <div className={`crime-inspection-detail${selectedObject.evidence_status === "found" ? " evidence-found" : ""}`}>
                  <span>{selectedObject.evidence_status === "found" ? "Evidence found" : "Closer inspection"}</span>
                  <p><DictionaryText>{selectedObject.closer_text}</DictionaryText></p>
                </div>
              )}
              {!selectedObject.available && (
                <p className="crime-scene-locked-note">Find another piece of evidence before you inspect this object.</p>
              )}

              {!selectedObject.examined && selectedObject.available && (
                <button type="button" className="btn btn-primary crime-inspect-button" disabled={isInspecting} onClick={() => onInspect(selectedObject, "inspect")}>
                  <Search size={16} /> {isInspecting ? "Inspecting..." : "Inspect object"}
                </button>
              )}
              {selectedObject.examined && !selectedObject.closer_inspected && selectedObject.available && (
                <button type="button" className="btn btn-primary crime-inspect-button" disabled={isInspecting} onClick={() => onInspect(selectedObject, "closer")}>
                  <ZoomIn size={16} /> {isInspecting ? "Looking closer..." : "Inspect more closely"}
                </button>
              )}

              {selectedObject.evidence_status === "found" && recoveredClue && (
                <div className="crime-recovered-evidence">
                  <div className="crime-reward-banner" role="status">
                    <CheckCircle2 size={18} /> Evidence added to your case file
                  </div>
                  <ClueCard clue={recoveredClue} index={recoveredClue.discovery_order - 1} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onUseEvidence(recoveredClue)}>
                    Compare with a suspect
                  </button>
                </div>
              )}

              {selectedObject.closer_inspected && selectedObject.evidence_status === "none" && (
                <p className="crime-no-evidence">No evidence was found here. Keep looking around.</p>
              )}
              {actionMessage && <p className="crime-action-message" role="status">{actionMessage}</p>}
              {actionError && <p className="case-visual-alert" role="alert">{actionError}</p>}
            </>
          ) : (
            <div className="crime-inspection-empty">
              <Search size={24} />
              <h3>Inspect an object</h3>
              <p>Choose an object in {activeArea.name} to see what you can learn.</p>
            </div>
          )}
        </aside>
      </div>

      {scene.evidence.length > 0 && (
        <div className="crime-scene-collected">
          <h3>Evidence collected ({scene.evidence.length})</h3>
          <div className="crime-collected-evidence-list">
            {scene.evidence.map((evidence) => (
              <div key={evidence.id}>
                <CheckCircle2 size={15} />
                <span>{evidence.name}</span>
                <small>{evidence.discovery_location} · #{evidence.discovery_order}</small>
                {evidenceById.has(evidence.id) && <span className="sr-only">Important evidence</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
