import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalDictionaryWord,
  DETECTIVE_DICTIONARY,
  DICTIONARY_TERM_PATTERN,
} from "./detectiveDictionary.js";

test("the initial word list includes all requested detective terms", () => {
  const expected = [
    "alibi", "motive", "evidence", "suspect", "witness", "clue", "interrogate", "contradicts",
    "investigate", "contradiction", "timeline", "forensic", "testimony",
    "crime scene", "opportunity", "statement", "fingerprint", "suspicious",
    "identity", "investigation", "confession", "discovery", "proof",
  ];

  assert.deepEqual(Object.keys(DETECTIVE_DICTIONARY).sort(), expected.sort());
});

test("supported words and phrases keep their original spelling and repeated matches", () => {
  const text = "The suspect's alibi contradicts the witness's testimony. The alibi changed.";
  const words = [...text.matchAll(DICTIONARY_TERM_PATTERN)].map((match) => match[2].toLocaleLowerCase());

  assert.deepEqual(words, ["suspect", "alibi", "contradicts", "witness", "testimony", "alibi"]);
  assert.equal(canonicalDictionaryWord("crime-scene"), "crime scene");
});
