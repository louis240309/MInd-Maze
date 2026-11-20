import { supabase } from "../config/supabase.js";
import { geminiService } from "./geminiService.js";
import { randomUUID } from "node:crypto";

export class GameService {
  /**
   * Sanitizes a game object so confidential solutions and unrevealed hints are not leaked
   */
  static sanitizeGame(game) {
    if (!game) return null;
    const isSolved = game.status === "solved";
    const revealedHintCount = Math.min(game.hint_count || 0, 3);
    const allHints = Array.isArray(game.hints) ? game.hints : [];

    return {
      id: game.id,
      generation_id: game.generation_id || game.id,
      user_id: game.user_id,
      title: game.title,
      difficulty: game.difficulty,
      story: game.story,
      suspects: game.suspects,
      clues: game.clues,
      hint_count: revealedHintCount,
      // Only include hints up to hint_count
      hints: allHints.slice(0, revealedHintCount),
      total_hints: 3,
      status: game.status,
      // Strictly reveal solution ONLY if the game has been solved
      solution: isSolved ? game.solution : null,
      created_at: game.created_at,
      updated_at: game.updated_at,
    };
  }

  /**
   * List games for a specific user with filtering, sorting, and pagination
   */
  async listUserGames(userId, { status, difficulty, search, sort = "newest" } = {}) {
    let query = supabase
      .from("games")
      .select("*")
      .eq("user_id", userId);
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sort === "difficulty") {
      query = query.order("difficulty", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GameService.listUserGames] Supabase error:", error);
      throw new Error("Failed to retrieve cases from database.");
    }

    const searchTerm = String(search || "").trim().toLocaleLowerCase();
    const filteredGames = searchTerm
      ? (data || []).filter((game) => `${game.title || ""} ${game.story || ""}`.toLocaleLowerCase().includes(searchTerm))
      : data || [];

