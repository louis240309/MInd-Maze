import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ||= "test-service-key";

const { CrimeSceneSchema, validateSceneClueLinks } = await import("./crimeSceneSchema.js");
const { CrimeSceneService, buildLegacyCrimeScene } = await import("./crimeSceneService.js");
const { GameService } = await import("./gameService.js");

const clues = [
  { id: "clue_1", name: "Blue thread", type: "physical", description: "A blue thread was caught on the display case.", relevance: "It matches Ada Vale's coat near the room." },
  { id: "clue_2", name: "Door log", type: "document", description: "The door log shows a late entry at nine.", relevance: "It does not match one person's story." },
  { id: "clue_3", name: "Dust mark", type: "forensic", description: "A clean mark shows where the painting hung.", relevance: "It confirms the painting was removed that night." },
];

const object = (id, name, extra = {}) => ({
  id: `object_${id}`,
  name,
  category: "other",
  x: [24, 50, 76][(id - 1) % 3],
  y: [36, 67, 45][(id - 1) % 3],
  description: `${name} stands in the room as part of the scene.`,
  inspection_text: `You examine the ${name.toLocaleLowerCase()} and note its place.`,
  closer_text: `A closer look at the ${name.toLocaleLowerCase()} reveals no new detail.`,
  evidence_id: null,
  requires_evidence_id: null,
  ...extra,
});

const scene = {
  name: "Museum gallery",
  scene_type: "museum",
  description: "Three areas in the museum match the case story and its evidence.",
  areas: [
    { id: "area_1", name: "Main gallery", description: "The gallery holds the display and nearby seating.", objects: [
      object(1, "Display case", { evidence_id: "clue_1" }),
      object(2, "Entry book", { category: "document", evidence_id: "clue_2" }),
      object(3, "Visitor chair"),
    ] },
    { id: "area_2", name: "Records room", description: "The records room connects to the gallery.", objects: [
      object(4, "Storage cabinet"),
      object(5, "Wall clock"),
      object(6, "Notice board"),
    ] },
    { id: "area_3", name: "Back gallery", description: "The back gallery is part of the same museum.", objects: [
      object(7, "Side table"),
      object(8, "Display floor", { evidence_id: "clue_3", requires_evidence_id: "clue_1" }),
      object(9, "Window"),
    ] },
  ],
};

const makeGame = (crimeScene = scene) => ({
  id: "case-1",
  user_id: "user-1",
  title: "The Museum Theft",
  difficulty: "medium",
  story: "At the museum, a painting went missing after closing time. The entry book recorded a late visit.",
  suspects: [{ id: "suspect_1", name: "Ada Vale", role: "Gallery guide" }],
  clues,
  crime_scene: crimeScene,
  hints: [],
  solution: "Guilty suspect: suspect_1 — Ada Vale. The clues match the case.",
  hint_count: 0,
  status: "active",
  created_at: "2026-11-21T00:00:00.000Z",
  updated_at: "2026-11-21T00:00:00.000Z",
});

const makeDatabase = () => {
  const rows = [];
  return {
    rows,
    from() {
      let action = "select";
      let values = null;
      const filters = [];
      const query = {
        select() { action = "select"; return this; },
        eq(column, value) { filters.push((row) => row[column] === value); return this; },
        in(column, valuesToMatch) { filters.push((row) => valuesToMatch.includes(row[column])); return this; },
        not(column, operator, value) {
          if (operator === "is" && value === null) filters.push((row) => row[column] !== null);
          return this;
        },
        upsert(row) { action = "upsert"; values = row; return this; },
        update(updates) { action = "update"; values = updates; return this; },
        then(resolve, reject) {
          try {
            const matching = rows.filter((row) => filters.every((filter) => filter(row)));
            if (action === "upsert") {
              const existing = rows.find((row) => row.game_id === values.game_id && row.object_id === values.object_id);
              if (!existing) rows.push({ ...values, evidence_id: values.evidence_id ?? null, closer_inspected_at: null, evidence_discovered_at: null });
              return Promise.resolve({ data: null, error: null }).then(resolve, reject);
            }
            if (action === "update") {
              for (const row of matching) Object.assign(row, values);
              return Promise.resolve({ data: matching, error: null }).then(resolve, reject);
            }
            return Promise.resolve({ data: matching, error: null }).then(resolve, reject);
          } catch (error) {
            return Promise.reject(error).then(resolve, reject);
          }
        },
      };
      return query;
    },
  };
};

