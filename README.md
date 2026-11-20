# MindMaze — AI-Powered Mystery Investigation Game

MindMaze is a full-stack detective game powered by generative AI. Step into the role of a consulting detective examining procedurally generated criminal investigations. Every case is uniquely generated with a triad of suspects, three cryptographic clues, progressive hints, and a secret solution encrypted until solved.

---

## 🔍 Features

- **Authentication & Security**
  - Registration, Login, Logout with bcrypt password hashing (10 rounds) and JWT authentication.
  - Strict user data isolation: all queries filter by verified `req.user.id`.
  - Rate-limiting on authentication and AI generation endpoints using `express-rate-limit`.
  - Input validation using Zod schemas for all client payloads.

- **AI Mystery Generation (Backend-Only via Gemini)**
  - Powered by Google Gemini using the `@google/genai` SDK.
  - Generates 3 suspects (with motives, alibis, and interrogation statements) and 3 clues (physical, forensic, documentary, or testimonial).
  - Validates AI responses against strict Zod schemas.
  - Secret solutions and unearned hints are never exposed through API responses before solving.
  - Live Gemini generation is required to open a new case; temporary provider failures return a retryable error instead of a sample case.

- **Interactive Investigation Gameplay**
  - **Crime Scene Dossier**: Atmospheric incident report detailing the crime scene.
  - **Suspect Interrogations**: Review statements and select suspects directly to accuse.
  - **Forensic Evidence Locker**: Examine clues, timestamps, and physical descriptions.
  - **Forensic Hint System**: Unlock up to 3 progressive hints to assist deductive analysis.
  - **Accusation Console**: Formally indict suspects and explain deduction to receive immediate forensic evaluation.

- **AI Visual Case Files**
  - Generates case-specific scene photographs, evidence images, and fictional suspect portraits through Gemini's image model.
  - Presents a visual evidence gallery, suspect files, image viewer, and investigation board while keeping clues and accusations playable if images are unavailable.
  - Stores image metadata in PostgreSQL and image files in a private Supabase Storage bucket; owner-checked API routes issue expiring image links.
  - Image generation runs after a case is saved. It requires image-model quota/billing; image failures do not discard the mystery.

- **Case Management & Dashboard**
  - View real-time statistics: total cases, active investigations, solved cases, and accuracy rate.
  - Earn 100/200/300 points for easy/medium/hard cases; each hint used lowers the award by 25 points.
  - Filter by status (`active`, `solved`, `archived`) and difficulty (`easy`, `medium`, `hard`).
  - Search case files by title or story keywords and sort chronologically.
  - Full CRUD operations: create, read, edit titles, archive/restore, and delete cases.

- **Visual Design**
  - Dark midnight theme with deep charcoal/navy backgrounds (`#07090e`, `#0d111a`).
  - Electric purple and cyan glowing accents.
  - Responsive layout built with React, Lucide icons, and modern CSS.

---

## 🛠️ Stack

- **Frontend**: React 19, Vite, React Router 7, Axios, Lucide React
- **Backend**: Node.js, Express 5, Supabase PostgreSQL, `@google/genai`, bcryptjs, jsonwebtoken, Zod, Helmet, express-rate-limit
- **Ports**: Backend on `5001`, Frontend on `5173`

---

## 🚀 Setup and Run Instructions

### 1. Prerequisites
- Node.js (v22+; required by the installed Google GenAI SDK)
- npm or yarn

### 2. Backend Configuration
The backend runs from the `server/` directory:
```bash
cd server
npm install
```

Configure your environment variables in `server/.env` (reference `server/.env.example`):
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite # Optional primary model; server tries supported fallbacks
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
SUPABASE_VISUAL_BUCKET=case-visuals
```

Before deploying the visual case-file pipeline, apply `supabase/migrations/20261120210000_case_visual_files.sql` to the Supabase project. This creates the private storage bucket and server-only metadata/job tables. For Render, set the same `GEMINI_IMAGE_MODEL` and `SUPABASE_VISUAL_BUCKET` values in the service environment.

Start the backend:
```bash
npm start
# or for live reload:
npm run dev
```

### 3. Frontend Configuration
The frontend runs from the `client/` directory:
```bash
cd client
npm install
```

Ensure `client/.env` has:
```env
VITE_API_URL=http://localhost:5001/api
```

Start the frontend development server:
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## Render deployment

Deploy this repository from [render.yaml](./render.yaml) as a Render Blueprint. It configures one Node.js web service that builds the React client and serves it together with the Express API.
The deployed API is available at [https://mind-maze-9nxv.onrender.com](https://mind-maze-9nxv.onrender.com). The frontend uses `VITE_API_URL` when set and otherwise defaults to this API; the `/api` suffix is added if omitted. In Vercel, set `VITE_API_URL` to `https://mind-maze-9nxv.onrender.com/api`. In Render, set `CLIENT_URL` to `https://m-ind-maze.vercel.app` so browser requests pass CORS checks.

If you configure the service manually, use:
- **Build Command:** `npm ci --prefix client && npm run build --prefix client && npm ci --omit=dev --prefix server`
- **Start Command:** `npm start --prefix server`
- **Health Check Path:** `/api/health`

Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` in the Render environment. The build command must be `npm run build` within `client/`; never use `npm build` at the repository root.

Apply new SQL files in `supabase/migrations/` to the Supabase project before deploying backend changes that use new database columns.

---

## 🔑 Gemini API Key Configuration

To enable live AI generation using Gemini:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `server/.env`:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
3. Restart the server (`npm start` in `server/`).

Mind Maze requires a server-side `GEMINI_API_KEY` to generate cases. Case generation returns a retryable service error when Gemini is unavailable; it never substitutes a repeated sample mystery. Keep this key in `server/.env` only. Never use a `VITE_` variable for the Gemini key. The Gemini Developer API currently lists `gemini-3.5-flash-lite` as a supported model identifier; the service also tries its configured fallback identifiers. [Google's model list](https://ai.google.dev/gemini-api/docs/models)

---

## 🧪 Testing

To test the frontend build:
```bash
cd client
npm run build
npm run lint
```

The server integration audit is available with `cd server && npm test`. It requires working Gemini and Supabase credentials and creates then removes temporary test records.
