# MindMaze — AI-Powered Mystery Investigation Game

MindMaze is a full-stack detective game powered by generative AI. Step into the role of a consulting detective examining procedurally generated criminal investigations. Every case has three suspects, three clues, progressive hints, a case-specific crime scene, and a secret solution kept out of player responses until solved.

---

## 🔍 Features

- **Authentication & Security**
  - Registration, Login, Logout with bcrypt password hashing (10 rounds) and JWT authentication.
  - Strict user data isolation: all queries filter by verified `req.user.id`.
  - Rate-limiting on authentication and AI generation endpoints using `express-rate-limit`.
  - Input validation using Zod schemas for all client payloads.

- **AI Mystery Generation (Backend-Only via Gemini)**
  - Powered by Google Gemini using the `@google/genai` SDK.
  - Generates 3 suspects, 3 clues, and a matching scene with 3 locations and 9 clickable objects.
  - Validates AI responses against strict Zod schemas.
  - Secret solutions and unearned hints are never exposed through API responses before solving.
  - Live Gemini generation is required to open a new case; temporary provider failures return a retryable error instead of a sample case.

- **Interactive Investigation Gameplay**
  - **Crime Scene Exploration**: Inspect illustrated locations, examine objects, and reveal clues through closer inspection.
  - **Evidence Locker**: Collect clues from the scene and keep their discovery location and order with the existing case evidence.
  - **Evidence Questions**: Compare collected clues with each suspect's recorded statement without adding new case facts.
  - **Suspect Profiles**: Review statements and select suspects directly to accuse.
  - **Forensic Hint System**: Unlock up to 3 progressive hints to assist deductive analysis.
  - **Accusation Console**: Formally indict suspects and explain deduction to receive immediate forensic evaluation.

- **Free Visual Case Files**
  - Uses optional, theme-matched Unsplash location photographs with photographer attribution and original local SVG fallback art.
  - Shows an interactive illustrated room with clickable object markers, zoom, inspection notes, and case-specific document layouts. Stock photos are illustrative references, not depictions of fictional case evidence.
  - Reuses the existing evidence gallery, suspect profiles, investigation board, and documents.
  - Older cases keep their original clues and receive a harmless background scene for exploration.

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
```

Crime scene details are included in the existing Gemini text-generation request and stored in `games.crime_scene`. Object examinations and collected clue references are saved in `game_scene_discoveries`. The server checks case ownership and discovery requirements, and does not send locked clue details to the browser. Older cases without scene data keep their existing evidence and receive a local background scene.

Interactive scenes use original inline SVG artwork by default. If the optional server-only `UNSPLASH_ACCESS_KEY` is configured, the server searches for a landscape photo matching the scene theme and location when that location is first opened. The chosen image URL and attribution are saved in the existing `games.crime_scene` JSONB column, so opening the same case again does not repeat the search. Search results are also shared in a bounded 24-hour in-memory cache. Provider errors, missing keys, and image load failures keep the scene playable with its original SVG. Unsplash requires direct CDN hotlinking and photographer/Unsplash attribution; the UI links both. Its API demo limit is currently 50 metadata requests per hour, and production limits require Unsplash approval. See the [Unsplash API guidelines](https://unsplash.com/documentation) and [attribution rules](https://help.unsplash.com/api-guidelines/guideline-attribution).

Pixabay is not used for permanent scene backgrounds: its [official API documentation](https://pixabay.com/api/docs/) currently lists a default limit of 100 requests per 60 seconds and asks clients to cache API responses for 24 hours. It says image URLs are for temporary search-result display and images should be hosted by the app for permanent use. The project does not download or redistribute Pixabay images. No paid image-generation API or new storage bucket is used. The existing case report, suspect profile, evidence gallery, and investigation board remain in place.

The in-case Detective Dictionary includes local definitions for common mystery terms. Unknown words can be looked up through the existing Gemini text client. The server checks that any sentence sent as context is already visible in the player's case, sends only that short sentence and the requested word, and keeps successful explanations in a bounded in-memory cache.

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

Deploy this repository from [render.yaml](./render.yaml) as a Render Blueprint, with the repository root as the service root directory. It configures one Node.js web service that builds the React client and serves it together with the Express API. The build installs the server and client dependencies, builds `client/dist`, and fails unless `client/dist/index.html` exists.
The deployed API is available at [https://mind-maze-9nxv.onrender.com](https://mind-maze-9nxv.onrender.com). The frontend uses `VITE_API_URL` when set and otherwise defaults to this API; the `/api` suffix is added if omitted. In Vercel, set `VITE_API_URL` to `https://mind-maze-9nxv.onrender.com/api`. In Render, set `CLIENT_URL` to `https://m-ind-maze.vercel.app` so browser requests pass CORS checks.
The Express server trusts the single Render proxy hop so `express-rate-limit` can key requests by the forwarded client IP; it does not trust arbitrary proxy chains.

If you configure the service manually, use:
- **Root Directory:** repository root
- **Build Command:** `npm run render:build`
- **Start Command:** `npm start --prefix server`
- **Health Check Path:** `/api/health`

Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` in the Render environment. Add `UNSPLASH_ACCESS_KEY` there only if you want to enable location photos; it is optional, must stay server-side, and is never needed by Vercel. The Vercel frontend deployment remains separate and should continue building from `client/`. Render serves that build as a fallback for same-origin frontend requests; it does not replace the Vercel deployment.

Apply [20261121210000_interactive_crime_scenes.sql](./supabase/migrations/20261121210000_interactive_crime_scenes.sql) to Supabase before deploying this feature. It adds the `crime_scene` JSONB column and the private `game_scene_discoveries` table. No new Render variables or storage setup are required.

---

## 🔑 Gemini API Key Configuration

To enable live AI generation using Gemini:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `server/.env`:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
3. Restart the server (`npm start` in `server/`).

Mind Maze requires a server-side `GEMINI_API_KEY` to generate cases. Generation uses Gemini's structured JSON response schema, validates the complete mystery before saving, and makes at most one focused retry for incomplete output. A model fallback is attempted only if the configured model is unavailable. Failed or incomplete responses are never saved, and generation diagnostics contain response metadata and validation paths—not case text, solutions, or credentials. Keep the key in `server/.env` only; never use a `VITE_` variable for the Gemini key. The Gemini Developer API supports the configured `gemini-3.5-flash-lite` model and structured output. [Google's model list](https://ai.google.dev/gemini-api/docs/models) and [structured output guide](https://ai.google.dev/gemini-api/docs/structured-output)

---

## 🧪 Testing

To test the frontend build:
```bash
cd client
npm run build
npm run lint
```

To run backend unit tests:
```bash
cd server
node --test services/*.test.js
```

The server integration audit is available with `cd server && npm test`. It requires working Gemini and Supabase credentials and creates then removes temporary test records.
