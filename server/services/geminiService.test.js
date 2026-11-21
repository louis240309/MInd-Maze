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
  solution: `Guilty suspect: suspect_1 — Ari ${variation}. Blue thread ${variation}, Door log ${variation}, and Dust mark ${variation} place Ari at the scene. Bea ${variation} and Cal ${variation} have alibis that match the evidence.`,
});

const generationResponse = (text, finishReason = "STOP") => ({
  candidates: [{
    finishReason,
    content: { parts: text === undefined ? [] : [{ text }] },
  }],
  usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 },
});

const generationService = (generateContent) => Object.assign(Object.create(GeminiService.prototype), {
  apiKey: "test-key",
  recentCases: [],
  sleep: async () => {},
  random: () => 0,
  retryContext: null,
  ai: { models: { generateContent } },
});

const sequenceService = (responses) => {
  const requests = [];
  const service = generationService(async (request) => {
    requests.push(request);
    const response = responses[Math.min(requests.length - 1, responses.length - 1)];
    return typeof response === "function" ? response(request) : response;
  });
  return { service, requests };
};

test("three theme samples preserve the facts and follow a simple-English prompt", async () => {
  const prompts = [];
  const service = generationService(async ({ contents, config }) => {
    prompts.push(contents);
    assert.equal(config.candidateCount, 1);
    assert.equal(config.responseMimeType, "application/json");
    assert.equal(config.maxOutputTokens, 5000);
    assert.equal(config.responseJsonSchema.additionalProperties, false);
    const variation = prompts.length;
    const themes = ["Mansion", "Museum", "Hotel"];
    return generationResponse(JSON.stringify(sampleCase(themes[variation - 1], variation)));
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
  assert.ok(prompts.every((prompt) => /timeline/i.test(prompt)));
  assert.ok(prompts.every((prompt) => /first-person statement/i.test(prompt)));
  assert.ok(prompts.every((prompt) => /progressively helpful hints/i.test(prompt)));
});

test("truncated JSON is retried and accepted when the next response is complete", async () => {
  const { service, requests } = sequenceService([
    generationResponse('{"title":"unfinished'),
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "truncated-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.equal(requests.length, 2);
  assert.match(requests[1].contents, /previous response was cut short/i);
});

test("malformed JSON is retried with a targeted formatting instruction", async () => {
  const { service, requests } = sequenceService([
    generationResponse('{"title": unquoted}'),
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);
  await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "malformed-test" });

  assert.equal(requests.length, 2);
  assert.match(requests[1].contents, /quote every property name/i);
});

test("a response missing required fields is retried without inventing defaults", async () => {
  const incompleteCase = sampleCase("Mansion", 1);
  delete incompleteCase.story;
  const { service, requests } = sequenceService([
    generationResponse(JSON.stringify(incompleteCase)),
    generationResponse(JSON.stringify(sampleCase("Mansion", 2))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "missing-field-test" });

  assert.equal(generated.title, "Mansion Mystery 2");
  assert.equal(requests.length, 2);
  assert.match(requests[1].contents, /story/);
});

test("an invalid culprit marker is rejected and corrected on retry", async () => {
  const invalidCase = sampleCase("Mansion", 1);
  invalidCase.solution = "Guilty suspect: suspect_3 — Ari 1. The evidence explains the case.";
  const { service, requests } = sequenceService([
    generationResponse(JSON.stringify(invalidCase)),
    generationResponse(JSON.stringify(sampleCase("Mansion", 2))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "invalid-culprit-test" });

  assert.equal(generated.title, "Mansion Mystery 2");
  assert.equal(requests.length, 2);
  assert.match(requests[1].contents, /solution/);
});

test("inconsistent solution clues or culprit hints are rejected", async () => {
  const inconsistentCase = sampleCase("Mansion", 1);
  inconsistentCase.solution = "Guilty suspect: suspect_1 — Ari 1. Bea 1 and Cal 1 are innocent.";
  inconsistentCase.hints[0] = "Ari 1 had the strongest motive.";
  const { service, requests } = sequenceService([
    generationResponse(JSON.stringify(inconsistentCase)),
    generationResponse(JSON.stringify(sampleCase("Mansion", 2))),
  ]);
  await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "inconsistent-case-test" });

  assert.equal(requests.length, 2);
  assert.match(requests[1].contents, /solution\.clues|hints/);
});

test("an empty Gemini response is retried and never treated as a case", async () => {
  const { service, requests } = sequenceService([
    generationResponse(undefined),
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "empty-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.equal(requests.length, 2);
});

test("an unexpected multiple-candidate response is rejected and retried", async () => {
  const firstCandidate = generationResponse(JSON.stringify(sampleCase("Mansion", 1))).candidates[0];
  const { service, requests } = sequenceService([
    { candidates: [firstCandidate, firstCandidate] },
    generationResponse(JSON.stringify(sampleCase("Mansion", 2))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "multiple-candidate-test" });

  assert.equal(generated.title, "Mansion Mystery 2");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].config.candidateCount, 1);
});

test("a Gemini token-limit finish reason is classified as truncation and retried", async () => {
  const { service, requests } = sequenceService([
    generationResponse('{"incomplete":', "MAX_TOKENS"),
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "token-limit-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].config.maxOutputTokens, 5000);
});

test("generation fails after the bounded retry limit for malformed responses", async () => {
  const { service, requests } = sequenceService([
    generationResponse('{"title": unquoted}'),
  ]);

  await assert.rejects(
    service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "retry-limit-test" }),
    (error) => error.statusCode === 502 && /invalid case data/i.test(error.message),
  );
  assert.equal(requests.length, 3);
});

test("a temporary 503 is retried and generation succeeds on the next request", async () => {
  const unavailable = Object.assign(new Error("provider unavailable"), { status: 503, code: "UNAVAILABLE" });
  const { service, requests } = sequenceService([
    () => { throw unavailable; },
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);
  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "503-recovery-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.equal(requests.length, 2);
});

test("repeated 503 errors stop after three attempts and return a safe unavailable message", async () => {
  const { service, requests } = sequenceService([
    () => { throw Object.assign(new Error("provider unavailable"), { status: 503, code: "UNAVAILABLE" }); },
  ]);

  await assert.rejects(
    service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "503-limit-test" }),
    (error) => error.statusCode === 503 && /temporarily unavailable/i.test(error.message) && error.retryable,
  );
  assert.equal(requests.length, 3);
});

test("502 and 504 provider errors recover with bounded retries", async (context) => {
  for (const status of [502, 504]) {
    await context.test(`HTTP ${status}`, async () => {
      const { service, requests } = sequenceService([
        () => { throw Object.assign(new Error("temporary gateway failure"), { status }); },
        generationResponse(JSON.stringify(sampleCase("Mansion", status))),
      ]);
      const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: `gateway-${status}` });

      assert.equal(generated.title, `Mansion Mystery ${status}`);
      assert.equal(requests.length, 2);
    });
  }
});

test("network timeouts retry, while quota and permanent client errors do not", async (context) => {
  const cases = [
    {
      name: "network timeout",
      error: Object.assign(new Error("request timed out"), { code: "ETIMEDOUT", name: "TimeoutError" }),
      expectedCalls: 3,
      expectedStatus: 503,
      message: /took too long/i,
    },
    {
      name: "rate limit",
      error: Object.assign(new Error("quota exhausted"), { status: 429, code: "RESOURCE_EXHAUSTED" }),
      expectedCalls: 1,
      expectedStatus: 429,
      message: /request limit reached/i,
    },
    {
      name: "invalid credentials",
      error: Object.assign(new Error("invalid key"), { status: 401 }),
      expectedCalls: 1,
      expectedStatus: 503,
      message: /configuration needs attention/i,
    },
    {
      name: "permanent bad request",
      error: Object.assign(new Error("invalid request"), { status: 400 }),
      expectedCalls: 1,
      expectedStatus: 502,
      message: /could not generate a valid case/i,
    },
  ];

  for (const scenario of cases) {
    await context.test(scenario.name, async () => {
      const { service, requests } = sequenceService([
        () => { throw scenario.error; },
      ]);

      await assert.rejects(
        service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: scenario.name }),
        (error) => error.statusCode === scenario.expectedStatus && scenario.message.test(error.message),
      );
      assert.equal(requests.length, scenario.expectedCalls);
    });
  }
});

