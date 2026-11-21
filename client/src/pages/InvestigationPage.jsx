import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { SuspectCard } from "../components/SuspectCard";
import { ClueCard } from "../components/ClueCard";
import { HintSystem } from "../components/HintSystem";
import { AccusationConsole } from "../components/AccusationConsole";
import { StatusBadge } from "../components/StatusBadge";
import { DifficultyBadge } from "../components/DifficultyBadge";
import { CaseVisualPlaceholder } from "../components/CaseVisualPlaceholder";
import { CaseDocuments } from "../components/CaseDocuments";
import { CrimeSceneExplorer } from "../components/CrimeSceneExplorer";
import { EvidenceQuestionPanel } from "../components/EvidenceQuestionPanel";
import { DictionaryButton, DictionaryProvider, DictionaryText } from "../components/DetectiveDictionary";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  FileText,
  Users,
  Search,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

const CASE_TABS = ["Overview", "Crime Scene", "Evidence Gallery", "Suspects", "Investigation Board", "Case Documents"];
const CLIENT_THEME_PATTERNS = [
  ["mansion", /\b(mansion|manor|estate|victorian|gothic|castle)\b/i],
  ["museum", /\b(museum|gallery|exhibit|exhibition|artifact|curator)\b/i],
  ["hotel", /\b(hotel|inn|resort|suite|lobby|room service)\b/i],
  ["school", /\b(school|classroom|teacher|student|campus|principal)\b/i],
  ["office", /\b(office|workplace|boardroom|meeting room|company|executive)\b/i],
  ["cyberpunk", /\b(cyberpunk|neon|android|robot|orbital|space station|data center)\b/i],
];
const CLIENT_EVIDENCE_PATTERNS = [
  ["document", /\b(note|letter|document|log|record|report|schedule|diary|paper|receipt|contract|message)\b/i],
  ["key", /\b(key|keycard|badge|lock|access card)\b/i],
  ["fiber", /\b(fiber|thread|hair|fabric)\b/i],
  ["footprint", /\b(footprint|shoe|scuff|track)\b/i],
  ["glass", /\b(glass|vial|bottle|container|shard|flask)\b/i],
  ["timepiece", /\b(clock|watch|timestamp|time|timer)\b/i],
  ["jewelry", /\b(jewel|ring|necklace|diamond|ornament)\b/i],
];

const evidenceMotifFor = (clue) => CLIENT_EVIDENCE_PATTERNS
  .find(([, pattern]) => pattern.test(`${clue.name || ""} ${clue.description || ""} ${clue.type || ""}`))?.[0] || "evidence";

const fallbackVisualAssets = (game) => {
  const context = `${game.title || ""} ${game.story || ""}`;
  const themeKey = CLIENT_THEME_PATTERNS.find(([, pattern]) => pattern.test(context))?.[0] || "classic";
  const clues = Array.isArray(game.clues) ? game.clues : [];
  const suspects = Array.isArray(game.suspects) ? game.suspects : [];
  return [
    { id: "local:scene", asset_type: "crime_scene", theme_key: themeKey, motif: themeKey, name: `${game.title} — case location` },
    ...clues.map((clue, index) => ({
      id: `local:evidence:${index}`,
      asset_type: "evidence",
      theme_key: themeKey,
      motif: evidenceMotifFor(clue),
      related_id: clue.id || null,
      asset_key: `evidence_${clue.id || index + 1}`,
      name: clue.name,
    })),
    ...suspects.map((suspect, index) => ({
      id: `local:suspect:${index}`,
      asset_type: "suspect",
      theme_key: themeKey,
      motif: `portrait_${index + 1}`,
      related_id: suspect.id || null,
      asset_key: `suspect_${suspect.id || index + 1}`,
      name: suspect.name,
    })),
  ];
};

const VisualImage = ({ asset, onOpen }) => {
  return (
    <button
      type="button"
      onClick={() => onOpen(asset)}
      className="case-visual-image"
      aria-label={`Zoom ${asset.name} illustration`}
    >
      <CaseVisualPlaceholder
        type={asset.asset_type}
        themeKey={asset.theme_key}
        motif={asset.motif}
      />
    </button>
  );
};

