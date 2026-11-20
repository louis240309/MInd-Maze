import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import { gameGenLimiter } from "../middleware/rateLimiter.js";
import {
  validateBody,
  createGameSchema,
  updateGameSchema,
  solveGameSchema,
} from "../middleware/validation.js";
import { gameService } from "../services/gameService.js";
import { caseVisualService } from "../services/caseVisualService.js";

const router = express.Router();

// Enforce authentication on all game routes
router.use(authenticateUser);

/**
 * GET /api/games
 * List cases for the authenticated user
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, difficulty, search, sort } = req.query;
    const games = await gameService.listUserGames(req.user.id, {
      status,
      difficulty,
      search,
      sort,
    });

    res.json({
      success: true,
      count: games.length,
      games,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/games/stats
 * Aggregate detective statistics for current user
 */
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await gameService.getUserStatistics(req.user.id);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/games
 * Generate and initialize a new mystery case
 */
router.post(
  "/",
  gameGenLimiter,
  validateBody(createGameSchema),
  async (req, res, next) => {
    try {
      res.set("Cache-Control", "no-store");
      const { difficulty, theme } = req.validatedBody;
      const newGame = await gameService.createMystery(req.user.id, {
        difficulty,
        theme,
      });
      caseVisualService.enqueue(newGame);

      res.status(201).json({
        success: true,
        message: "New case dossier opened successfully.",
        game: newGame,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Signed image URLs are issued only after verifying case ownership.
router.get("/:id/visuals", async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);
    if (!game) return res.status(404).json({ success: false, message: "Case file not found or access restricted." });
    res.set("Cache-Control", "no-store");
    const visuals = await caseVisualService.getAssets(game.id);
    if (visuals.status === "not_started") {
      caseVisualService.enqueue(game);
      visuals.status = "queued";
    }
    res.json({ success: true, visuals });
  } catch (error) { next(error); }
});

router.post("/:id/visuals/retry", gameGenLimiter, async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);
    if (!game) return res.status(404).json({ success: false, message: "Case file not found or access restricted." });
    if (!caseVisualService.canRetry(game.id)) return res.status(409).json({ success: false, message: "Visual generation is already running." });
    caseVisualService.enqueue(game, { retry: true });
    res.status(202).json({ success: true, message: "Visual case file retry started." });
  } catch (error) { next(error); }
});

/**
 * GET /api/games/:id
 * Retrieve details of a specific case file
 */
router.get("/:id", async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Case file not found or access restricted.",
      });
    }

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/games/:id
 * Update case title or status (active, solved, archived)
 */
router.put(
  "/:id",
  validateBody(updateGameSchema),
  async (req, res, next) => {
    try {
      const existing = await gameService.getGameById(req.params.id, req.user.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Case file not found or access restricted.",
        });
      }

      const updated = await gameService.updateGame(
        req.params.id,
        req.user.id,
        req.validatedBody
      );

      res.json({
        success: true,
        message: "Case dossier updated successfully.",
        game: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/games/:id
 * Delete a case file
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await gameService.getGameById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Case file not found or access restricted.",
      });
    }

    const result = await gameService.deleteGame(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/games/:id/hint
 * Request next available hint (max 3)
 */
router.post("/:id/hint", async (req, res, next) => {
  try {
    const result = await gameService.requestHint(req.params.id, req.user.id);

    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error,
        hints: result.hints,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/games/:id/solve
 * Submit accusation and evaluation
 */
router.post(
  "/:id/solve",
  validateBody(solveGameSchema),
  async (req, res, next) => {
    try {
      const { answer, suspect_id, suspect_name } = req.validatedBody;
      const result = await gameService.solveMystery(
        req.params.id,
        req.user.id,
        {
          answer,
          suspect_id,
          suspect_name,
        }
      );

      if (result.error) {
        return res.status(result.status || 400).json({
          success: false,
          message: result.error,
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/games/:id/archive
 * Quick action to archive a case
 */
router.post("/:id/archive", async (req, res, next) => {
  try {
    const existing = await gameService.getGameById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Case file not found or access restricted.",
      });
    }

    const updated = await gameService.updateGame(req.params.id, req.user.id, {
      status: "archived",
    });

    res.json({
      success: true,
      message: "Case archived.",
      game: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
