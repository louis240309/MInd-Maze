import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ||= "test-service-key";

const { GameService } = await import("./gameService.js");

test("createMystery never inserts a generated case that fails validation", async () => {
  let inserted = false;
  const database = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit: async () => ({ data: [], error: null }),
                  };
                },
              };
            },
          };
        },
        insert() {
          inserted = true;
          throw new Error("Invalid generated case reached Supabase insert.");
        },
      };
    },
  };
  const gameService = new GameService({
    database,
    caseGenerator: { generateMystery: async () => ({ title: "Incomplete case" }) },
  });

  await assert.rejects(
    gameService.createMystery("test-user", { difficulty: "medium", theme: "Mansion" }),
    (error) => error.statusCode === 502 && /was not saved/i.test(error.message),
  );
  assert.equal(inserted, false);
});
