import { createHash } from "node:crypto";
import { geminiService } from "./geminiService.js";

export const localDictionary = Object.freeze({
  alibi: {
    definition: "Where someone says they were when an event happened.",
    example: "Her alibi was that she stayed in the library.",
    synonym: "whereabouts",
  },
  motive: {
    definition: "A reason someone may have done something.",
    example: "The guard had a motive to hide the missing key.",
    synonym: "reason",
  },
  evidence: {
    definition: "Things that help show what happened.",
    example: "The muddy shoe was evidence from the room.",
    synonym: "proof",
  },
  suspect: {
    definition: "A person who may have done something wrong.",
    example: "The detective spoke with each suspect.",
    synonym: "person of interest",
  },
  witness: {
    definition: "A person who saw or heard something happen.",
    example: "The witness saw a light turn on.",
    synonym: "observer",
  },
  clue: {
    definition: "A detail that can help solve a mystery.",
    example: "A wet footprint was a clue.",
    synonym: "hint",
  },
  interrogate: {
    definition: "To ask someone questions about an event.",
    example: "The detective asked the guard about the key.",
    synonym: "question",
  },
  investigate: {
    definition: "To look for facts and learn what happened.",
    example: "We investigate the room for clues.",
    synonym: "examine",
  },
  contradiction: {
    definition: "A detail that does not match another detail.",
    example: "The two times were a contradiction.",
    synonym: "conflict",
  },
  contradicts: {
    definition: "Does not match what someone else said or what happened.",
    example: "The clock contradicts his story about the time.",
    synonym: "does not match",
  },
  timeline: {
    definition: "A list of events in the order they happened.",
    example: "The timeline shows when each person arrived.",
    synonym: "event order",
  },
  forensic: {
    definition: "Using science to study clues from an event.",
    example: "A forensic test checked the dust on the key.",
    synonym: "science-based",
  },
  testimony: {
    definition: "What a person says about what they saw or know.",
    example: "The witness gave testimony about the open door.",
    synonym: "account",
  },
  "crime scene": {
    definition: "The place where a crime happened.",
    example: "The room was treated as a crime scene.",
    synonym: "event location",
  },
  opportunity: {
    definition: "A chance to do something.",
    example: "The open door gave someone an opportunity to enter.",
    synonym: "chance",
  },
  statement: {
    definition: "Something a person says or writes about an event.",
    example: "Her statement said she left before noon.",
    synonym: "account",
  },
  fingerprint: {
    definition: "A mark left by the lines on a finger.",
    example: "A fingerprint was found on the glass.",
    synonym: "finger mark",
  },
  suspicious: {
    definition: "Making you think something may be wrong.",
    example: "The locked window seemed suspicious.",
    synonym: "questionable",
  },
  identity: {
    definition: "Who a person is.",
    example: "The note hid the writer's identity.",
    synonym: "name",
  },
  investigation: {
    definition: "The work of finding out what happened.",
    example: "The investigation began after the painting went missing.",
    synonym: "inquiry",
  },
  confession: {
    definition: "A statement that says someone did something wrong.",
    example: "The suspect gave a confession to the theft.",
    synonym: "admission",
  },
  discovery: {
    definition: "Something found or learned for the first time.",
    example: "The discovery of a second key changed the case.",
    synonym: "finding",
  },
  proof: {
    definition: "A fact or item that shows something is true.",
    example: "The signed note was proof that she had been there.",
    synonym: "evidence",
  },
});

const aliases = Object.freeze({
  alibis: "alibi",
  motives: "motive",
  suspects: "suspect",
  witnesses: "witness",
  clues: "clue",
  interrogated: "interrogate",
  interrogating: "interrogate",
  interrogates: "interrogate",
  investigated: "investigate",
  investigating: "investigate",
  investigations: "investigation",
  "crime-scene": "crime scene",
  opportunities: "opportunity",
  statements: "statement",
  fingerprints: "fingerprint",
  identities: "identity",
  confessions: "confession",
  discoveries: "discovery",
  proofs: "proof",
});

export const normalizeDictionaryTerm = (word) => String(word || "")
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[’']/g, "")
  .replace(/[-\s]+/g, " ")
  .trim();

export const canonicalDictionaryTerm = (word) => {
  const normalized = normalizeDictionaryTerm(word);
  return aliases[normalized] || normalized;
};

const normalizeContext = (value) => String(value || "")
  .normalize("NFKC")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase();

const visibleContextFields = (game) => [
  game.title,
  game.story,
  ...(Array.isArray(game.clues) ? game.clues.flatMap((clue) => [clue.name, clue.description, clue.relevance]) : []),
  ...(Array.isArray(game.suspects) ? game.suspects.flatMap((suspect) => [
    suspect.name, suspect.role, suspect.age && `Age ${suspect.age}`, suspect.background,
    suspect.relationship, suspect.alibi, suspect.statement,
  ]) : []),
  ...(Array.isArray(game.hints) ? game.hints : []),
  ...(game.status === "solved" ? [game.solution] : []),
].filter((value) => typeof value === "string" && value.trim());

export function isVisibleDictionaryContext(game, word, context = "") {
  const snippet = String(context || "").trim();
  if (!snippet) return true;
  if (snippet.length > 280 || !normalizeContext(snippet).includes(normalizeContext(word))) return false;
  const normalizedSnippet = normalizeContext(snippet);
  return visibleContextFields(game).some((field) => normalizeContext(field).includes(normalizedSnippet));
}

const cache = new Map();
const inFlight = new Map();
const CACHE_LIMIT = 500;

const cacheKeyFor = (word, context) => createHash("sha256")
  .update(`${normalizeDictionaryTerm(word)}\0${normalizeContext(context)}`)
  .digest("hex");

const remember = (key, value) => {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
  cache.set(key, value);
};

export class DictionaryService {
  constructor({ explainUnknown = (...args) => geminiService.explainWord(...args) } = {}) {
    this.explainUnknown = explainUnknown;
  }

  async define({ word, context = "" }) {
    const normalized = normalizeDictionaryTerm(word);
    const canonical = canonicalDictionaryTerm(word);
    const local = localDictionary[canonical];
    if (local) return { word: normalized, ...local, source: "local" };

    const key = cacheKeyFor(normalized, context);
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending;

    const request = (async () => {
      const generated = await this.explainUnknown({ word: normalized, context: String(context).slice(0, 280) });
      const definition = {
        word: normalized,
        definition: generated.definition,
        example: generated.example,
        ...(generated.synonym ? { synonym: generated.synonym } : {}),
        source: "gemini",
      };
      remember(key, definition);
      return definition;
    })();
    inFlight.set(key, request);
    try {
      return await request;
    } finally {
      inFlight.delete(key);
    }
  }
}

export const dictionaryService = new DictionaryService();
