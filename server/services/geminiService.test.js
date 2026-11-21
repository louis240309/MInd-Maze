import assert from "node:assert/strict";
import test from "node:test";
import { GeminiService } from "./geminiService.js";

const sampleCase = (theme, variation) => ({
  title: `${theme} Mystery ${variation}`,
  difficulty: "medium",
  story: ({
    Mansion: "At the hilltop mansion, a small painting went missing after dinner. The owner locked the front door before sunset. A torn blue thread lay beside the east window. The door log showed one late entry.",
    Museum: "At the city museum, a gold cup went missing after closing. The guard locked the main gallery at night. A torn blue thread lay beside the empty display. The entry book showed one late visit.",
    Hotel: "At the seaside hotel, a silver bell went missing before dawn. The night manager checked each room. A torn blue thread lay near the service stairs. The room log showed one late visit.",
  })[theme],
  suspects: [
    { id: "suspect_1", name: `Ari ${variation}`, age: 34, role: "Guide", background: "A guide who knows the building well.", relationship: "Works near the missing painting.", motive: "Wanted to protect a private mistake.", alibi: "Says they stayed by the front desk.", statement: "I stayed by the desk. I did not see the painting." },
    { id: "suspect_2", name: `Bea ${variation}`, age: 41, role: "Guard", background: "A guard who checks the doors each night.", relationship: "Locked the side entrance.", motive: "Wanted to avoid extra work.", alibi: "Says they checked the east hall.", statement: "I checked the east hall before the alarm." },
    { id: "suspect_3", name: `Cal ${variation}`, age: 29, role: "Artist", background: "An artist who came to see the show.", relationship: "Had a painting in the same room.", motive: "Wanted people to notice their work.", alibi: "Says they left before the doors closed.", statement: "I left before closing. I never went back inside." },
  ],
  clues: [
    { id: "clue_1", name: `Blue thread ${variation}`, type: "physical", description: "A blue thread was caught on the display case.", relevance: "It matches a coat seen near the room." },
    { id: "clue_2", name: `Door log ${variation}`, type: "document", description: "The door log shows a late entry at nine.", relevance: "It does not match one person's story." },
    { id: "clue_3", name: `Dust mark ${variation}`, type: "forensic", description: "A clean mark shows where the painting hung.", relevance: "It confirms the painting was removed that night." },
  ],
  crime_scene: {
    name: `${theme} scene`,
    scene_type: ({ Mansion: "mansion", Museum: "museum", Hotel: "hotel" })[theme],
    description: `Three areas in the ${theme.toLocaleLowerCase()} match the case story.`,
    areas: [
      {
        id: "area_1",
        name: "Main room",
        description: "The main room holds the display and nearby furniture.",
        objects: [
          { id: "object_1", name: "Display case", category: "fixture", x: 25, y: 38, description: "A glass case stands against the wall.", inspection_text: "The case is closed and fits the room.", closer_text: "No new detail appears on this surface.", evidence_id: "clue_1", requires_evidence_id: null },
          { id: "object_2", name: "Room chair", category: "furniture", x: 54, y: 65, description: "A chair sits near the center of the room.", inspection_text: "The chair is in its usual place.", closer_text: "The chair has no useful mark.", evidence_id: null, requires_evidence_id: null },
          { id: "object_3", name: "Wall clock", category: "fixture", x: 78, y: 39, description: "A clock hangs above the side wall.", inspection_text: "The clock is part of the room.", closer_text: "No new time detail is available.", evidence_id: null, requires_evidence_id: null },
        ],
      },
      {
        id: "area_2",
        name: "Entry room",
        description: "The entry room connects to the main room.",
        objects: [
          { id: "object_4", name: "Entry book", category: "document", x: 24, y: 40, description: "A book rests beside the entrance.", inspection_text: "The book is kept near the door.", closer_text: "The page shows the time recorded in the existing clue.", evidence_id: "clue_2", requires_evidence_id: null },
          { id: "object_5", name: "Side table", category: "furniture", x: 51, y: 66, description: "A small table stands near the doorway.", inspection_text: "The table holds no case document.", closer_text: "No new detail appears on the table.", evidence_id: null, requires_evidence_id: null },
          { id: "object_6", name: "Hall door", category: "fixture", x: 79, y: 42, description: "A door leads to the next area.", inspection_text: "The door is part of the normal room layout.", closer_text: "No useful mark is visible.", evidence_id: null, requires_evidence_id: null },
        ],
      },
      {
        id: "area_3",
        name: "Back room",
        description: "The back room is part of the same location.",
        objects: [
          { id: "object_7", name: "Storage cabinet", category: "container", x: 25, y: 43, description: "A cabinet holds routine supplies.", inspection_text: "The supplies fit this room.", closer_text: "No case detail is found inside.", evidence_id: null, requires_evidence_id: null },
          { id: "object_8", name: "Display floor", category: "other", x: 53, y: 65, description: "The floor below the display is clear.", inspection_text: "The open space is easy to view.", closer_text: "The mark matches the existing case clue.", evidence_id: "clue_3", requires_evidence_id: "clue_1" },
          { id: "object_9", name: "Window", category: "fixture", x: 78, y: 44, description: "A window looks out from the back room.", inspection_text: "The window is part of the room.", closer_text: "No new view detail is relevant.", evidence_id: null, requires_evidence_id: null },
        ],
      },
    ],
  },
  hints: ["Check who could enter the room.", "Compare the thread with each person's clothes.", "Use the late entry to check the alibis."],
  solution: `Guilty suspect: suspect_1 — Ari ${variation}. The thread and door log match Ari's path. Bea and Cal have matching alibis.`,
});

