import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import { dictionaryLimiter, gameGenLimiter, sceneInspectionLimiter } from "../middleware/rateLimiter.js";
import {
  validateBody,
  createGameSchema,
  updateGameSchema,
  solveGameSchema,
  dictionaryLookupSchema,
  sceneInspectionSchema,
} from "../middleware/validation.js";
import { gameService } from "../services/gameService.js";
import { caseVisualService } from "../services/caseVisualService.js";
import { dictionaryService, isVisibleDictionaryContext } from "../services/dictionaryService.js";

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
      const { difficulty, theme, generation_id: generationId } = req.validatedBody;
      const newGame = await gameService.createMystery(req.user.id, {
        difficulty,
        theme,
        generationId,
      });

      res.status(201).json({
        success: true,
        message: "Your new case is ready.",
        game: newGame,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Case-specific local artwork is returned only after verifying case ownership.
router.get("/:id/visuals", async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);
    if (!game) return res.status(404).json({ success: false, message: "Case file not found or access restricted." });
    res.set("Cache-Control", "no-store");
    const visuals = await caseVisualService.getAssets(game);
    res.json({ success: true, visuals });
  } catch (error) { next(error); }
});

router.post("/:id/visuals/retry", async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);
    if (!game) return res.status(404).json({ success: false, message: "Case file not found or access restricted." });
    const visuals = await caseVisualService.getAssets(game);
    res.json({ success: true, message: "Free case visuals are ready.", visuals });
  } catch (error) { next(error); }
});

router.get("/:id/scene", async (req, res, next) => {
  try {
    const scene = await gameService.getCrimeScene(req.params.id, req.user.id);
    if (!scene) return res.status(404).json({ success: false, message: "Case not found." });
    res.set("Cache-Control", "no-store");
    res.json({ success: true, scene });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/scene/areas/:areaId/photo", async (req, res, next) => {
  try {
    const photo = await gameService.getCrimeSceneAreaPhoto(req.params.id, req.user.id, req.params.areaId);
    if (photo === undefined) return res.status(404).json({ success: false, message: "Case not found." });
    res.set("Cache-Control", photo ? "private, max-age=86400" : "private, no-store");
    res.json({ success: true, photo });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/scene/inspect",
  sceneInspectionLimiter,
  validateBody(sceneInspectionSchema),
  async (req, res, next) => {
    try {
      const { object_id, action } = req.validatedBody;
      const result = await gameService.inspectCrimeSceneObject(
        req.params.id,
        req.user.id,
        object_id,
        action
      );
      if (!result) return res.status(404).json({ success: false, message: "Case not found." });
      res.set("Cache-Control", "no-store");
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

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

router.post("/:id/dictionary/define", dictionaryLimiter, validateBody(dictionaryLookupSchema), async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user.id);
    if (!game) return res.status(404).json({ success: false, message: "Case not found." });

    const { word, context } = req.validatedBody;
    if (!isVisibleDictionaryContext(game, word, context)) {
      return res.status(400).json({ success: false, message: "Word help can use only text already shown in this case." });
    }

    const definition = await dictionaryService.define({ word, context });
    res.set("Cache-Control", "private, max-age=300");
    res.json({ success: true, definition });
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
        message: "Case updated.",
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
