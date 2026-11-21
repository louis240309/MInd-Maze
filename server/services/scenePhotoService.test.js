import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ||= "test-service-key";

const { buildScenePhotoQuery, ScenePhotoService } = await import("./scenePhotoService.js");
const { CrimeSceneService } = await import("./crimeSceneService.js");
const { ScenePhotoSchema } = await import("./crimeSceneSchema.js");

const photoResponse = (overrides = {}) => ({
  id: "photo-1",
  urls: { regular: "https://images.unsplash.com/photo-1?ixlib=rb-4.0.3" },
  alt_description: "A quiet museum gallery with framed art.",
  user: {
    name: "Photographer One",
    links: { html: "https://unsplash.com/@photographer-one" },
  },
  links: { html: "https://unsplash.com/photos/photo-1" },
  ...overrides,
});

const generatedMuseumScene = () => ({
  name: "Museum gallery",
  scene_type: "museum",
  description: "Three areas in the museum match the case story and its evidence.",
  areas: ["Main gallery", "Records room", "Back gallery"].map((name, areaIndex) => ({
    id: `area_${areaIndex + 1}`,
    name,
    description: `The ${name.toLocaleLowerCase()} connects to the museum case.`,
    objects: [0, 1, 2].map((objectIndex) => {
      const number = areaIndex * 3 + objectIndex + 1;
      return {
        id: `object_${number}`,
        name: `Room object ${number}`,
        category: "other",
        x: 24 + objectIndex * 26,
        y: 36 + objectIndex * 12,
        description: `Room object ${number} is part of the museum location.`,
        inspection_text: `You examine room object ${number} and note its place.`,
        closer_text: `A closer look at room object ${number} finds no new detail.`,
        evidence_id: number === 1 ? "clue_1" : number === 4 ? "clue_2" : number === 8 ? "clue_3" : null,
        requires_evidence_id: number === 8 ? "clue_1" : null,
      };
    }),
  })),
});

test("scene searches use stable theme and location queries for mansion, museum, and hotel", () => {
  assert.equal(buildScenePhotoQuery("mansion", "Private Study"), "mansion study room interior");
  assert.equal(buildScenePhotoQuery("museum", "Main Gallery"), "museum gallery interior");
  assert.equal(buildScenePhotoQuery("hotel", "Guest Room"), "hotel guest room interior");
  assert.equal(buildScenePhotoQuery("office", "Room 2", "A modern boardroom for meetings."), "office meeting room interior");
});

test("Unsplash photo results are validated, resized, attributed, and cached", async () => {
  const requests = [];
  const service = new ScenePhotoService({
    accessKey: () => "server-only-test-key",
    fetchImpl: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return { ok: true, json: async () => ({ results: [photoResponse()] }) };
    },
  });

  const photo = await service.findPhoto({ sceneType: "museum", areaName: "Main Gallery" });
  const cached = await service.findPhoto({ sceneType: "museum", areaName: "Front Gallery" });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.headers.Authorization, "Client-ID server-only-test-key");
  assert.equal(requests[0].url.searchParams.get("query"), "museum gallery interior");
  assert.equal(photo.provider, "unsplash");
  assert.equal(new URL(photo.image_url).hostname, "images.unsplash.com");
  assert.equal(new URL(photo.image_url).searchParams.get("w"), "1600");
  assert.match(photo.photographer_url, /utm_source=mindmaze/);
  assert.match(photo.photo_page_url, /utm_medium=referral/);
  assert.equal(ScenePhotoSchema.safeParse(photo).success, true);
  assert.deepEqual(cached, photo);
});

test("concurrent searches share one Unsplash request", async () => {
  let requestCount = 0;
  const service = new ScenePhotoService({
    accessKey: () => "server-only-test-key",
    fetchImpl: async () => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { ok: true, json: async () => ({ results: [photoResponse()] }) };
    },
  });

  const results = await Promise.all([
    service.findPhoto({ sceneType: "hotel", areaName: "Guest Room" }),
    service.findPhoto({ sceneType: "hotel", areaName: "Bedroom" }),
  ]);
  assert.equal(requestCount, 1);
  assert.deepEqual(results[0], results[1]);
});