    return filteredGames.map(GameService.sanitizeGame);
  }

  /**
   * Retrieve a single game owned by userId
   */
  async getGameById(gameId, userId) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return GameService.sanitizeGame(data);
  }

  /**
   * Internal helper to fetch raw game including solution for evaluation
   */
  async _getRawGame(gameId, userId) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Generate and persist a new mystery investigation
   */
  async createMystery(userId, { difficulty = "medium", theme = "Noir Detective" }) {
    const generationId = randomUUID();
    // Give Gemini the player's recent case premises so it can avoid repetition.
    const { data: recentCases, error: historyError } = await supabase
      .from("games")
      .select("title, story, suspects, clues")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (historyError) {
      console.error("[GameService.createMystery] Recent-case lookup failed:", historyError.message);
      const error = new Error("Could not load your recent case history. Please retry in a moment.");
      error.statusCode = 503;
      error.retryable = true;
      error.cause = historyError;
      throw error;
    }

    const mystery = await geminiService.generateMystery({ difficulty, theme, recentCases: recentCases || [], generationId });

    const newGame = {
      // The existing UUID primary key doubles as the unique generation identifier.
      id: generationId,
      user_id: userId,
      title: mystery.title,
      difficulty: mystery.difficulty,
      story: mystery.story,
      suspects: mystery.suspects,
      clues: mystery.clues,
      hints: mystery.hints,
      solution: mystery.solution,
      hint_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("games")
      .insert([newGame])
      .select()
      .single();

    if (error) {
      console.error("[GameService.createMystery] Insert failed:", error.code || error.status || "database error");
      const saveError = new Error("Gemini created the case, but Supabase could not save it. No case was opened; please retry.");
      saveError.statusCode = 503;
      saveError.retryable = true;
      saveError.cause = error;
      throw saveError;
    }

    return GameService.sanitizeGame(data);
  }

  /**
   * Update game title or allowed status fields (active, solved, archived)
   */
  async updateGame(gameId, userId, updates) {
    const allowed = {};
    if (updates.title !== undefined) allowed.title = updates.title.trim();
    if (updates.status !== undefined) allowed.status = updates.status;
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("games")
      .update(allowed)
      .eq("id", gameId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[GameService.updateGame] Update error:", error);
      throw new Error("Failed to update case.");
    }

    return GameService.sanitizeGame(data);
  }

  /**
   * Delete game ensuring ownership
   */
  async deleteGame(gameId, userId) {
    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId)
      .eq("user_id", userId);

    if (error) {
      console.error("[GameService.deleteGame] Delete error:", error);
      throw new Error("Failed to delete case.");
    }

    return { success: true, message: "Case successfully removed from records." };
  }

  /**
   * Request next hint (maximum 3 hints allowed)
   */
  async requestHint(gameId, userId) {
    const game = await this._getRawGame(gameId, userId);
    if (!game) {
      return { error: "Case not found or access denied.", status: 404 };
    }

    const currentHintCount = game.hint_count || 0;
    if (currentHintCount >= 3) {
      return {
        error: "Maximum of 3 hints already used for this investigation.",
        status: 400,
        hints: (game.hints || []).slice(0, 3),
      };
    }

    const newHintCount = currentHintCount + 1;
    const allHints = Array.isArray(game.hints) ? game.hints : [];
    const unlockedHint = allHints[newHintCount - 1] || "Examine the inconsistencies in the suspects' statements.";

    const { error } = await supabase
      .from("games")
      .update({
        hint_count: newHintCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .eq("user_id", userId);

    if (error) {
      console.error("[GameService.requestHint] Update error:", error);
      throw new Error("Failed to unlock hint.");
    }

    return {
      success: true,
      hint_count: newHintCount,
      hints_remaining: 3 - newHintCount,
      new_hint: unlockedHint,
      unlocked_hints: allHints.slice(0, newHintCount),
    };
  }

  /**
   * Submit accusation and evaluate deduction
   */
  async solveMystery(gameId, userId, { answer, suspect_id, suspect_name }) {
    const game = await this._getRawGame(gameId, userId);
    if (!game) {
      return { error: "Case not found or access denied.", status: 404 };
    }

    if (game.status === "solved") {
      return {
        success: true,
        already_solved: true,
        correct: true,
        message: "This mystery has already been successfully solved!",
        solution: game.solution,
        status: "solved",
      };
    }

    // Evaluate answer against game solution
    const evaluation = await geminiService.evaluateDeduction({
      game,
      answer,
      suspect_id,
      suspect_name,
    });

    if (evaluation.isCorrect) {
      // Mark game as solved in database
      const { data: updatedCase, error } = await supabase
        .from("games")
        .update({
          status: "solved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      if (error || !updatedCase) {
        console.error("[GameService.solveMystery] Status update error:", error);
        const saveError = new Error("Your deduction was correct, but the case status could not be saved. Please retry; the solution remains sealed until the update succeeds.");
        saveError.statusCode = 503;
        saveError.retryable = true;
        saveError.cause = error || new Error("Case update returned no matching row.");
        throw saveError;
      }

      return {
        success: true,
        correct: true,
        status: "solved",
        feedback: evaluation.feedback,
        solution: game.solution,
      };
    }

    // If incorrect, give useful feedback and NEVER reveal solution
    return {
      success: true,
      correct: false,
      status: game.status,
      feedback: evaluation.feedback,
      hints_remaining: Math.max(0, 3 - (game.hint_count || 0)),
    };
  }

  /**
   * Calculate detective statistics for user
   */
  async getUserStatistics(userId) {
    const { data: games, error } = await supabase
      .from("games")
      .select("id, status, difficulty, hint_count")
      .eq("user_id", userId);

    if (error) {
      console.error("[GameService.getUserStatistics] Error:", error);
      throw new Error("Failed to compute user statistics.");
    }

    const total = games ? games.length : 0;
    const solved = games ? games.filter((g) => g.status === "solved").length : 0;
    const active = games ? games.filter((g) => g.status === "active").length : 0;
    const archived = games ? games.filter((g) => g.status === "archived").length : 0;
    const totalHintsUsed = games ? games.reduce((sum, g) => sum + (g.hint_count || 0), 0) : 0;
    const solveRate = total > 0 ? Math.round((solved / total) * 100) : 0;
    const avgHintsPerCase = total > 0 ? (totalHintsUsed / total).toFixed(1) : 0;

    // Determine Detective Rank
    let rank = "Cadet Investigator";
    let badgeColor = "#64748B"; // Slate
    if (solved >= 10) {
      rank = "Chief Detective Inspector";
      badgeColor = "#F59E0B"; // Amber Gold
    } else if (solved >= 5) {
      rank = "Senior Detective";
      badgeColor = "#8B5CF6"; // Purple
    } else if (solved >= 2) {
      rank = "Field Detective";
      badgeColor = "#38BDF8"; // Cyan
    } else if (solved >= 1) {
      rank = "Junior Sleuth";
      badgeColor = "#10B981"; // Emerald
    }

    return {
      total_cases: total,
      solved_cases: solved,
      active_cases: active,
      archived_cases: archived,
      solve_rate: solveRate,
      total_hints_used: totalHintsUsed,
      avg_hints_per_case: Number(avgHintsPerCase),
      detective_rank: rank,
      badge_color: badgeColor,
    };
  }
}

export const gameService = new GameService();

