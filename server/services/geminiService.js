import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const SuspectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  role: z.string().min(2),
  motive: z.string().min(5),
  alibi: z.string().min(5),
  statement: z.string().min(10),
});

const ClueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["physical", "forensic", "testimony", "document"]),
  description: z.string().min(10),
  relevance: z.string().min(5),
});

export const MysteryGenerationSchema = z.object({
  title: z.string().min(3).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  story: z.string().min(100).max(6000),
  suspects: z.array(SuspectSchema).length(3),
  clues: z.array(ClueSchema).length(3),
  hints: z.array(z.string().min(5).max(500)).length(3),
  solution: z.string().min(40).max(4000),
}).superRefine((mystery, context) => {
  for (const [field, entries] of [["suspects", mystery.suspects], ["clues", mystery.clues]]) {
    const names = entries.map(({ name }) => name.trim().toLocaleLowerCase());
    if (new Set(names).size !== names.length) {
      context.addIssue({ code: "custom", path: [field], message: `All ${field} must have distinct names.` });
    }
  }
});

const models = [...new Set([
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
].filter(Boolean))];

const cleanJson = (text) => text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
const normalize = (text = "") => text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const significantWords = (text = "") => new Set(normalize(text).split(" ").filter((word) => word.length > 4));
const wordSimilarity = (left, right) => {
  const a = significantWords(left);
  const b = significantWords(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / new Set([...a, ...b]).size;
};

const projectPriorCase = (item) => ({
  title: normalize(item.title),
  story: normalize(item.story),
  premise: String(item.story || "").slice(0, 280),
  suspectNames: (Array.isArray(item.suspects) ? item.suspects : []).map(({ name }) => normalize(name)),
  clueNames: (Array.isArray(item.clues) ? item.clues : []).map(({ name }) => normalize(name)),
});

const duplicateOfRecentCase = (mystery, prior) => {
  const title = normalize(mystery.title);
  const story = normalize(mystery.story);
  const names = mystery.suspects.map(({ name }) => normalize(name));
  const clues = mystery.clues.map(({ name }) => normalize(name));
  return prior.find((old) => {
    if (old.title && old.title === title) return true;
    if (old.story && wordSimilarity(old.story, story) >= 0.68) return true;
    const sharedSuspects = names.filter((name) => old.suspectNames.includes(name)).length;
    const sharedClues = clues.filter((name) => old.clueNames.includes(name)).length;
    return sharedSuspects > 0 || sharedClues > 0;
  });
};

export class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.ai = this.apiKey ? new GoogleGenAI({
      apiKey: this.apiKey,
      // Bound each model attempt so fallbacks complete before the client request timeout.
      httpOptions: { timeout: 25000, retryOptions: { attempts: 1 } },
    }) : null;
    this.recentCases = [];
  }

  isConfigured() {
    return Boolean(this.ai);
  }

  async generateMystery({ difficulty = "medium", theme = "Victorian Noir", recentCases = [], generationId = randomUUID() }) {
    if (!this.ai) {
      const error = new Error("AI case generation is unavailable because the server Gemini credential is missing.");
      error.statusCode = 503;
      throw error;
    }

    const priorCases = [...this.recentCases, ...recentCases.map(projectPriorCase)];
    const recent = priorCases.slice(-12).map(({ title, premise, suspectNames, clueNames }) =>
      `- Title: ${title}; premise: ${premise}; people already used: ${suspectNames.join(", ")}; evidence already used: ${clueNames.join(", ")}`
    ).join("\n") || "None yet.";
    const basePrompt = `Create a new mystery for the Mind Maze game.\n\nTheme/setting: ${theme}\nDifficulty: ${difficulty} changes how hard the puzzle is, not the story.\nUnique generation identifier: ${generationId}\nRecent cases to avoid: ${recent}\n\nReturn one JSON object with exactly these fields: title, difficulty, story, suspects, clues, hints, solution.\n- Make a new story with a clear place, crime, people, and timeline. Do not copy or slightly change an old story. Make the theme clear.\n- Keep the case safe for a general audience. No graphic violence. The crime may be theft, damage, fraud, or a non-graphic murder.\n- Use exactly three suspects with ids suspect_1, suspect_2, suspect_3. Only one person did the crime. For each person, give a name, role, reason, story about where they were, and a first-person statement. Give the two innocent people secrets that are not about this crime. Use new names.\n- Use exactly three clues with ids clue_1, clue_2, clue_3, types physical/forensic/testimony/document, and fields name, description, relevance. At least two clues must work together to show how and when the guilty person did it. Make all facts fit, and give the player all needed facts. Use new clues.\n- Give exactly three hints. Each hint should help more than the last. Do not name the guilty person in a hint.\n- The secret solution must start with this exact text: Guilty suspect: suspect_N — FULL NAME. Use each clue's exact name. Explain how the clues point to the guilty person, where that person's story does not match the facts, and why the other two people are innocent. Do not add new facts.\n- Write all text the player will read for someone around age 10. Use common, everyday words. Keep sentences short: usually 8-12 words, never more than 15. Use direct sentences and active voice. Do not use rare words, jargon, idioms, metaphors, formal language, or long descriptions. For example, say "show" instead of "demonstrate," "hidden" instead of "concealed," and "does not match" instead of "contradicts." Explain any hard word right away. Keep the puzzle hard through the clues, not the words.\n- Keep the story interesting and short (2-4 paragraphs). Set difficulty exactly to ${difficulty}.\n\nJSON shape: {"title":"...","difficulty":"${difficulty}","story":"...","suspects":[{"id":"suspect_1","name":"...","role":"...","motive":"...","alibi":"...","statement":"..."},{"id":"suspect_2","name":"...","role":"...","motive":"...","alibi":"...","statement":"..."},{"id":"suspect_3","name":"...","role":"...","motive":"...","alibi":"...","statement":"..."}],"clues":[{"id":"clue_1","name":"...","type":"physical","description":"...","relevance":"..."},{"id":"clue_2","name":"...","type":"forensic","description":"...","relevance":"..."},{"id":"clue_3","name":"...","type":"document","description":"...","relevance":"..."}],"hints":["...","...","..."],"solution":"Guilty suspect: suspect_N — FULL NAME. ..."}`;

    let lastError;
    const rejectedCases = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const retryInstruction = rejectedCases.length
        ? `\n\nYour previous response was rejected. Fix the noted issue. Do not reuse any rejected title, premise, character, or evidence item; create a substantially different crime and investigative mechanism: ${JSON.stringify(rejectedCases.slice(-2))}`
        : "";
      let repeated = false;
      let invalidCandidate = false;
      // If every first-pass candidate is malformed, make one fresh focused retry
      // with the configured primary model instead of returning an avoidable error.
      const modelsToTry = attempt === 0 ? models : models.slice(0, 1);
      for (const model of modelsToTry) {
        let candidateReceived = false;
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: `${basePrompt}${retryInstruction}\nGeneration attempt: ${attempt + 1}; variation token: ${randomUUID()}`,
            config: { responseMimeType: "application/json", temperature: 1, maxOutputTokens: 5000 },
          });
          const rawText = response.text?.trim();
          if (!rawText) throw new Error("Gemini returned an empty response.");
          candidateReceived = true;
          const mystery = MysteryGenerationSchema.parse(JSON.parse(cleanJson(rawText)));
          if (mystery.difficulty !== difficulty) throw new Error("Generated case did not match the requested difficulty.");
          const suspectIds = new Set(mystery.suspects.map((suspect) => suspect.id));
          const clueIds = new Set(mystery.clues.map((clue) => clue.id));
          if (suspectIds.size !== 3 || !["suspect_1", "suspect_2", "suspect_3"].every((id) => suspectIds.has(id))) {
            throw new Error("Generated case has invalid suspect identifiers.");
          }
          if (clueIds.size !== 3 || !["clue_1", "clue_2", "clue_3"].every((id) => clueIds.has(id))) {
            throw new Error("Generated case has invalid clue identifiers.");
          }
          const culpritMarker = mystery.solution.match(/^Guilty suspect:\s*(suspect_[123])\s*[-—–:]\s*([^.!\n]+)/i);
          const culprit = culpritMarker && mystery.suspects.find(({ id, name }) =>
            id === culpritMarker[1] && name.toLocaleLowerCase() === culpritMarker[2].trim().toLocaleLowerCase()
          );
          if (!culprit) throw new Error("Solution must begin with an exact guilty suspect id and name.");
          const repeatedCase = duplicateOfRecentCase(mystery, priorCases);
          if (repeatedCase) {
            rejectedCases.push({ title: mystery.title, premise: mystery.story.slice(0, 220), characters: mystery.suspects.map(({ name }) => name), evidence: mystery.clues.map(({ name }) => name) });
            const duplicateError = new Error("Gemini returned a case too similar to recent content.");
            duplicateError.code = "REPEATED_CASE";
            lastError = duplicateError;
            repeated = true;
            break;
          }
          const generated = {
            ...mystery,
            generation_id: generationId,
            generation_source: "gemini",
          };
          this.recentCases.push(projectPriorCase(generated));
          this.recentCases = this.recentCases.slice(-8);
          return generated;
        } catch (error) {
          lastError = error;
          if (candidateReceived) {
            invalidCandidate = true;
            rejectedCases.push({
              validationIssue: error instanceof z.ZodError
                ? `response validation failed at ${error.issues[0]?.path.join(".") || "unknown field"}`
                : String(error.message || "Generated response was invalid").slice(0, 180),
            });
          }
          console.warn("[GeminiService] Case generation attempt failed.", {
            model,
            status: error.status || error.statusCode || null,
            code: error.code || null,
            errorType: error.name || "Error",
            reason: error instanceof z.ZodError
              ? `response validation failed at ${error.issues[0]?.path.join(".") || "unknown field"}`
              : error instanceof SyntaxError
                ? "response JSON could not be parsed"
                : error.status || error.statusCode || error.code
                  ? "Gemini API request failed"
                  : String(error.message || "Unknown error").slice(0, 180),
          });
        }
      }
      if (!repeated) {
        if (attempt === 0 && invalidCandidate) continue;
        break;
      }
    }

    const providerStatus = Number(lastError?.status || lastError?.statusCode || 0);
    const transientProviderFailure = [408, 429, 500, 502, 503, 504].includes(providerStatus) ||
      ["UNAVAILABLE", "RESOURCE_EXHAUSTED"].includes(lastError?.code);
    const invalidResponse = lastError instanceof SyntaxError || lastError instanceof z.ZodError;
    const message = transientProviderFailure
      ? "Gemini is temporarily busy. Please wait a moment and try generating the case again."
      : providerStatus === 401 || providerStatus === 403
        ? "Gemini rejected the server credentials. Please contact the app administrator."
        : invalidResponse
          ? "Gemini returned an incomplete case. Please retry; no case was saved."
          : "Mind Maze could not generate a valid case. Please try again in a moment.";
    const error = new Error(message);
    error.statusCode = transientProviderFailure ? 503 : providerStatus === 401 || providerStatus === 403 ? 503 : 502;
    error.retryable = transientProviderFailure || invalidResponse || !providerStatus;
    error.cause = lastError;
    throw error;
  }

  async evaluateGuess({ game, answer = "", suspect_id, suspect_name }) {
    const marker = game.solution.match(/^Guilty suspect:\s*(suspect_[123])\s*[-—–:]\s*([^.!\n]+)/i);
    const culprit = game.suspects.find(({ id, name }) => id === marker?.[1] && name.toLocaleLowerCase() === marker?.[2].trim().toLocaleLowerCase());
    const accused = game.suspects.find(({ id, name }) => id === suspect_id || (suspect_name && name.toLocaleLowerCase() === suspect_name.toLocaleLowerCase()));
    const namesTheCulprit = !suspect_id && !suspect_name && answer.toLocaleLowerCase().includes(culprit?.name.toLocaleLowerCase() || "\u0000");
    const accusedCorrectly = Boolean(culprit && (accused?.id === culprit.id || namesTheCulprit));
    if (accusedCorrectly) {
      return { isCorrect: true, guiltyName: culprit.name, feedback: `Correct! ${culprit.name} did it.` };
    }

    return {
      isCorrect: false,
      feedback: "That is not the right person. Check the clues and try again.",
    };
  }
}

export const geminiService = new GeminiService();
