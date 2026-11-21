import { supabase } from "../config/supabase.js";

const BUCKET = process.env.SUPABASE_VISUAL_BUCKET || "case-visuals";
const themePatterns = [
  { key: "mansion", pattern: /\b(mansion|manor|estate|victorian|gothic|castle)\b/i },
  { key: "museum", pattern: /\b(museum|gallery|exhibit|exhibition|artifact|curator)\b/i },
  { key: "hotel", pattern: /\b(hotel|inn|resort|suite|lobby|room service)\b/i },
  { key: "cyberpunk", pattern: /\b(cyberpunk|neon|android|robot|orbital|space station|data center)\b/i },
];

const evidenceMotifs = [
  { key: "document", pattern: /\b(note|letter|document|log|record|report|schedule|diary|paper|receipt|contract|message)\b/i },
  { key: "key", pattern: /\b(key|keycard|badge|lock|access card)\b/i },
  { key: "fiber", pattern: /\b(fiber|thread|hair|fabric)\b/i },
  { key: "footprint", pattern: /\b(footprint|shoe|scuff|track)\b/i },
  { key: "glass", pattern: /\b(glass|vial|bottle|container|shard|flask)\b/i },
  { key: "timepiece", pattern: /\b(clock|watch|timestamp|time|timer|schedule)\b/i },
  { key: "jewelry", pattern: /\b(jewel|ring|necklace|diamond|ornament)\b/i },
];

const text = (value) => typeof value === "string" ? value : "";
const themeFor = (game) => {
  const context = [game.title, game.theme, game.story].map(text).join(" ");
  return themePatterns.find(({ pattern }) => pattern.test(context))?.key || "classic";
};

const motifFor = (clue) => {
  const context = [clue.name, clue.description, clue.type].map(text).join(" ");
  return evidenceMotifs.find(({ pattern }) => pattern.test(context))?.key || "evidence";
};

export function buildCaseVisualAssets(game) {
  const theme_key = themeFor(game);
  const title = text(game.title) || "Untitled case";
  const clues = Array.isArray(game.clues) ? game.clues : [];
  const suspects = Array.isArray(game.suspects) ? game.suspects : [];
  const sceneName = {
    mansion: "Manor interior",
    museum: "Exhibition gallery",
    hotel: "Hotel interior",
    cyberpunk: "Neon-lit facility",
    classic: "Investigation scene",
  }[theme_key];

  const scene = {
    id: `${game.id || "case"}:scene`,
    asset_key: "crime_scene_1",
    asset_type: "crime_scene",
    visual_kind: "location",
    theme_key,
    motif: theme_key,
    related_id: null,
    name: `${title} — ${sceneName}`,
    description: `Original ${sceneName.toLocaleLowerCase()} illustration selected from the case theme.`,
    case_connection: text(game.story).slice(0, 280),
    discovered_initially: true,
    status: "ready",
    image_url: null,
    sort_order: 0,
  };

  const evidence = clues.map((clue, index) => ({
    id: `${game.id || "case"}:evidence:${clue.id || index + 1}`,
    asset_key: `evidence_${clue.id || index + 1}`,
    asset_type: "evidence",
    visual_kind: "evidence",
    theme_key,
    motif: motifFor(clue),
    related_id: clue.id || null,
    name: text(clue.name) || `Evidence item ${index + 1}`,
    description: text(clue.description),
    case_connection: text(clue.relevance) || text(clue.description),
    discovered_initially: true,
    status: "ready",
    image_url: null,
    sort_order: index + 1,
  }));

  const suspectAssets = suspects.map((suspect, index) => ({
    id: `${game.id || "case"}:suspect:${suspect.id || index + 1}`,
    asset_key: `suspect_${suspect.id || index + 1}`,
    asset_type: "suspect",
    visual_kind: "suspect",
    theme_key,
    motif: `portrait_${index + 1}`,
    related_id: suspect.id || null,
    name: `${text(suspect.name) || `Suspect ${index + 1}`} — profile`,
    description: [suspect.role, suspect.age ? `Age ${suspect.age}` : ""].filter(Boolean).join(", "),
    case_connection: text(suspect.background) || text(suspect.statement),
    discovered_initially: true,
    status: "ready",
    image_url: null,
    sort_order: clues.length + index + 1,
  }));

  return [scene, ...evidence, ...suspectAssets];
}

export class CaseVisualService {
  async getAssets(game) {
    return {
      status: "complete",
      error: null,
      source: "local-library",
      assets: buildCaseVisualAssets(game),
    };
  }

  async getStoredPaths(gameId) {
    const { data, error } = await supabase.from("case_visual_assets").select("storage_path").eq("game_id", gameId).not("storage_path", "is", null);
    if (error) {
      console.error("[CaseVisualService] Could not list files for case cleanup.", { gameId, code: error.code || "database error" });
      return [];
    }
    return (data || []).map(({ storage_path }) => storage_path).filter(Boolean);
  }

  async removeStoredFiles(paths, gameId) {
    if (!paths.length) return;
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.error("[CaseVisualService] Storage cleanup failed after case deletion.", { gameId, code: error.name || "storage error" });
  }
}

export const caseVisualService = new CaseVisualService();
