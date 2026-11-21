import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ||= "test-service-key";

const { GameService } = await import("./gameService.js");
const { createGameSchema } = await import("../middleware/validation.js");

const createDatabase = ({ existingGame = null, onInsert = () => {} } = {}) => {
  const query = {
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit: async () => ({ data: [], error: null }),
    maybeSingle: async () => ({ data: existingGame, error: null }),
  };
  return {
    from() {
      return {
        select() {
          return query;
        },
        insert([game]) {
          onInsert(game);
          return {
            select() {
              return {
                single: async () => ({ data: game, error: null }),
              };
            },
          };
        },
      };
    },
  };
};

const validCase = () => ({
  title: "The Clock at Briar Manor",
  difficulty: "medium",
  story: "At Briar Manor, a rare clock disappeared during the evening reception. The west hall closed at eight. A delivery arrived at eight fifteen, and the staff found the empty stand at nine. Three people had access to the hall.",
  suspects: [
    { id: "suspect_1", name: "Ada Vale", age: 34, role: "Curator", background: "Ada has cared for the manor collection for years.", relationship: "She prepared the clock for the reception.", motive: "She needed money to repay an old debt.", alibi: "She says she stayed in the dining room.", statement: "I stayed in the dining room after the west hall closed." },
    { id: "suspect_2", name: "Ben Holt", age: 41, role: "Guard", background: "Ben checks the manor doors each evening.", relationship: "He locked the west hall at eight.", motive: "He wanted to avoid blame for a late patrol.", alibi: "He says he checked the north entrance.", statement: "I checked the north entrance after locking the hall." },
    { id: "suspect_3", name: "Cora Finch", age: 29, role: "Guest", background: "Cora writes about historic homes for a local paper.", relationship: "She viewed the clock during the reception.", motive: "She wanted a story about the manor.", alibi: "She says she left before the delivery arrived.", statement: "I left through the front door before eight." },
  ],
  clues: [
    { id: "clue_1", name: "Green fiber", type: "physical", description: "A green fiber was caught on the display stand.", relevance: "It matches Ada's work coat." },
    { id: "clue_2", name: "Delivery record", type: "document", description: "The delivery record shows the side door opened at eight fifteen.", relevance: "The side door could reach the west hall." },
    { id: "clue_3", name: "Fresh dust line", type: "forensic", description: "A fresh dust line leads from the stand toward the side door.", relevance: "The clock left after the hall was locked." },
  ],
  crime_scene: {
    name: "Briar Manor",
    scene_type: "mansion",
    description: "The old manor has three areas around the closed west hall.",
    areas: [
      {
        id: "area_1", name: "West hall", description: "The west hall held the clock during the reception.",
        objects: [
          { id: "object_1", name: "Display stand", category: "fixture", x: 25, y: 38, description: "A wooden stand sits beneath a wall lamp.", inspection_text: "The stand is empty and clean.", closer_text: "A small fiber rests near one leg.", evidence_id: "clue_1", requires_evidence_id: null },
          { id: "object_2", name: "Wall lamp", category: "fixture", x: 54, y: 40, description: "A lamp lights the center of the hall.", inspection_text: "The lamp is switched off.", closer_text: "No useful mark is visible.", evidence_id: null, requires_evidence_id: null },
          { id: "object_3", name: "Hall chair", category: "furniture", x: 78, y: 66, description: "A chair rests beside the west wall.", inspection_text: "The chair is part of the reception room.", closer_text: "The chair has no new marks.", evidence_id: null, requires_evidence_id: null },
        ],
      },
      {
        id: "area_2", name: "Side entrance", description: "The side entrance connects to the service passage.",
        objects: [
          { id: "object_4", name: "Entry book", category: "document", x: 25, y: 42, description: "A book rests on a table beside the door.", inspection_text: "The book records staff and deliveries.", closer_text: "One entry records the delivery time.", evidence_id: "clue_2", requires_evidence_id: null },
          { id: "object_5", name: "Side door", category: "fixture", x: 54, y: 41, description: "A narrow door opens toward the service passage.", inspection_text: "The door is closed.", closer_text: "The lock shows no clear damage.", evidence_id: null, requires_evidence_id: null },
          { id: "object_6", name: "Coat hook", category: "furniture", x: 78, y: 66, description: "A row of hooks holds several staff coats.", inspection_text: "The coats belong to the evening staff.", closer_text: "No coat is missing.", evidence_id: null, requires_evidence_id: null },
        ],
      },
      {
        id: "area_3", name: "Service passage", description: "The passage runs behind the west hall toward the entrance.",
        objects: [
          { id: "object_7", name: "Storage shelf", category: "furniture", x: 25, y: 43, description: "A shelf holds folded cloth and cleaning items.", inspection_text: "The supplies are neatly arranged.", closer_text: "Nothing appears to be missing.", evidence_id: null, requires_evidence_id: null },
          { id: "object_8", name: "Stone floor", category: "other", x: 54, y: 65, description: "The stone floor runs from the hall to the door.", inspection_text: "The floor has a thin layer of dust.", closer_text: "A fresh line crosses the dust toward the door.", evidence_id: "clue_3", requires_evidence_id: "clue_1" },
          { id: "object_9", name: "Service window", category: "fixture", x: 78, y: 42, description: "A small window faces the manor garden.", inspection_text: "The window is shut.", closer_text: "The latch is still in place.", evidence_id: null, requires_evidence_id: null },
        ],
      },
    ],
  },
  hints: ["Check who could use the side entrance.", "Compare the fiber with the staff clothing.", "Match the delivery time to the fresh mark."],
  solution: "Guilty suspect: suspect_1 — Ada Vale. Green fiber matches Ada Vale's coat. Delivery record puts her route by the door. Fresh dust line shows how the clock left. Ben Holt and Cora Finch have alibis that fit the records.",
});

