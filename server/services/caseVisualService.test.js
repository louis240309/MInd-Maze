import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ||= "test-service-key";

const { buildCaseVisualAssets, CaseVisualService } = await import("./caseVisualService.js");

test("mansion cases select manor artwork and motifs matching each clue", () => {
  const assets = buildCaseVisualAssets({
    id: "mansion-case",
    title: "The Manor at Midnight",
    story: "A mystery in a Victorian mansion.",
    clues: [
      { id: "key", name: "Brass key", description: "A key to the west wing." },
      { id: "note", name: "Torn letter", description: "A handwritten note from the night of the theft." },
      { id: "fiber", name: "Blue thread", description: "A fiber caught on the old staircase." },
      { id: "shoe", name: "Shoe prints", description: "Marks near the west entrance." },
    ],
    suspects: [{ id: "suspect_1", name: "Ada Vale", role: "Caretaker", age: 42 }],
  });

  assert.equal(assets[0].theme_key, "mansion");
  assert.deepEqual(assets.slice(1, 5).map(({ motif }) => motif), ["key", "document", "fiber", "footprint"]);
  assert.equal(assets[5].asset_type, "suspect");
  assert.equal(assets[5].related_id, "suspect_1");
});

test("museum and hotel cases receive theme-specific scene references", () => {
  const museumAssets = buildCaseVisualAssets({
    id: "museum-case",
    title: "The Missing Exhibit",
    story: "The curator discovered an artifact was missing from the museum gallery.",
  });
  const hotelAssets = buildCaseVisualAssets({
    id: "hotel-case",
    title: "Room 204",
    story: "A guest disappeared from the hotel suite.",
  });

  assert.equal(museumAssets[0].theme_key, "museum");
  assert.match(museumAssets[0].name, /Exhibition gallery/);
  assert.equal(hotelAssets[0].theme_key, "hotel");
  assert.match(hotelAssets[0].name, /Hotel interior/);
});

test("legacy cases without optional visual fields still get local scene art", () => {
  const assets = buildCaseVisualAssets({ id: "legacy-case", title: "Old Case" });

  assert.equal(assets.length, 1);
  assert.equal(assets[0].theme_key, "classic");
  assert.equal(assets[0].status, "ready");
  assert.equal(assets[0].image_url, null);
});

test("visual endpoint service returns ready local assets without an image job", async () => {
  const service = new CaseVisualService();
  const visuals = await service.getAssets({
    id: "local-case",
    title: "The Hotel Ledger",
    story: "A hotel mystery.",
    clues: [{ id: "ledger", name: "Guest ledger", description: "A record at the hotel." }],
    suspects: [{ id: "suspect_1", name: "Alex Rowan", role: "Manager" }],
  });

  assert.equal(visuals.status, "complete");
  assert.equal(visuals.source, "local-library");
  assert.equal(visuals.assets.length, 3);
  assert.ok(visuals.assets.every((asset) => asset.image_url === null));
});

test("local library references never contain generated image prompts or remote URLs", () => {
  const assets = buildCaseVisualAssets({
    title: "Museum Mystery",
    clues: [{ name: "Entry log", description: "A record of gallery access." }],
    suspects: [{ name: "Jordan Lee", role: "Archivist" }],
  });

  for (const asset of assets) {
    assert.equal(asset.status, "ready");
    assert.equal(asset.image_url, null);
    assert.equal("prompt" in asset, false);
  }
});
