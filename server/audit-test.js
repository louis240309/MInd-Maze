import dotenv from "dotenv";
dotenv.config();

import { supabase } from "./config/supabase.js";
import { geminiService } from "./services/geminiService.js";
import { gameService } from "./services/gameService.js";
import bcrypt from "bcryptjs";

async function runComprehensiveAudit() {
  let userA;
  let userB;
  let gameId;
  try {
  console.log("==========================================================");
  console.log("       MINDMAZE AUDIT & LIVE GEMINI VERIFICATION          ");
  console.log("==========================================================");

  // 1. Check Gemini API Key and Model configuration
  console.log("\n[Audit 1] Verifying Gemini API Configuration...");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in server/.env!");
  }
  console.log("✓ GEMINI_API_KEY is detected in environment.");
  console.log("✓ Gemini Service configured status:", geminiService.isConfigured());

  // 2. Generate five consecutive cases with identical settings. Each response
  // must be a live Gemini result with a distinct mystery, not just a new title.
  console.log("\n[Audit 2] Generating five live Cyberpunk Syndicate / medium cases...");
  const repeatedSettingCases = [];
  for (let index = 0; index < 5; index += 1) {
    const generated = await geminiService.generateMystery({
      theme: "Cyberpunk Syndicate",
      difficulty: "medium",
      recentCases: repeatedSettingCases,
    });
    if (generated.generation_source !== "gemini" || !generated.generation_id) {
      throw new Error(`Case ${index + 1} was missing its live Gemini source or generation identifier.`);
    }
    if (generated.suspects.length !== 3 || generated.clues.length !== 3 || generated.hints.length !== 3) {
      throw new Error(`Case ${index + 1} did not include three suspects, clues, and hints.`);
    }
    repeatedSettingCases.push(generated);
    console.log(`  ${index + 1}. ${generated.title} — ${generated.suspects.map(({ name }) => name).join(", ")} — ${generated.clues.map(({ name }) => name).join(", ")}`);
  }

  const normalize = (value) => value.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const titles = new Set(repeatedSettingCases.map(({ title }) => normalize(title)));
  const stories = new Set(repeatedSettingCases.map(({ story }) => normalize(story)));
  const solutions = new Set(repeatedSettingCases.map(({ solution }) => normalize(solution)));
  const generationIds = new Set(repeatedSettingCases.map(({ generation_id }) => generation_id));
  const motiveProfiles = repeatedSettingCases.map(({ suspects }) =>
    suspects.map(({ motive }) => normalize(motive)).sort().join("|")
  );
  const allSuspectNames = repeatedSettingCases.flatMap(({ suspects }) => suspects.map(({ name }) => normalize(name)));
  const allClueNames = repeatedSettingCases.flatMap(({ clues }) => clues.map(({ name }) => normalize(name)));
  if (titles.size !== 5 || stories.size !== 5 || solutions.size !== 5 || generationIds.size !== 5) {
    throw new Error("Five same-setting cases did not have unique titles, premises, and solutions.");
  }
  if (new Set(allSuspectNames).size !== 15 || new Set(allClueNames).size !== 15 || new Set(motiveProfiles).size !== 5) {
    throw new Error("Five same-setting cases reused suspect/clue names or motive profiles.");
  }
  if (repeatedSettingCases.some(({ suspects }) => new Set(suspects.map(({ motive }) => normalize(motive))).size !== 3)) {
    throw new Error("A case reused a suspect motive within its own cast.");
  }
  console.log("✓ All five live cases have distinct premises, titles, casts, clues, and solutions.");

  const case1 = repeatedSettingCases[0];

  // 3. Generate another live mystery with a different theme and difficulty.
  console.log("\n[Audit 3] Generating a Victorian Gaslit Manor / hard case...");
  const case2 = await geminiService.generateMystery({
    theme: "Victorian Gaslit Manor",
    difficulty: "hard",
    recentCases: repeatedSettingCases,
  });

  console.log(`✓ Case 2 Title: "${case2.title}"`);
  console.log(`  Story excerpt: "${case2.story.slice(0, 90)}..."`);
  console.log(`  Suspects (${case2.suspects.length}): ${case2.suspects.map((s) => s.name).join(", ")}`);
  console.log(`  Clues (${case2.clues.length}): ${case2.clues.map((c) => c.name).join(", ")}`);

  if (case2.difficulty !== "hard" || case1.title === case2.title || case1.story === case2.story) {
    throw new Error("FAIL: Different theme/difficulty case did not generate fresh matching content.");
  }
  console.log("✓ Verified: Cases 1 and 2 are completely unique, fresh, and theme-specific.");

  console.log("\n[Audit 3b] Verifying the remaining built-in case themes...");
  for (const { theme, difficulty } of [
    { theme: "Deep Space Outpost", difficulty: "easy" },
    { theme: "Mountain Lodge", difficulty: "medium" },
  ]) {
    const themedCase = await geminiService.generateMystery({
      theme,
      difficulty,
      recentCases: [...repeatedSettingCases, case2],
    });
    if (themedCase.difficulty !== difficulty || [...repeatedSettingCases, case2].some(({ title, story }) => title === themedCase.title || story === themedCase.story)) {
      throw new Error(`Theme coverage case failed for ${theme} / ${difficulty}.`);
    }
    console.log(`  ✓ ${theme} / ${difficulty}: ${themedCase.title}`);
  }

  // 4. Test User & Database Operations
  console.log("\n[Audit 4] Testing User Authentication & Supabase Operations...");
  const testEmail1 = `sleuth_a_${Date.now()}@mindmaze.test`;
  const testEmail2 = `sleuth_b_${Date.now()}@mindmaze.test`;

  const { data: createdUserA, error: userAError } = await supabase
    .from("users")
    .insert([{ name: "Detective Alpha", email: testEmail1, password_hash: await bcrypt.hash("pass123", 10) }])
    .select()
    .single();
  if (userAError) throw userAError;
  userA = createdUserA;

  const { data: createdUserB, error: userBError } = await supabase
    .from("users")
    .insert([{ name: "Detective Beta", email: testEmail2, password_hash: await bcrypt.hash("pass123", 10) }])
    .select()
    .single();
  if (userBError) throw userBError;
  userB = createdUserB;

  console.log(`✓ Created test User A (${userA.id}) and User B (${userB.id})`);

  // 5. Test Game Persistence & Security Redaction
  console.log("\n[Audit 5] Testing Game Creation, Ownership & Solution Redaction...");
  const savedGame = await gameService.createMystery(userA.id, {
    theme: "Art Gallery Heist",
    difficulty: "easy",
  });
  gameId = savedGame.id;

  console.log(`✓ Created game "${savedGame.title}" (ID: ${savedGame.id}) for User A`);
  console.log(`  Sanitized solution field: ${savedGame.solution} (MUST be null before solved)`);
  if (savedGame.solution !== null) {
    throw new Error("SECURITY BREACH: Solution leaked before case solved!");
  }
  const storyKeyword = savedGame.story.match(/[A-Za-z]{8,}/)?.[0];
  const storySearchResults = await gameService.listUserGames(userA.id, { search: storyKeyword });
  if (!storyKeyword || !storySearchResults.some(({ id }) => id === savedGame.id)) {
    throw new Error("Case search did not find a saved dossier by a word from its story.");
  }
  console.log("✓ Case history can search within story text.");

  // 6. Test User Ownership Enforcement
  console.log("\n[Audit 6] Testing Ownership Access Isolation...");
  const userBFetch = await gameService.getGameById(savedGame.id, userB.id);
  if (userBFetch !== null) {
    throw new Error("SECURITY BREACH: User B could access User A's case!");
  }
  console.log("✓ User B cannot access User A's case (returned null as expected).");

  // 7. Test Hints Limit
  console.log("\n[Audit 7] Testing Hint Progression & 3-Hint Limit...");
  const h1 = await gameService.requestHint(savedGame.id, userA.id);
  const h2 = await gameService.requestHint(savedGame.id, userA.id);
  const h3 = await gameService.requestHint(savedGame.id, userA.id);
  const h4 = await gameService.requestHint(savedGame.id, userA.id);

  console.log(`  Hint 1 count: ${h1.hint_count}, Hint 2 count: ${h2.hint_count}, Hint 3 count: ${h3.hint_count}`);
  console.log(`  Hint 4 error response: "${h4.error}"`);
  if (!h4.error) throw new Error("Hint limit failed to enforce maximum of 3!");
  console.log("✓ Maximum 3 hints enforced successfully.");

  // 8. Test Answer Evaluation & Solution Revelation
  console.log("\n[Audit 8] Testing Answer Evaluation & Solution Revelation...");
  const wrongRes = await gameService.solveMystery(savedGame.id, userA.id, {
    answer: "I suspect this person because they had an argument.",
    suspect_id: "suspect_99",
    suspect_name: "Nonexistent Person",
  });
  console.log(`  Incorrect accusation response: correct = ${wrongRes.correct}, solution = ${wrongRes.solution}`);
  if (wrongRes.correct !== false || wrongRes.solution) {
    throw new Error("SECURITY BREACH: Incorrect answer marked correct or leaked solution!");
  }

  // Fetch raw game to extract true culprit for test
  const rawGame = await gameService._getRawGame(savedGame.id, userA.id);
  // Find culprit
  const culpritMarker = rawGame.solution.match(/^Guilty suspect:\s*(suspect_[123])\s*[—-]\s*([^.\n]+)/i);
  const culprit = rawGame.suspects.find((suspect) =>
    suspect.id === culpritMarker?.[1] && suspect.name.toLowerCase() === culpritMarker?.[2].trim().toLowerCase()
  );
  if (!culprit) throw new Error("Could not identify the generated case culprit from its validated solution marker.");
  const correctRes = await gameService.solveMystery(savedGame.id, userA.id, {
    answer: `The culprit is ${culprit.name}: ${rawGame.clues[0].name} ties them to the scene, and the timeline contradicts their alibi.`,
    suspect_id: culprit.id,
    suspect_name: culprit.name,
  });

  console.log(`  Correct accusation response: correct = ${correctRes.correct}, status = ${correctRes.status}`);
  if (!correctRes.correct || !correctRes.solution) {
    throw new Error("FAIL: Correct answer failed to reveal solution!");
  }
  console.log("✓ Solution properly revealed only upon verified solve.");

  console.log("\n==========================================================");
  console.log("    ALL GEMINI & SECURITY AUDIT CHECKS PASSED (100%)      ");
  console.log("==========================================================");
  } finally {
    console.log("\n[Audit] Removing temporary test records...");
    if (gameId && userA?.id) await gameService.deleteGame(gameId, userA.id).catch((error) => console.error("Case cleanup failed:", error.message));
    if (userA?.id) await supabase.from("users").delete().eq("id", userA.id);
    if (userB?.id) await supabase.from("users").delete().eq("id", userB.id);
  }
}

runComprehensiveAudit().then(() => process.exit(0)).catch(err => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});

