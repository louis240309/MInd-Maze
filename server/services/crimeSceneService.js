import { supabase } from "../config/supabase.js";
import { hasValidGeneratedScene } from "./crimeSceneSchema.js";

const tableName = "game_scene_discoveries";

const legacySceneTemplates = {
  mansion: { name: "Manor rooms", areas: ["Entrance Hall", "Private Study", "Garden Room"] },
  museum: { name: "Museum galleries", areas: ["Main Gallery", "Records Room", "Front Hall"] },
  hotel: { name: "Hotel rooms", areas: ["Guest Room", "Service Hall", "Front Desk"] },
  school: { name: "School rooms", areas: ["Classroom", "Library", "Main Hall"] },
  office: { name: "Office rooms", areas: ["Work Area", "Meeting Room", "Front Desk"] },
  cyberpunk: { name: "City facility", areas: ["Control Room", "Server Hall", "Entry Bay"] },
  classic: { name: "Case locations", areas: ["Main Room", "Side Room", "Entry Hall"] },
};

const legacyObjectTemplates = [
  { name: "Desk", category: "furniture", description: "A work surface stands near the wall.", inspection_text: "The desk is clear. No case evidence is stored here.", closer_text: "A closer look finds only ordinary wear." },
  { name: "Chair", category: "furniture", description: "A chair sits beside the main furniture.", inspection_text: "The chair is steady and in its usual place.", closer_text: "You find no useful mark on the chair." },
  { name: "Wall clock", category: "fixture", description: "A clock hangs where it can be seen.", inspection_text: "The clock shows the room's general setting.", closer_text: "The clock gives no extra case detail." },
  { name: "Storage cabinet", category: "container", description: "A cabinet holds everyday items.", inspection_text: "The cabinet contains routine supplies.", closer_text: "Nothing in the cabinet connects to this case." },
  { name: "Notice board", category: "document", description: "A board displays ordinary notices.", inspection_text: "The notices provide background about this location.", closer_text: "No new case information appears on the board." },
  { name: "Door", category: "fixture", description: "A door connects this room to the next area.", inspection_text: "The door opens and closes normally.", closer_text: "There are no useful marks around the door." },
  { name: "Bookshelf", category: "furniture", description: "A shelf holds books and reference papers.", inspection_text: "The titles fit the room's purpose.", closer_text: "No book appears connected to this case." },
  { name: "Side table", category: "furniture", description: "A small table stands near the wall.", inspection_text: "The table holds only ordinary items.", closer_text: "A closer look reveals no useful evidence." },
  { name: "Window", category: "fixture", description: "A window looks out over the surrounding area.", inspection_text: "The window gives a view of the location.", closer_text: "The window shows no sign linked to this case." },
];

const themePatterns = [
  ["mansion", /\b(mansion|manor|estate|victorian|gothic|castle)\b/i],
  ["museum", /\b(museum|gallery|exhibit|exhibition|artifact|curator)\b/i],
  ["hotel", /\b(hotel|inn|resort|suite|lobby|room service)\b/i],
  ["school", /\b(school|classroom|teacher|student|campus|principal)\b/i],
  ["office", /\b(office|workplace|boardroom|meeting room|company|executive)\b/i],
  ["cyberpunk", /\b(cyberpunk|neon|android|robot|orbital|space station|data center)\b/i],
];

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const orderedEvidence = (discoveries) => [...discoveries]
  .filter(({ evidence_id }) => evidence_id)
  .sort((a, b) => {
    const timeDifference = Date.parse(a.evidence_discovered_at) - Date.parse(b.evidence_discovered_at);
    return timeDifference || String(a.object_id).localeCompare(String(b.object_id));
  });

export function buildLegacyCrimeScene(game) {
  const context = `${game?.title || ""} ${game?.story || ""}`;
  const sceneType = themePatterns.find(([, pattern]) => pattern.test(context))?.[0] || "classic";
  const template = legacySceneTemplates[sceneType];

  return {
    name: template.name,
    scene_type: sceneType,
    description: "This older case has no generated scene evidence. Explore for background details, and use the case clues in the evidence gallery.",
    areas: template.areas.map((name, areaIndex) => ({
      id: `area_${areaIndex + 1}`,
      name,
      description: `${name} is part of the location described in this case.`,
      objects: legacyObjectTemplates.slice(areaIndex * 3, areaIndex * 3 + 3).map((object, objectIndex) => ({
        ...object,
        id: `legacy_object_${areaIndex * 3 + objectIndex + 1}`,
        x: [24, 50, 76][objectIndex],
        y: [36, 67, 45][objectIndex],
        evidence_id: null,
        requires_evidence_id: null,
      })),
    })),
  };
}

