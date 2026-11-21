import assert from "node:assert/strict";
import test from "node:test";
import {
  DictionaryService,
  isVisibleDictionaryContext,
} from "./dictionaryService.js";

test("known detective terms use the local dictionary without a Gemini call", async () => {
  let calls = 0;
  const service = new DictionaryService({ explainUnknown: async () => { calls += 1; } });

  const result = await service.define({ word: "alibis" });

  assert.equal(result.word, "alibis");
  assert.equal(result.source, "local");
  assert.match(result.definition, /where someone says they were/i);
  assert.equal(calls, 0);
});

test("context checks allow visible text but reject solution and secret motive text", () => {
  const game = {
    status: "active",
    story: "The suspect's alibi did not match the clock.",
    solution: "The hidden answer names the culprit.",
    suspects: [{ name: "Rae", statement: "I left before noon.", motive: "Secret motive information." }],
    clues: [{ name: "Clock", description: "The clock stopped at noon." }],
  };

  assert.equal(isVisibleDictionaryContext(game, "alibi", "The suspect's alibi did not match the clock."), true);
  assert.equal(isVisibleDictionaryContext(game, "culprit", "The hidden answer names the culprit."), false);
  assert.equal(isVisibleDictionaryContext(game, "secret", "Secret motive information."), false);
});

test("unknown word lookups deduplicate concurrent requests and cache success", async () => {
  let calls = 0;
  const service = new DictionaryService({
    explainUnknown: async ({ word, context }) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { definition: `${word} in simple words.`, example: `Here is ${word} in context: ${context}.`, synonym: "simple" };
    },
  });
  const request = { word: "ledger", context: "The ledger lists each guest." };
  const [first, second] = await Promise.all([service.define(request), service.define(request)]);
  const cached = await service.define(request);

  assert.equal(calls, 1);
  assert.equal(first.definition, "ledger in simple words.");
  assert.deepEqual(second, first);
  assert.deepEqual(cached, first);
  assert.equal(first.source, "gemini");
});

test("failed explanations are not cached", async () => {
  let calls = 0;
  const service = new DictionaryService({
    explainUnknown: async () => {
      calls += 1;
      if (calls === 1) throw new Error("temporary provider failure");
      return { definition: "A test word in simple English.", example: "This is a clear example sentence.", synonym: "" };
    },
  });

  await assert.rejects(service.define({ word: "ledger-fail" }));
  const result = await service.define({ word: "ledger-fail" });

  assert.equal(calls, 2);
  assert.equal(result.source, "gemini");
});
