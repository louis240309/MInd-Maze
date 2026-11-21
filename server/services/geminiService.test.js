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
  assert.ok(cases.every(({ clues }) => clues.some(({ name }) => name.startsWith("Blue thread"))));
  assert.ok(prompts.every((prompt) => /10th-grade reading level/i.test(prompt)));
  assert.ok(prompts.every((prompt) => /different, clear personality/i.test(prompt)));
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
