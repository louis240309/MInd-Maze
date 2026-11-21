import express from "express";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import helmet from "helmet";
import { supabase } from "./config/supabase.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { scenePhotoService } from "./services/scenePhotoService.js";

dotenv.config();

console.info(`[MindMaze] Unsplash photo lookup: ${scenePhotoService.isConfigured() ? "configured" : "not configured; using SVG scenes"}.`);
const app = express();

// Security headers with Helmet. Unsplash images are served directly from its CDN.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://images.unsplash.com"],
    },
  },
}));

// Cross-Origin Resource Sharing
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  clientUrl,
  "https://m-ind-maze.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const vercelPreviewOrigin = /^https:\/\/m-ind-maze(?:-[a-z0-9]+)*\.vercel\.app$/;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || vercelPreviewOrigin.test(origin)) {
        return callback(null, true);
      }
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
        scenePhotos: scenePhotoService.isConfigured() ? "unsplash-configured" : "svg-fallback",
      });
    }

    res.json({
      status: "healthy",
      database: "connected",
      aiService: hasGemini ? "gemini-configured" : "unavailable",
      scenePhotos: scenePhotoService.isConfigured() ? "unsplash-configured" : "svg-fallback",
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
const clientDistDirectory = path.resolve(serverDirectory, "..", "client", "dist");
const clientIndexPath = path.join(clientDistDirectory, "index.html");
if (process.env.NODE_ENV === "production" && !existsSync(clientIndexPath)) {
  console.error(`[MindMaze] Frontend build is missing at ${clientIndexPath}. Run the Render build command before starting the server.`);
  process.exit(1);
}
app.use(express.static(clientDistDirectory));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(clientIndexPath);
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
