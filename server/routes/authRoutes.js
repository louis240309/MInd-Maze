import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateBody, registerSchema, loginSchema } from "../middleware/validation.js";

const router = express.Router();

/**
 * Helper to generate JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn }
  );
};

/**
 * POST /api/auth/register
 * Registers a new detective user
 */
router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.validatedBody;

      // Check if email already registered
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error("[Register] Check error:", checkError);
        return res.status(500).json({
          success: false,
          message: "Database error during registration check.",
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "An account with this email address already exists. Please log in.",
        });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user record
      const now = new Date().toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            password_hash,
            created_at: now,
            updated_at: now,
          },
        ])
        .select("id, name, email, created_at")
        .single();

      if (insertError) {
        console.error("[Register] Insert error:", insertError);
        return res.status(500).json({
          success: false,
          message: "Failed to create user account.",
        });
      }

      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: "Account created successfully. Welcome to MindMaze!",
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues JWT
 */
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.validatedBody;

      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("id, name, email, password_hash, created_at")
        .eq("email", email)
        .maybeSingle();

      if (fetchError) {
        console.error("[Login] Fetch error:", fetchError);
        return res.status(500).json({
          success: false,
          message: "Database query error during login.",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const token = generateToken(user);

      res.json({
        success: true,
        message: "Welcome back, Detective!",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session
 */
router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, created_at, updated_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User session expired or user no longer exists.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Sign out endpoint
 */
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Successfully logged out.",
  });
});

export default router;

