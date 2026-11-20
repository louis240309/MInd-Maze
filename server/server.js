import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

// Serve the built React application from the same web service.
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDistDirectory = path.resolve(serverDirectory, "../client/dist");
app.use(express.static(clientDistDirectory));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(clientDistDirectory, "index.html"));
  }
  next();
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start server


const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, "0.0.0.0", (error) => {
  if (error) {
    console.error(`[MindMaze] Server failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`[MindMaze] Server running on port ${PORT}`);
  console.log(`[MindMaze] Listening on 0.0.0.0`);
  console.log(`[MindMaze] Allowed client: ${clientUrl}`);
});
