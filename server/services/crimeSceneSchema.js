import { z } from "zod";

const clueIdSchema = z.string().regex(/^clue_[1-3]$/);
const normalizedText = (value) => String(value || "").toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const SceneObjectSchema = z.object({
  id: z.string().regex(/^object_[1-9]$/),
  name: z.string().trim().min(2).max(80),
  category: z.enum(["furniture", "document", "container", "personal_item", "fixture", "other"]),
  x: z.number().int().min(8).max(92),
  y: z.number().int().min(12).max(88),
  description: z.string().trim().min(12).max(240),
  inspection_text: z.string().trim().min(12).max(360),
  closer_text: z.string().trim().min(12).max(360),
  evidence_id: clueIdSchema.nullable(),
  requires_evidence_id: clueIdSchema.nullable(),
});

const SceneAreaSchema = z.object({
  id: z.string().regex(/^area_[1-3]$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(12).max(240),
  objects: z.array(SceneObjectSchema).length(3),
});

export const CrimeSceneSchema = z.object({
  name: z.string().trim().min(3).max(120),
  scene_type: z.enum(["mansion", "museum", "hotel", "school", "office", "cyberpunk", "classic"]),
  description: z.string().trim().min(20).max(600),
  areas: z.array(SceneAreaSchema).length(3),
});

export function validateSceneClueLinks(scene, clues) {
  if (!Array.isArray(scene?.areas) || !Array.isArray(clues)) return ["Scene data or clue list is missing."];
  const issues = [];
  const objects = scene.areas.flatMap((area) => area.objects);
  const linkedClueIds = objects.map(({ evidence_id }) => evidence_id).filter(Boolean);
  const requiredClueIds = objects.map(({ requires_evidence_id }) => requires_evidence_id).filter(Boolean);
  const expectedClueIds = clues.map(({ id }) => id);

  if (new Set(scene.areas.map(({ id }) => id)).size !== scene.areas.length) {
    issues.push("Scene areas must have unique identifiers.");
  }
  if (new Set(objects.map(({ id }) => id)).size !== objects.length) {
    issues.push("Scene objects must have unique identifiers.");
  }
  if (
    linkedClueIds.length !== expectedClueIds.length ||
    new Set(linkedClueIds).size !== linkedClueIds.length ||
    expectedClueIds.some((id) => !linkedClueIds.includes(id))
  ) {
    issues.push("Each case clue must be linked to exactly one scene object.");
  }
  if (!requiredClueIds.length) issues.push("At least one scene clue must require closer investigation.");
  const visibleText = normalizedText([
    scene.name,
    scene.description,
    ...scene.areas.flatMap((area) => [
      area.name,
      area.description,
      ...area.objects.flatMap((object) => [object.name, object.description]),
    ]),
  ].join(" "));
  for (const clue of clues) {
    const clueName = normalizedText(clue.name);
    if (clueName && ` ${visibleText} `.includes(` ${clueName} `)) {
      issues.push("Visible scene labels cannot reveal an exact evidence name.");
    }
  }

  const clueIds = new Set(expectedClueIds);
  const dependencyByClue = new Map();
  for (const object of objects) {
    if (object.requires_evidence_id && !clueIds.has(object.requires_evidence_id)) {
      issues.push("A scene object requires evidence that is not part of this case.");
    }
    if (object.evidence_id && object.requires_evidence_id === object.evidence_id) {
      issues.push("A scene clue cannot require itself.");
    }
    if (object.evidence_id && object.requires_evidence_id) {
      dependencyByClue.set(object.evidence_id, object.requires_evidence_id);
    }
  }

  for (const clueId of dependencyByClue.keys()) {
    const visited = new Set();
    let current = clueId;
    while (dependencyByClue.has(current)) {
      if (visited.has(current)) {
        issues.push("Scene clue requirements cannot form a cycle.");
        break;
      }
      visited.add(current);
      current = dependencyByClue.get(current);
    }
  }

  return issues;
}

export function validateSceneMatchesCase(scene, game) {
  if (!scene?.scene_type) return false;
  const context = `${game.title || ""} ${game.story || ""}`.toLocaleLowerCase();
  const themePatterns = [
    ["mansion", /\b(mansion|manor|estate|victorian|gothic|castle)\b/],
    ["museum", /\b(museum|gallery|exhibit|exhibition|artifact)\b/],
    ["hotel", /\b(hotel|inn|resort|suite|lobby|room service)\b/],
    ["school", /\b(school|classroom|campus|school hallway)\b/],
    ["office", /\b(office|workplace|boardroom|meeting room|office building)\b/],
    ["cyberpunk", /\b(cyberpunk|neon|android|robot|orbital|space station|data center)\b/],
  ];
  const matchingTheme = themePatterns.find(([, pattern]) => pattern.test(context))?.[0];
  return !matchingTheme || scene.scene_type === matchingTheme;
}

export function hasValidGeneratedScene(game) {
  if (!game?.crime_scene || !Array.isArray(game.clues)) return false;
  const parsed = CrimeSceneSchema.safeParse(game.crime_scene);
  return Boolean(
    parsed.success &&
    validateSceneClueLinks(parsed.data, game.clues).length === 0 &&
    validateSceneMatchesCase(parsed.data, game)
  );
}