export class CrimeSceneService {
  constructor(database = supabase) {
    this.database = database;
  }

  async _getDiscoveries(gameId, userId) {
    const { data, error } = await this.database
      .from(tableName)
      .select("object_id, evidence_id, examined_at, closer_inspected_at, evidence_discovered_at")
      .eq("game_id", gameId)
      .eq("user_id", userId);

    if (error) {
      console.error("[CrimeSceneService] Could not load scene progress.", { gameId, code: error.code || "database error" });
      throw makeError("Could not load crime scene progress. Please try again.", 503);
    }
    return data || [];
  }

  async getDiscoveredEvidenceByGameIds(gameIds, userId) {
    const ids = [...new Set(gameIds)].filter(Boolean);
    if (!ids.length) return new Map();

    const { data, error } = await this.database
      .from(tableName)
      .select("game_id, evidence_id, object_id, examined_at, closer_inspected_at, evidence_discovered_at")
      .eq("user_id", userId)
      .in("game_id", ids)
      .not("evidence_id", "is", null);

    if (error) {
      console.error("[CrimeSceneService] Could not load collected evidence.", { code: error.code || "database error" });
      throw makeError("Could not load case evidence. Please try again.", 503);
    }

    const byGameId = new Map(ids.map((id) => [id, []]));
    for (const row of data || []) byGameId.get(row.game_id)?.push(row);
    return byGameId;
  }

  _sceneForGame(game) {
    if (hasValidGeneratedScene(game)) return { scene: game.crime_scene, isLegacy: false };
    if (game?.crime_scene) {
      console.error("[CrimeSceneService] Invalid saved scene; using the legacy scene fallback.", { gameId: game.id });
    }
    return { scene: buildLegacyCrimeScene(game), isLegacy: true };
  }