test("scene shape links each existing clue once and supports a gated clue", () => {
  assert.equal(CrimeSceneSchema.safeParse(scene).success, true);
  assert.deepEqual(validateSceneClueLinks(scene, clues), []);

  const invalidScene = structuredClone(scene);
  invalidScene.areas[2].objects[1].requires_evidence_id = "clue_3";
  assert.ok(validateSceneClueLinks(invalidScene, clues).some((issue) => /cycle/i.test(issue)));

  const leakedScene = structuredClone(scene);
  leakedScene.areas[0].objects[0].description = "A Blue thread rests on the display case.";
  assert.ok(validateSceneClueLinks(leakedScene, clues).some((issue) => /exact evidence name/i.test(issue)));
});

test("scene responses hide clue contents and discovery requirements until found", async () => {
  const service = new CrimeSceneService(makeDatabase());
  const response = await service.getScene(makeGame(), "user-1");
  const hiddenObject = response.areas[2].objects[1];

  assert.equal(response.evidence.length, 0);
  assert.equal(hiddenObject.available, false);
  assert.equal("evidence_id" in hiddenObject, false);
  assert.equal("requires_evidence_id" in hiddenObject, false);
  assert.equal("inspection_text" in hiddenObject, false);
  assert.equal(JSON.stringify(response).includes("Blue thread"), false);
});

test("inspection collects existing evidence once and unlocks a dependent clue", async () => {
  const database = makeDatabase();
  const service = new CrimeSceneService(database);
  const game = makeGame();

  await assert.rejects(
    service.inspectObject(game, "user-1", "object_8", "inspect"),
    (error) => error.statusCode === 409
  );

  const firstLook = await service.inspectObject(game, "user-1", "object_1", "inspect");
  assert.equal(firstLook.object.examined, true);
  assert.equal(firstLook.evidence, null);

  const firstEvidence = await service.inspectObject(game, "user-1", "object_1", "closer");
  assert.equal(firstEvidence.evidence.id, "clue_1");
  assert.equal(firstEvidence.evidence.discovery_order, 1);
  assert.equal(firstEvidence.evidence.important, true);
  assert.deepEqual(firstEvidence.evidence.related_suspects, [{ id: "suspect_1", name: "Ada Vale" }]);

  const duplicate = await service.inspectObject(game, "user-1", "object_1", "closer");
  assert.equal(duplicate.message, "You already collected this evidence.");
  assert.equal(database.rows.filter(({ evidence_id }) => evidence_id === "clue_1").length, 1);

  const hiddenObject = await service.inspectObject(game, "user-1", "object_8", "inspect");
  assert.equal(hiddenObject.object.available, true);
  await service.inspectObject(game, "user-1", "object_8", "closer");

  const discovered = await service.getScene(game, "user-1");
  assert.deepEqual(discovered.evidence.map(({ id }) => id), ["clue_1", "clue_3"]);
  assert.deepEqual(discovered.evidence.map(({ discovery_order }) => discovery_order), [1, 2]);

  const evidenceByGame = await service.getDiscoveredEvidenceByGameIds([game.id], "user-1");
  const safeGame = GameService.sanitizeGame(game, evidenceByGame.get(game.id));
  assert.deepEqual(safeGame.clues.map(({ id }) => id), ["clue_1", "clue_3"]);
  assert.equal("crime_scene" in safeGame, false);
  assert.equal(safeGame.solution, null);
});

test("older cases keep all original clues and receive a harmless local scene", () => {
  const oldGame = makeGame(null);
  const oldScene = buildLegacyCrimeScene(oldGame);
  const safeGame = GameService.sanitizeGame(oldGame);

  assert.equal(oldScene.scene_type, "museum");
  assert.equal(oldScene.areas.reduce((count, area) => count + area.objects.length, 0), 9);
  assert.ok(oldScene.areas.flatMap(({ objects }) => objects).every(({ evidence_id }) => evidence_id === null));
  assert.equal(safeGame.clues.length, 3);
});