const EmptyVisualState = ({ text }) => <div className="case-visual-empty"><ImageIcon size={28} /><p>{text}</p></div>;

export const InvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [visuals, setVisuals] = useState({ status: "not_started", error: null, assets: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [crimeScene, setCrimeScene] = useState(null);
  const [isLoadingScene, setIsLoadingScene] = useState(true);
  const [sceneError, setSceneError] = useState("");
  const [sceneActionError, setSceneActionError] = useState("");
  const [sceneActionMessage, setSceneActionMessage] = useState("");
  const [isInspectingScene, setIsInspectingScene] = useState(false);
  const [questionEvidenceId, setQuestionEvidenceId] = useState("");

  // Edit title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // Selection & Deduction State
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [isSubmittingSolve, setIsSubmittingSolve] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Hint State
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Fetch Game Dossier
  const fetchGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(`/games/${id}`);
      if (response.data.success && response.data.game) {
        setGame(response.data.game);
        setTitleInput(response.data.game.title);
      }
    } catch (err) {
      console.error("[InvestigationPage] Fetch error:", err);
      setError(
        err.response?.data?.message || "Could not load this mystery."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const fetchVisuals = useCallback(async () => {
    try {
      const response = await api.get(`/games/${id}/visuals`);
      setVisuals(response.data.visuals);
      return response.data.visuals?.status;
    } catch (err) {
      setVisuals((previous) => ({
        ...previous,
        error: err.response?.data?.message || "Visual case files are not available yet.",
      }));
      return "error";
    }
  }, [id]);

  useEffect(() => {
    fetchVisuals();
  }, [fetchVisuals]);

  const fetchCrimeScene = useCallback(async () => {
    try {
      setIsLoadingScene(true);
      setSceneError("");
      const response = await api.get(`/games/${id}/scene`);
      setCrimeScene(response.data.scene);
    } catch (err) {
      setSceneError(err.response?.data?.message || "Could not load this crime scene.");
    } finally {
      setIsLoadingScene(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCrimeScene();
  }, [fetchCrimeScene]);

  const handleInspectSceneObject = async (object, action) => {
    if (isInspectingScene) return;
    try {
      setIsInspectingScene(true);
      setSceneActionError("");
      setSceneActionMessage("");
      const response = await api.post(`/games/${id}/scene/inspect`, {
        object_id: object.id,
        action,
      });
      setCrimeScene(response.data.scene);
      setSceneActionMessage(response.data.message || "");
      if (response.data.evidence) {
        setGame((previous) => ({
          ...previous,
          clues: Array.from(new Map([
            ...(previous?.clues || []),
            response.data.evidence,
          ].map((clue) => [clue.id, clue])).values()),
        }));
        await fetchVisuals();
      }
    } catch (err) {
      setSceneActionError(err.response?.data?.message || "Could not inspect this object. Please try again.");
    } finally {
      setIsInspectingScene(false);
    }
  };

  const handleUseEvidence = (clue) => {
    setQuestionEvidenceId(clue.id);
    setActiveTab("Suspects");
  };

  // Request Hint Handler
  const handleRequestHint = async () => {
    if (!game || isLoadingHint) return;
    try {
      setIsLoadingHint(true);
      const res = await api.post(`/games/${id}/hint`);
      if (res.data.success) {
        setGame((prev) => ({
          ...prev,
          hint_count: res.data.hint_count,
          hints: res.data.unlocked_hints,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not get a hint.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit Accusation Handler
  const handleSubmitGuess = async ({ suspect_id, suspect_name }) => {
    if (!game || isSubmittingSolve) return;
    try {
      setIsSubmittingSolve(true);
      setEvaluationResult(null);

      const res = await api.post(`/games/${id}/solve`, {
        suspect_id,
        suspect_name,
      });

      setEvaluationResult(res.data);

      if (res.data.correct) {
        // Update game to solved and show solution
        setGame((prev) => ({
          ...prev,
          status: "solved",
          solution: res.data.solution,
          points_earned: res.data.points_earned || 0,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not check your guess.");
    } finally {
      setIsSubmittingSolve(false);
    }
  };

  // Archive / Restore Handler
  const handleToggleArchive = async () => {
    if (!game) return;
    const nextStatus = game.status === "archived" ? "active" : "archived";
    try {
      const res = await api.put(`/games/${id}`, { status: nextStatus });
      if (res.data.success) {
        setGame((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete Case Handler
  const handleDeleteCase = async () => {
    if (!window.confirm("Delete this mystery and all your progress? This cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/games/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to delete case: " + (err.response?.data?.message || err.message));
    }
  };

  // Save Title Edit
  const handleSaveTitle = async (e) => {
    e.preventDefault();
    if (!titleInput.trim() || titleInput.trim() === game.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await api.put(`/games/${id}`, { title: titleInput.trim() });
      if (res.data.success) {
        setGame((prev) => ({ ...prev, title: titleInput.trim() }));
      }
    } catch (err) {
      alert("Failed to update title: " + (err.response?.data?.message || err.message));
    } finally {
      setIsEditingTitle(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "var(--accent-purple)",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading mystery...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "540px" }}>
          <div
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "14px",
              padding: "36px",
            }}
          >
            <AlertCircle size={40} color="#f43f5e" style={{ margin: "0 auto 16px auto" }} />
            <h3 style={{ color: "#fff", marginBottom: "10px" }}>
              Mystery Not Found
            </h3>
            <p style={{ color: "#fda4af", fontSize: "0.95rem", marginBottom: "24px" }}>
              {error || "We could not find this mystery."}
            </p>
            <Link to="/dashboard" className="btn btn-secondary">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const caseClues = Array.from(new Map([
    ...(game.clues || []),
    ...(crimeScene?.evidence || []),
  ].map((clue) => [clue.id, clue])).values());
  const localVisualAssets = fallbackVisualAssets({ ...game, clues: caseClues });
  const caseVisualAssets = visuals.assets.length
    ? [
      ...visuals.assets,
      ...localVisualAssets.filter((asset) =>
        asset.asset_type === "evidence" &&
        !visuals.assets.some((saved) => saved.asset_type === "evidence" && saved.related_id === asset.related_id)
      ),
    ]
    : localVisualAssets;
  const isSolved = game.status === "solved";
  const isArchived = game.status === "archived";
  const culpritId = isSolved
    ? game.solution?.match(/^Guilty suspect:\s*(suspect_[123])\s*[-—–:]/i)?.[1]
    : null;

  return (
    <DictionaryProvider gameId={id}>
    <div style={{ padding: "30px 0 90px 0" }}>
      <div className="container">
        {/* Navigation Breadcrumb & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <Link
            to="/dashboard"
            className="btn btn-ghost btn-sm"
            style={{ gap: "6px", color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div style={{ display: "flex", gap: "8px" }}>
            <DictionaryButton />
            <button
              onClick={handleToggleArchive}
              className="btn btn-secondary btn-sm"
              title={isArchived ? "Restore to Active" : "Archive Case"}
            >
              <Archive size={14} /> {isArchived ? "Restore Case" : "Archive"}
            </button>
            <button
              onClick={handleDeleteCase}
              className="btn btn-danger btn-sm"
              title="Delete Case"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Dossier Banner Card */}
        <div
          className="card"
          style={{
            backgroundColor: "rgba(13, 17, 26, 0.9)",
            borderColor: isSolved ? "#10b981" : "var(--border-glow)",
            padding: "30px",
            marginBottom: "32px",
            boxShadow: isSolved
              ? "0 10px 30px rgba(16, 185, 129, 0.15)"
              : "0 10px 30px rgba(0, 0, 0, 0.5), var(--shadow-glow-purple)",
          }}
        >
          {/* Metadata Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <StatusBadge status={game.status} />
              <DifficultyBadge difficulty={game.difficulty} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-dim)" }}>
              <Calendar size={14} />
              <span>
                Opened:{" "}
                {new Date(game.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Title & Edit */}
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="form-input"
                style={{ fontSize: "1.4rem", fontWeight: 700 }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleInput(game.title);
                  setIsEditingTitle(false);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", margin: 0, color: "#fff" }}>
                {game.title}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "6px", color: "var(--text-dim)" }}
                title="Edit Mystery Title"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}

          {/* Crime Scene Incident Narrative */}
          <div
            style={{
              backgroundColor: "rgba(19, 24, 38, 0.7)",
              border: "1px solid var(--border-dark)",
              borderLeft: "4px solid var(--accent-purple)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--accent-purple)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "8px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <FileText size={14} /> THE STORY
            </div>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-main)",
                lineHeight: "1.7",
                whiteSpace: "pre-line",
              }}
            >
              <DictionaryText>{game.story}</DictionaryText>
            </p>
          </div>
        </div>

        <nav className="case-file-tabs" aria-label="Investigation file sections">
          {CASE_TABS.map((tab) => <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </nav>

        {activeTab === "Overview" && <>
        {/* SECTION 1: THE THREE SUSPECTS */}
        <section style={{ marginBottom: "40px" }}>
          <h2 className="case-section-title"><Users size={22} color="var(--accent-cyan)" /> Case summary</h2>
          <p style={{ color: "var(--text-muted)" }}>Review the narrative, evidence, and profiles in their dedicated tabs.</p>
        </section>
        <section style={{ marginBottom: "40px" }}>
          <HintSystem
            hints={game.hints || []}
            hintCount={game.hint_count || 0}
            maxHints={3}
            onRequestHint={handleRequestHint}
            isLoadingHint={isLoadingHint}
            isSolved={isSolved}
          />
        </section>
        <section>
          <AccusationConsole
            suspects={game.suspects || []}
            selectedSuspectId={selectedSuspectId}
            onSelectSuspect={(suspectId) => setSelectedSuspectId(suspectId)}
            onSubmitGuess={handleSubmitGuess}
            isSubmitting={isSubmittingSolve}
            evaluationResult={evaluationResult}
            solution={game.solution}
            pointsEarned={game.points_earned || 0}
            isSolved={isSolved}
          />
        </section>
        </>}

        {activeTab === "Crime Scene" && <section className="case-file-panel">
          <h2 className="case-section-title"><Camera size={22} /> Crime scene exploration</h2>
          <CrimeSceneExplorer
            scene={crimeScene}
            isLoading={isLoadingScene}
            error={sceneError}
            isInspecting={isInspectingScene}
            actionMessage={sceneActionMessage}
            actionError={sceneActionError}
            onInspect={handleInspectSceneObject}
            onZoom={setSelectedImage}
            onUseEvidence={handleUseEvidence}
          />
        </section>}

        {activeTab === "Evidence Gallery" && <section className="case-file-panel">
          <h2 className="case-section-title"><Search size={22} /> Evidence gallery</h2>
          <p className="case-file-caption">Collected evidence appears here. Compare each item with the suspects&apos; statements.</p>
          {visuals.error && <p className="case-visual-alert" role="status">{visuals.error}</p>}
          {caseClues.length ? <div className="case-visual-grid">{caseClues.map((clue, index) => { const asset = caseVisualAssets.find((item) => item.asset_type === "evidence" && (item.related_id === clue.id || item.asset_key === `evidence_${clue.id || index + 1}`)); return <article className="case-evidence-file" key={clue.id || index}><VisualImage asset={asset || { name: clue.name, status: "ready", asset_type: "evidence", theme_key: caseVisualAssets[0]?.theme_key || "classic", motif: evidenceMotifFor(clue) }} onOpen={setSelectedImage} /><span className="evidence-stamp">{asset?.asset_key || `evidence_${clue.id || index + 1}`}</span>{clue.discovery_order && <small className="evidence-discovery">Found at {clue.discovery_location || "the scene"} · #{clue.discovery_order}</small>}<ClueCard clue={clue} index={index} /></article>; })}</div> : <EmptyVisualState text="No evidence has been collected yet. Explore the crime scene to find clues." />}
        </section>}

        {activeTab === "Suspects" && <>
        {/* SECTION 1: THE THREE SUSPECTS */}
        <section style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Users size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.45rem", margin: 0 }}>
              The Suspects (3)
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px" }}>
            Read each person's reason, their story, and what they said.
            {!isSolved && " Choose a suspect to make your guess."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {(game.suspects || []).map((suspect, index) => {
              const isGuilty = suspect.id === culpritId;
              const portrait = caseVisualAssets.find((asset) => asset.asset_type === "suspect" && (asset.related_id === suspect.id || asset.asset_key === `suspect_${suspect.id || index + 1}`));

              return (
                <SuspectCard
                  key={suspect.id}
                  suspect={suspect}
                  isSelected={selectedSuspectId === suspect.id}
                  onSelect={() => setSelectedSuspectId(suspect.id)}
                  isSolved={isSolved}
                  isGuilty={isGuilty}
                  imageAsset={portrait}
                />
              );
            })}
          </div>
        </section>
        <EvidenceQuestionPanel
          key={questionEvidenceId || "evidence-question"}
          suspects={game.suspects || []}
          evidence={caseClues}
          initialEvidenceId={questionEvidenceId}
        />

        </>}

        {activeTab === "Investigation Board" && <section className="case-file-panel">
          <h2 className="case-section-title"><FileText size={22} /> Investigation board</h2>
          <p className="case-file-caption">Compare the scene, suspects, and clues. You decide how they connect.</p>
          {visuals.error && <p className="case-visual-alert" role="status">{visuals.error}</p>}
          {(caseVisualAssets.length || game.suspects?.length || caseClues.length) ? <div className="case-board">
            {(caseVisualAssets.filter((asset) => asset.asset_type === "crime_scene")).map((asset) => <article className="case-board-card scene" key={asset.id}><VisualImage asset={asset} onOpen={setSelectedImage} /><h3>{asset.name}</h3></article>)}
            {(game.suspects || []).map((suspect, index) => { const portrait = caseVisualAssets.find((asset) => asset.asset_type === "suspect" && (asset.related_id === suspect.id || asset.asset_key === `suspect_${suspect.id || index + 1}`)); return <article className="case-board-card" key={suspect.id || index}><VisualImage asset={portrait || { name: suspect.name, status: "ready", asset_type: "suspect", theme_key: caseVisualAssets[0]?.theme_key || "classic", motif: `portrait_${index + 1}` }} onOpen={setSelectedImage} /><h3>{suspect.name}</h3><p>{suspect.role}</p></article>; })}
            {caseClues.map((clue, index) => { const photo = caseVisualAssets.find((asset) => asset.asset_type === "evidence" && (asset.related_id === clue.id || asset.asset_key === `evidence_${clue.id || index + 1}`)); return <article className="case-board-card evidence" key={clue.id || index}><VisualImage asset={photo || { name: clue.name, status: "ready", asset_type: "evidence", theme_key: caseVisualAssets[0]?.theme_key || "classic", motif: evidenceMotifFor(clue) }} onOpen={setSelectedImage} /><h3>{clue.name}</h3><p>{clue.description}</p></article>; })}
          </div> : <EmptyVisualState text="Your board will fill as the case file is prepared." />}
        </section>}

        {activeTab === "Case Documents" && <CaseDocuments game={{ ...game, clues: caseClues }} />}

        {selectedImage && <div className="case-image-lightbox" role="dialog" aria-modal="true" aria-label={selectedImage.name} onClick={() => setSelectedImage(null)}><button type="button" className="case-lightbox-close" onClick={() => setSelectedImage(null)} aria-label="Close image">×</button><div className="case-image-lightbox-art" onClick={(event) => event.stopPropagation()}><CaseVisualPlaceholder type={selectedImage.asset_type} themeKey={selectedImage.theme_key} motif={selectedImage.motif} /></div><p>{selectedImage.name}</p></div>}

      </div>
    </div>
    </DictionaryProvider>
  );
};