test("createMystery never inserts a generated case that fails validation", async () => {
  let inserted = false;
  const database = createDatabase({
    onInsert: () => {
      inserted = true;
      throw new Error("Invalid generated case reached Supabase insert.");
    },
  });
  const gameService = new GameService({
    database,
    caseGenerator: { generateMystery: async () => ({ title: "Incomplete case" }) },
  });

  await assert.rejects(
    gameService.createMystery("test-user", { difficulty: "medium", theme: "Mansion" }),
    (error) => error.statusCode === 502 && /was not saved/i.test(error.message),
  );
  assert.equal(inserted, false);
});

test("createMystery saves a complete validated case and returns the sanitized record", async () => {
  let insertedCase;
  const database = createDatabase({ onInsert: (game) => { insertedCase = game; } });
  const gameService = new GameService({
    database,
    caseGenerator: { generateMystery: async () => validCase() },
  });

  const saved = await gameService.createMystery("test-user", { difficulty: "medium", theme: "Briar Manor" });

  assert.ok(insertedCase);
  assert.equal(insertedCase.crime_scene.areas.length, 3);
  assert.equal(insertedCase.solution.startsWith("Guilty suspect:"), true);
  assert.equal(saved.solution, null);
});

test("repeating a generation ID returns the saved case without generating or inserting again", async () => {
  const generationId = "32c4e94b-d55a-4a2d-b722-04e617e01e59";
  const existingGame = {
    ...validCase(),
    id: generationId,
    user_id: "test-user",
    status: "active",
    hint_count: 0,
    points_earned: 0,
    created_at: "2026-11-21T00:00:00.000Z",
    updated_at: "2026-11-21T00:00:00.000Z",
  };
  let generationCalls = 0;
  let insertCalls = 0;
  const gameService = new GameService({
    database: createDatabase({
      existingGame,
      onInsert: () => { insertCalls += 1; },
    }),
    caseGenerator: {
      generateMystery: async () => {
        generationCalls += 1;
        return validCase();
      },
    },
  });

  const result = await gameService.createMystery("test-user", {
    difficulty: "medium",
    theme: "Briar Manor",
    generationId,
  });

  assert.equal(result.id, generationId);
  assert.equal(result.solution, null);
  assert.equal(generationCalls, 0);
  assert.equal(insertCalls, 0);
});

test("concurrent requests with the same generation ID share one Gemini call and insert", async () => {
  const generationId = "62af4fcf-8cee-47b6-bf06-c8c1b75f9e94";
  let generationCalls = 0;
  let insertCalls = 0;
  const gameService = new GameService({
    database: createDatabase({ onInsert: () => { insertCalls += 1; } }),
    caseGenerator: {
      generateMystery: async () => {
        generationCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return validCase();
      },
    },
  });
  const request = {
    difficulty: "medium",
    theme: "Briar Manor",
    generationId,
  };

  const results = await Promise.all([
    gameService.createMystery("test-user", request),
    gameService.createMystery("test-user", request),
  ]);

  assert.equal(generationCalls, 1);
  assert.equal(insertCalls, 1);
  assert.deepEqual(results.map(({ id }) => id), [generationId, generationId]);
});

test("generation request validation accepts UUID idempotency keys and rejects malformed keys", () => {
  const generationId = "32c4e94b-d55a-4a2d-b722-04e617e01e59";
  assert.equal(createGameSchema.parse({ generation_id: generationId }).generation_id, generationId);
  assert.throws(() => createGameSchema.parse({ generation_id: "not-a-uuid" }));
});