  _formatScene(game, scene, discoveries, isLegacy) {
    const discoveredEvidenceIds = new Set(discoveries.map(({ evidence_id }) => evidence_id).filter(Boolean));
    const objectIds = new Set(scene.areas.flatMap((area) => area.objects.map(({ id }) => id)));
    const examinedObjectIds = new Set(
      discoveries.filter(({ examined_at, object_id }) => examined_at && objectIds.has(object_id)).map(({ object_id }) => object_id)
    );
    const closerObjectIds = new Set(
      discoveries.filter(({ closer_inspected_at, object_id }) => closer_inspected_at && objectIds.has(object_id)).map(({ object_id }) => object_id)
    );
    const evidenceRows = orderedEvidence(discoveries);
    const clueById = new Map((game.clues || []).map((clue) => [clue.id, clue]));
    const suspects = Array.isArray(game.suspects) ? game.suspects : [];
    const areaNameByObject = new Map(scene.areas.flatMap((area) => area.objects.map(({ id }) => [id, area.name])));
    const collectedEvidence = evidenceRows.flatMap((row, index) => {
      const clue = clueById.get(row.evidence_id);
      return clue ? [{
        ...clue,
        important: true,
        related_suspects: suspects
          .filter((suspect) => suspect.name && `${clue.name} ${clue.description} ${clue.relevance}`.toLocaleLowerCase().includes(suspect.name.toLocaleLowerCase()))
          .map(({ id, name }) => ({ id, name })),
        discovery_location: areaNameByObject.get(row.object_id) || "Crime scene",
        discovery_order: index + 1,
        discovered_at: row.evidence_discovered_at,
      }] : [];
    });

    const formattedAreas = scene.areas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      objects: area.objects.map((object) => {
        const row = discoveries.find(({ object_id }) => object_id === object.id);
        const available = isLegacy || !object.requires_evidence_id || discoveredEvidenceIds.has(object.requires_evidence_id);
        const evidenceCollected = Boolean(row?.evidence_id);
        return {
          id: object.id,
          name: object.name,
          category: object.category,
          x: object.x,
          y: object.y,
          description: object.description,
          ...(examinedObjectIds.has(object.id) ? { inspection_text: object.inspection_text } : {}),
          ...(closerObjectIds.has(object.id) ? { closer_text: object.closer_text } : {}),
          ...(evidenceCollected ? { evidence_id: row.evidence_id } : {}),
          available,
          examined: examinedObjectIds.has(object.id),
          closer_inspected: closerObjectIds.has(object.id),
          evidence_status: evidenceCollected ? "found" : closerObjectIds.has(object.id) ? "none" : "unknown",
        };
      }),
    }));

    return {
      case_id: game.id,
      name: scene.name,
      scene_type: scene.scene_type,
      description: scene.description,
      is_legacy: isLegacy,
      areas: formattedAreas,
      progress: {
        objects_examined: examinedObjectIds.size,
        total_objects: objectIds.size,
        evidence_discovered: collectedEvidence.length,
        total_evidence: isLegacy ? 0 : (game.clues || []).length,
        locations_explored: formattedAreas.filter((area) => area.objects.some(({ examined }) => examined)).length,
        total_locations: formattedAreas.length,
      },
      evidence: collectedEvidence,
    };
  }

  async getScene(game, userId) {
    const { scene, isLegacy } = this._sceneForGame(game);
    const discoveries = await this._getDiscoveries(game.id, userId);
    return this._formatScene(game, scene, discoveries, isLegacy);
  }

  async inspectObject(game, userId, objectId, action) {
    const { scene, isLegacy } = this._sceneForGame(game);
    const object = scene.areas.flatMap((area) => area.objects).find(({ id }) => id === objectId);
    if (!object) throw makeError("That object is not part of this crime scene.", 404);

    const discoveries = await this._getDiscoveries(game.id, userId);
    const knownEvidenceIds = new Set(discoveries.map(({ evidence_id }) => evidence_id).filter(Boolean));
    if (!isLegacy && object.requires_evidence_id && !knownEvidenceIds.has(object.requires_evidence_id)) {
      throw makeError("Find another piece of evidence before inspecting this object more closely.", 409);
    }

    const existing = discoveries.find(({ object_id }) => object_id === objectId);
    let updatedDiscoveries = discoveries;
    if (action === "inspect") {
      if (!existing) {
        const examinedAt = new Date().toISOString();
        const { error } = await this.database.from(tableName).upsert({
          game_id: game.id,
          user_id: userId,
          object_id: object.id,
          examined_at: examinedAt,
        }, { onConflict: "game_id,object_id", ignoreDuplicates: true });

        if (error) {
          console.error("[CrimeSceneService] Could not save object inspection.", { gameId: game.id, objectId, code: error.code || "database error" });
          throw makeError("Could not save this inspection. Please try again.", 503);
        }
        updatedDiscoveries = [...discoveries, {
          object_id: object.id,
          evidence_id: null,
          examined_at: examinedAt,
          closer_inspected_at: null,
          evidence_discovered_at: null,
        }];
      }
    } else {
      if (!existing?.examined_at) {
        throw makeError("Inspect the object before looking more closely.", 400);
      }

      if (!existing.closer_inspected_at || (object.evidence_id && !existing.evidence_id)) {
        const now = new Date().toISOString();
        const update = {
          closer_inspected_at: existing.closer_inspected_at || now,
          ...(object.evidence_id && !existing.evidence_id
            ? { evidence_id: object.evidence_id, evidence_discovered_at: now }
            : {}),
        };
        const { error } = await this.database
          .from(tableName)
          .update(update)
          .eq("game_id", game.id)
          .eq("user_id", userId)
          .eq("object_id", objectId);

        if (error) {
          console.error("[CrimeSceneService] Could not save closer inspection.", { gameId: game.id, objectId, code: error.code || "database error" });
          throw makeError("Could not save this inspection. Please try again.", 503);
        }
        updatedDiscoveries = discoveries.map((row) => row.object_id === objectId ? { ...row, ...update } : row);
      }
    }

    const formatted = this._formatScene(game, scene, updatedDiscoveries, isLegacy);
    const publicObject = formatted.areas.flatMap((area) => area.objects).find(({ id }) => id === objectId);
    const clue = object.evidence_id
      ? formatted.evidence.find(({ id }) => id === object.evidence_id) || null
      : null;

    return {
      scene: formatted,
      object: publicObject,
      detail: action === "inspect" ? object.inspection_text : object.closer_text,
      evidence: clue,
      message: clue
        ? existing?.evidence_id ? "You already collected this evidence." : "Evidence added to your case file."
        : action === "closer" ? "You found no new evidence here." : "",
    };
  }
}

export const crimeSceneService = new CrimeSceneService();