test("three theme samples preserve the facts and follow a simple-English prompt", async () => {
  const prompts = [];
  const service = Object.assign(Object.create(GeminiService.prototype), {
    apiKey: "test-key",
    recentCases: [],
    ai: {
      models: {
        generateContent: async ({ contents }) => {
          prompts.push(contents);
          const variation = prompts.length;
          const themes = ["Mansion", "Museum", "Hotel"];
          return { text: JSON.stringify(sampleCase(themes[variation - 1], variation)) };
        },
      },
    },
  });

  const cases = [];
  for (const [index, theme] of ["Mansion", "Museum", "Hotel"].entries()) {
    cases.push(await service.generateMystery({ theme, difficulty: "medium", generationId: `test-${index}` }));
  }

  assert.equal(cases.length, 3);
  assert.equal(new Set(cases.map(({ title }) => title)).size, 3);
  assert.ok(cases.every(({ clues, suspects }) => clues.length === 3 && suspects.length === 3));
  assert.ok(cases.every(({ crime_scene }) => crime_scene.areas.length === 3 && crime_scene.areas.reduce((count, area) => count + area.objects.length, 0) === 9));
  assert.ok(cases.every(({ clues }) => clues.some(({ name }) => name.startsWith("Blue thread"))));
  assert.deepEqual(cases.map(({ crime_scene }) => crime_scene.scene_type), ["mansion", "museum", "hotel"]);
  assert.ok(prompts.every((prompt) => /10th-grade reading level/i.test(prompt)));
  assert.ok(prompts.every((prompt) => /different, clear personality/i.test(prompt)));
  assert.ok(prompts.every((prompt) => /crime_scene object/i.test(prompt)));
});

test("unknown word explanations send only the word and selected context in one call", async () => {
  let request;
  const service = Object.assign(Object.create(GeminiService.prototype), {
    ai: {
      models: {
        generateContent: async (value) => {
          request = value;
          return { text: JSON.stringify({ definition: "A ledger is a book that tracks records.", example: "The ledger lists each guest.", synonym: "record book" }) };
        },
      },
    },
  });

  const result = await service.explainWord({
    word: "ledger",
    context: "The ledger lists each guest.",
  });

  assert.equal(result.definition, "A ledger is a book that tracks records.");
  assert.equal(request.config.maxOutputTokens, 256);
  assert.match(request.contents, /"ledger"/);
  assert.match(request.contents, /"The ledger lists each guest\."/);
  assert.doesNotMatch(request.contents, /solution|culprit|motive|hidden evidence/i);
});
