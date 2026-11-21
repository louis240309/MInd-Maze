import { z } from "zod";

// Middleware to validate req.body against a Zod schema
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const message = issue ? `${issue.path.join(".") || "Field"}: ${issue.message}` : "Validation failed";
      return res.status(400).json({
        success: false,
        message,
        errors: error.issues,
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid request payload.",
    });
  }
};

// Authentication Schemas
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name cannot exceed 60 characters"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Game Schemas
export const createGameSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  theme: z.string().trim().max(100).optional().default("Noir Detective"),
});

export const updateGameSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150, "Title is too long").optional(),
  status: z.enum(["active", "solved", "archived"]).optional(),
}).refine(data => data.title !== undefined || data.status !== undefined, {
  message: "Either title or status must be provided for update",
});

export const solveGameSchema = z.object({
  answer: z.string().trim().max(1500, "Answer is too long").optional().default(""),
  suspect_id: z.string().trim().optional(),
  suspect_name: z.string().trim().optional(),
}).refine(data => data.answer || data.suspect_id || data.suspect_name, {
  message: "Choose a suspect.",
  path: ["suspect_id"],
});

export const dictionaryLookupSchema = z.object({
  word: z.string().trim().min(1).max(60).regex(/^[\p{L}][\p{L}' -]*$/u, "Enter one word or short phrase."),
  context: z.string().trim().max(280).optional().default(""),
});

export const sceneInspectionSchema = z.object({
  object_id: z.string().regex(/^(object_[1-9]|legacy_object_[1-9])$/),
  action: z.enum(["inspect", "closer"]),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name cannot exceed 60 characters"),
});