test("missing credentials and provider failures return local-art fallback without repeat calls", async () => {
  let requestCount = 0;
  const noKeyService = new ScenePhotoService({
    accessKey: () => "",
    fetchImpl: async () => {
      requestCount += 1;
      return { ok: false, status: 429 };
    },
  });
  const service = new ScenePhotoService({
    accessKey: () => "server-only-test-key",
    fetchImpl: async () => {
      requestCount += 1;
      return { ok: false, status: 429 };
    },
  });

  assert.equal(await noKeyService.findPhoto({ sceneType: "mansion", areaName: "Library" }), null);
  assert.equal(requestCount, 0);
  assert.equal(await service.findPhoto({ sceneType: "mansion", areaName: "Library" }), null);
  assert.equal(await service.findPhoto({ sceneType: "mansion", areaName: "Private Library" }), null);
  assert.equal(requestCount, 1);
});

test("off-domain photo URLs are rejected and do not break saved scene data", async () => {
  const service = new ScenePhotoService({
    accessKey: () => "server-only-test-key",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        results: [photoResponse({ urls: { regular: "https://example.com/image.jpg" } })],
      }),
    }),
  });
  assert.equal(await service.findPhoto({ sceneType: "museum", areaName: "Main Gallery" }), null);

  const { CrimeSceneSchema } = await import("./crimeSceneSchema.js");
  const sceneWithInvalidPhoto = generatedMuseumScene();
  sceneWithInvalidPhoto.areas[0].photo = { image_url: "javascript:alert(1)" };
  assert.equal(CrimeSceneSchema.safeParse(sceneWithInvalidPhoto).success, true);

  const unsafeAttributionService = new ScenePhotoService({
    accessKey: () => "server-only-test-key",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        results: [photoResponse({
          user: { name: "Untrusted", links: { html: "https://not-unsplash.example/profile" } },
        })],
      }),
    }),
  });
  assert.equal(await unsafeAttributionService.findPhoto({ sceneType: "museum", areaName: "Main Gallery" }), null);

  const { CrimeSceneService } = await import("./crimeSceneService.js");
  const sceneService = new CrimeSceneService({ from: () => { throw new Error("No database read expected."); } });
  const game = {
    crime_scene: sceneWithInvalidPhoto,
    clues: [
      { id: "clue_1", name: "Fiber sample" },
      { id: "clue_2", name: "Entry record" },
      { id: "clue_3", name: "Dust outline" },
    ],
    suspects: [],
  };
  const safeScene = sceneService._formatScene(game, sceneWithInvalidPhoto, [], false);
  assert.equal("photo" in safeScene.areas[0], false);
});

test("case-level photo references persist and avoid another provider request", async () => {
  let savedScene = null;
  const database = {
    from(table) {
      assert.equal(table, "games");
      return {
        update(value) {
          savedScene = value.crime_scene;
          return this;
        },
        eq() {
          return this;
        },
        then(resolve) {
          return Promise.resolve({ error: null }).then(resolve);
        },
      };
    },
  };
  let searchCount = 0;
  const service = new CrimeSceneService(database, {
    async findPhoto() {
      searchCount += 1;
      return {
        provider: "unsplash",
        image_url: "https://images.unsplash.com/photo-1?auto=format&w=1600",
        alt_text: "A gallery with framed art.",
        photographer_name: "Photographer One",
        photographer_url: "https://unsplash.com/@photographer-one?utm_source=mindmaze",
        photo_page_url: "https://unsplash.com/photos/photo-1?utm_source=mindmaze",
      };
    },
  });
  const game = {
    id: "case-photo",
    crime_scene: {
    ...generatedMuseumScene(),
    },
    clues: [
    { id: "clue_1", name: "Fiber sample", type: "physical", description: "A fiber rests near the display.", relevance: "It matches a coat." },
    { id: "clue_2", name: "Entry record", type: "document", description: "A record lists a late visit.", relevance: "It challenges an alibi." },
    { id: "clue_3", name: "Dust outline", type: "forensic", description: "A clean outline marks the display.", relevance: "It shows what was removed." },
    ],
  };

  const photo = await service.getAreaPhoto(game, "user-1", "area_1");
  assert.equal(photo.provider, "unsplash");
  assert.equal(savedScene.areas[0].photo.image_url, photo.image_url);
  assert.equal((await service.getAreaPhoto(game, "user-1", "area_1")).image_url, photo.image_url);
  assert.equal(searchCount, 1);
});
