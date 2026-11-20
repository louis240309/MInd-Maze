import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { supabase } from "./config/supabase.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

// Security headers with Helmet
app.use(helmet());

// Cross-Origin Resource Sharing
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const allowedOrigins = new Set([clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json({ limit: "1mb" }));

// General Rate Limiting
app.use("/api", apiLimiter);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    name: "MindMaze API",
    version: "1.0.0",
    description: "AI-Powered Mystery Investigation Game API",
    status: "online",
  });
});

// Database & Service Health Check
app.get("/api/health", async (req, res) => {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    if (error) {
      return res.status(500).json({
        status: "degraded",
        database: "disconnected",
        aiService: process.env.GEMINI_API_KEY ? "configured" : "unavailable",
      });
    }

    res.json({
      status: "healthy",
      database: "connected",
      aiService: hasGemini ? "gemini-configured" : "unavailable",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Mount Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "127.0.0.1";

const server = app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error(`[MindMaze] Failed to listen on ${HOST}:${PORT}: ${error.code || error.message}`);
    process.exitCode = 1;
    return;
  }

  server.ref();
  console.log(`[MindMaze] Server running on port ${PORT}`);
  console.log(`[MindMaze] Allowed client: ${clientUrl}`);
});
