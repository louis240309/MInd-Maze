import { z } from "zod";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";

const RoomQuerySchema = z.object({
  id: z.string().min(1),
  urls: z.object({ regular: z.string().url() }),
  alt_description: z.string().max(300).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  user: z.object({
    name: z.string().trim().min(1).max(100),
    links: z.object({ html: z.string().url() }),
  }),
  links: z.object({ html: z.string().url() }),
});

const themeTerms = {
  mansion: "mansion",
  museum: "museum",
  hotel: "hotel",
  school: "school",
  office: "office",
  cyberpunk: "modern",
  classic: "historic",
};

const roomTerms = [
  [/\b(library|book room)\b/i, "library"],
  [/\b(study|office|work room)\b/i, "study room"],
  [/\b(dining|banquet)\b/i, "dining room"],
  [/\b(corridor|hallway|passage|hall)\b/i, "hallway"],
  [/\b(garden|courtyard|greenhouse)\b/i, "garden room"],
  [/\b(gallery|exhibit|exhibition)\b/i, "gallery"],
  [/\b(storage|archive|record|back room)\b/i, "archive room"],
  [/\b(security|guard|control)\b/i, "security room"],
  [/\b(guest|bedroom|suite|sleep)\b/i, "guest room"],
  [/\b(lobby|reception|front desk|entrance|entry)\b/i, "reception area"],
  [/\b(classroom|lesson)\b/i, "classroom"],
  [/\b(meeting|boardroom|conference)\b/i, "meeting room"],
];

const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);

export function buildScenePhotoQuery(sceneType, areaName, areaDescription = "") {
  const theme = themeTerms[sceneType] || themeTerms.classic;
  const locationText = `${areaName} ${areaDescription}`;
  const room = roomTerms.find(([pattern]) => pattern.test(locationText))?.[1] || "interior room";
  return `${theme} ${room} interior`;
}

const addAttributionTracking = (value) => {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["unsplash.com", "www.unsplash.com"].includes(url.hostname)
  ) {
    throw new Error("Unsplash returned an attribution link outside its website.");
  }
  url.searchParams.set("utm_source", "mindmaze");
  url.searchParams.set("utm_medium", "referral");
  return url.toString();
};

const makeImageUrl = (value) => {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.hostname !== "images.unsplash.com") {
    throw new Error("Unsplash returned an image URL outside its image CDN.");
  }
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "1600");
  url.searchParams.set("q", "80");
  return url.toString();
};

const toPublicPhoto = (value) => {
  const parsed = RoomQuerySchema.parse(value);
  return {
    provider: "unsplash",
    image_url: makeImageUrl(parsed.urls.regular),
    alt_text: normalize(parsed.alt_description || parsed.description) || "Illustrative photograph of a location interior.",
    photographer_name: parsed.user.name,
    photographer_url: addAttributionTracking(parsed.user.links.html),
    photo_page_url: addAttributionTracking(parsed.links.html),
  };
};

export class ScenePhotoService {
  constructor({
    fetchImpl = globalThis.fetch,
    now = Date.now,
    accessKey = () => process.env.UNSPLASH_ACCESS_KEY,
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.accessKey = accessKey;
    this.cache = new Map();
    this.inFlight = new Map();
    this.missingKeyWarningLogged = false;
  }

  isConfigured() {
    return Boolean(this.accessKey()?.trim());
  }

  async findPhoto({ sceneType, areaName, areaDescription }) {
    const accessKey = this.accessKey()?.trim();
    if (!accessKey) {
      if (!this.missingKeyWarningLogged) {
        console.warn("[ScenePhotoService] Photo lookup is disabled: UNSPLASH_ACCESS_KEY is not configured. SVG scenes remain enabled.");
        this.missingKeyWarningLogged = true;
      }
      return null;
    }

    const query = buildScenePhotoQuery(sceneType, areaName, areaDescription);
    const cached = this.cache.get(query);
    if (cached && cached.expiresAt > this.now()) {
      console.info("[ScenePhotoService] Photo search cache hit.", {
        query,
        result: cached.photo ? "photo" : "fallback",
      });
      return cached.photo;
    }
    if (this.inFlight.has(query)) {
      console.info("[ScenePhotoService] Reusing in-flight photo search.", { query });
      return this.inFlight.get(query);
    }

    console.info("[ScenePhotoService] Searching Unsplash for a scene location.", { query });
    const request = this._search(query, accessKey);
    this.inFlight.set(query, request);
    try {
      return await request;
    } finally {
      if (this.inFlight.get(query) === request) this.inFlight.delete(query);
    }
  }

  async _search(query, accessKey) {
    let response;
    let photo = null;
    let ttl = CACHE_TTL_MS;
    try {
      const url = new URL(UNSPLASH_API_URL);
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", "5");
      url.searchParams.set("orientation", "landscape");
      url.searchParams.set("content_filter", "high");
      response = await this.fetchImpl(url, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) {
        ttl = FAILURE_CACHE_TTL_MS;
        console.warn("[ScenePhotoService] Unsplash search failed.", {
          status: response.status,
          query,
        });
      } else {
        const payload = await response.json();
        const results = z.object({ results: z.array(z.unknown()).max(50) }).parse(payload).results;
        const suitable = results
          .map((result) => {
            try {
              return toPublicPhoto(result);
            } catch {
              return null;
            }
          })
          .find(Boolean);
        photo = suitable || null;
        console.info("[ScenePhotoService] Unsplash search completed.", {
          query,
          results: results.length,
          selected: Boolean(photo),
        });
      }
    } catch (error) {
      ttl = FAILURE_CACHE_TTL_MS;
      console.warn("[ScenePhotoService] Unsplash search is unavailable.", {
        query,
        reason: error.name === "TimeoutError" ? "request timed out" : error.message,
      });
    }

    this.cache.set(query, { photo, expiresAt: this.now() + ttl });
    while (this.cache.size > MAX_CACHE_ENTRIES) {
      this.cache.delete(this.cache.keys().next().value);
    }
    if (!photo && response?.ok) {
      console.info("[ScenePhotoService] No safe matching photo was available; using original scene artwork.", { query });
    }
    return photo;
  }
}

export const scenePhotoService = new ScenePhotoService();
