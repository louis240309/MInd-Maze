import express from "express";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.js";
import { validateBody, updateProfileSchema } from "../middleware/validation.js";
import { gameService } from "../services/gameService.js";

const router = express.Router();

router.use(authenticateUser);

/**
 * GET /api/users/profile
 * Get current user profile and game statistics
 */
router.get("/profile", async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, created_at, updated_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const stats = await gameService.getUserStatistics(req.user.id);

    res.json({
      success: true,
      profile: {
        ...user,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/profile
 * Update user profile details
 */
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  async (req, res, next) => {
    try {
      const { name } = req.validatedBody;

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select("id, name, email, created_at, updated_at")
        .single();

      if (error) {
        console.error("[ProfileUpdate] Error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update profile.",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