test("an unsupported configured model gets one fallback without retrying other permanent errors", async () => {
  const models = [];
  const service = generationService(async ({ model }) => {
    models.push(model);
    if (models.length === 1) {
      throw Object.assign(new Error(`Model ${model} not found`), { status: 404, code: "NOT_FOUND" });
    }
    return generationResponse(JSON.stringify(sampleCase("Mansion", 1)));
  });

  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "model-fallback-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.equal(models.length, 2);
  assert.notEqual(models[0], models[1]);
});

test("provider Retry-After seconds are honored without exceeding the request budget", async () => {
  const delays = [];
  let calls = 0;
  const service = generationService(async () => {
    calls += 1;
    if (calls === 1) {
      throw Object.assign(new Error("provider unavailable"), {
        status: 503,
        headers: new Headers({ "retry-after": "2" }),
      });
    }
    return generationResponse(JSON.stringify(sampleCase("Mansion", 1)));
  });
  service.sleep = async (milliseconds) => delays.push(milliseconds);

  const generated = await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "retry-after-test" });

  assert.equal(generated.title, "Mansion Mystery 1");
  assert.deepEqual(delays, [2000]);
  assert.equal(calls, 2);
});

test("Retry-After metadata captured from the SDK fetch is honored", async () => {
  let activeContext;
  const delays = [];
  let calls = 0;
  const service = generationService(async () => {
    calls += 1;
    if (calls === 1) {
      activeContext.retryAfterMs = 750;
      throw Object.assign(new Error("provider unavailable"), { status: 503 });
    }
    return generationResponse(JSON.stringify(sampleCase("Mansion", 1)));
  });
  service.retryContext = {
    run(context, callback) {
      activeContext = context;
      return Promise.resolve(callback()).finally(() => { activeContext = null; });
    },
  };
  service.sleep = async (milliseconds) => delays.push(milliseconds);

  await service.generateMystery({ theme: "Mansion", difficulty: "medium", generationId: "captured-retry-after-test" });

  assert.deepEqual(delays, [750]);
  assert.equal(calls, 2);
});

test("duplicate candidate responses are rejected and never accepted after retries", async () => {
  const priorCase = sampleCase("Mansion", 1);
  const { service, requests } = sequenceService([
    generationResponse(JSON.stringify(sampleCase("Mansion", 1))),
  ]);

  await assert.rejects(
    service.generateMystery({ theme: "Mansion", difficulty: "medium", recentCases: [priorCase], generationId: "duplicate-test" }),
    (error) => error.statusCode === 502 && /too similar/i.test(error.message),
  );
  assert.equal(requests.length, 3);
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
