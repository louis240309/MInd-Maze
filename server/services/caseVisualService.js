import { GoogleGenAI } from "@google/genai";
import { supabase } from "../config/supabase.js";

const BUCKET = process.env.SUPABASE_VISUAL_BUCKET || "case-visuals";
const imageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 60000, retryOptions: { attempts: 1 } } })
  : null;
const inFlight = new Set();

const safeError = (error) => {
  const status = Number(error?.status || error?.statusCode || 0);
  if (status === 429) return "Google image generation is over its current quota. Please try again later or enable image-model billing.";
  if (!process.env.GEMINI_API_KEY) return "Gemini image generation is not configured on the server. The mystery remains playable.";
  if ([408, 500, 502, 503, 504].includes(status)) return "Image generation is temporarily unavailable. Retry this visual file later.";
  return "Some case images could not be generated. The mystery remains playable.";
};

function buildAssets(game) {
  const scene = {
    asset_key: "crime_scene_1", asset_type: "crime_scene", related_id: null,
    name: game.title + " — scene photograph", description: "A visual record of the setting described in " + game.title + ".",
    prompt: "Create a realistic cinematic fictional crime-scene photograph for this mystery: " + game.title + ". Story context: " + game.story + ". Depict only the location and objects explicitly described in the story. Non-graphic, no people, no readable text, no added clues, no logos.", sort_order: 0,
  };
  const evidence = (game.clues || []).map((clue, index) => ({
    asset_key: "evidence_" + (clue.id || index + 1), asset_type: "evidence", related_id: clue.id || null,
    name: clue.name, description: clue.description, case_connection: clue.description,
    prompt: "Create a realistic fictional evidence photograph for the mystery \"" + game.title + "\". Depict only this item: " + clue.name + ". Visual details: " + clue.description + ". Story setting: " + game.story + ". Match the described item, do not add symbols or clues, do not show readable writing, culprit, hidden answers, people, or graphic content.", sort_order: index + 1,
  }));
  const suspects = (game.suspects || []).map((suspect, index) => ({
    asset_key: "suspect_" + (suspect.id || index + 1), asset_type: "suspect", related_id: suspect.id || null,
    name: suspect.name + " — profile", description: suspect.role + (suspect.age ? ", age " + suspect.age : "") + ". " + (suspect.background || suspect.statement),
    case_connection: suspect.role, sort_order: index + 4,
    prompt: "Create a consistent fictional suspect-profile portrait for \"" + suspect.name + "\", a " + (suspect.age || "adult") + " " + suspect.role + ". Background: " + (suspect.background || suspect.statement) + ". Case setting: " + game.title + ". Documentary portrait, neutral expression, non-graphic, no text, no symbols, no guilt or innocence cues. This person is fictional.",
  }));
  return [scene, ...evidence, ...suspects];
}

function imageBytes(response) {
  const image = response?.output_image || response?.output?.find?.((item) => item.type === "image") ||
    response?.steps?.flatMap?.((step) => step.content || []).find?.((item) => item.type === "image");
  if (!image?.data) throw new Error("Google returned no image data.");
  const mimeType = image.mime_type || "image/jpeg";
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(mimeType)) throw new Error("Google returned an unsupported image format.");
  const buffer = Buffer.from(image.data, "base64");
  if (buffer.length < 1024 || buffer.length > 8 * 1024 * 1024) throw new Error("Generated image size was outside the allowed range.");
  return { buffer, mimeType };
}

export class CaseVisualService {
  async getAssets(gameId) {
    const { data, error } = await supabase.from("case_visual_assets").select("id,asset_key,asset_type,related_id,name,description,case_connection,discovered_initially,status,storage_path,mime_type,sort_order").eq("game_id", gameId).order("sort_order");
    if (error) {
      const migrationError = new Error("Visual case-file storage is not ready. Apply the visual-assets database migration.");
      migrationError.statusCode = 503;
      throw migrationError;
    }
    const assets = await Promise.all((data || []).map(async (asset) => {
      let imageUrl = null;
      if (asset.status === "ready" && asset.storage_path) {
        const { data: signed, error: signingError } = await supabase.storage.from(BUCKET).createSignedUrl(asset.storage_path, 3600);
        if (signingError) {
          const error = new Error("Stored case images could not be accessed. Check the visual storage bucket configuration.");
          error.statusCode = 503;
          error.cause = signingError;
          throw error;
        }
        imageUrl = signed?.signedUrl || null;
      }
      const { storage_path, ...publicAsset } = asset;
      return { ...publicAsset, image_url: imageUrl };
    }));
    const { data: job } = await supabase.from("case_visual_jobs").select("status,error_message,updated_at").eq("game_id", gameId).maybeSingle();
    return { status: job?.status || "not_started", error: job?.error_message || null, assets };
  }

  async getStoredPaths(gameId) {
    const { data, error } = await supabase.from("case_visual_assets").select("storage_path").eq("game_id", gameId).not("storage_path", "is", null);
    if (error) {
      console.error("[CaseVisualService] Could not list files for case cleanup.", { gameId });
      return [];
    }
    return (data || []).map(({ storage_path }) => storage_path).filter(Boolean);
  }

  async removeStoredFiles(paths, gameId) {
    if (!paths.length) return;
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) console.error("[CaseVisualService] Storage cleanup failed after case deletion.", { gameId, message: removeError.message });
  }

  canRetry(gameId) {
    return !inFlight.has(gameId);
  }

  enqueue(game, options = {}) {
    if (!game?.id || inFlight.has(game.id)) return;
    inFlight.add(game.id);
    setImmediate(() => this.generate(game, options).catch((error) => {
      console.error("[CaseVisualService] Visual generation failed.", { gameId: game.id, message: safeError(error) });
    }).finally(() => inFlight.delete(game.id)));
  }

  async generate(game, { retry = false } = {}) {
    const { data: claimed, error: jobError } = await supabase.rpc("claim_case_visual_job", { p_game_id: game.id });
    if (jobError) throw new Error("Visual database migration is not applied.");
    if (!claimed) return;

    try {
      const assets = buildAssets(game);
      // Persist all case-linked visual records first, so a temporary image API
      // failure still leaves a complete, inspectable visual dossier.
      for (const asset of assets) {
        const { error: upsertError } = await supabase.from("case_visual_assets").upsert({
          game_id: game.id, asset_key: asset.asset_key, asset_type: asset.asset_type, related_id: asset.related_id,
          name: asset.name, description: asset.description, case_connection: asset.case_connection || asset.description,
          discovered_initially: true, status: "pending", sort_order: asset.sort_order, updated_at: new Date().toISOString(),
        }, { onConflict: "game_id,asset_key", ignoreDuplicates: true });
        if (upsertError) throw upsertError;
      }
      if (!ai) throw new Error("Gemini image generation is not configured.");
      let failedCount = 0;
      let failureMessage = null;
      for (const asset of assets) {
        const { data: existing } = await supabase.from("case_visual_assets").select("status,storage_path").eq("game_id", game.id).eq("asset_key", asset.asset_key).maybeSingle();
        if (existing?.status === "ready" && existing.storage_path) continue;
        try {
          if (existing?.status === "failed" && !retry) { failedCount += 1; continue; }
          const response = await ai.interactions.create({
            model: imageModel,
            input: asset.prompt,
            response_format: {
              type: "image",
              mime_type: "image/jpeg",
              aspect_ratio: asset.asset_type === "suspect" ? "3:4" : "4:3",
              image_size: "1K",
            },
          });
          const { buffer, mimeType } = imageBytes(response);
          const extension = mimeType === "image/jpeg" ? "jpg" : "png";
          const path = game.id + "/" + asset.asset_key + "." + extension;
          const { error: storageError } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: mimeType, upsert: true, cacheControl: "31536000" });
          if (storageError) throw storageError;
          const { error: readyError } = await supabase.from("case_visual_assets").update({ status: "ready", storage_path: path, mime_type: mimeType, updated_at: new Date().toISOString() }).eq("game_id", game.id).eq("asset_key", asset.asset_key);
          if (readyError) throw readyError;
        } catch (error) {
          failedCount += 1;
          failureMessage ||= safeError(error);
          await supabase.from("case_visual_assets").update({ status: "failed", updated_at: new Date().toISOString() }).eq("game_id", game.id).eq("asset_key", asset.asset_key);
          // A quota response will not improve for the remaining image calls.
          if (Number(error?.status || error?.statusCode) === 429) {
            const remaining = assets.slice(assets.indexOf(asset) + 1);
            await Promise.all(remaining.map(({ asset_key }) => supabase.from("case_visual_assets").update({ status: "failed", updated_at: new Date().toISOString() }).eq("game_id", game.id).eq("asset_key", asset_key)));
            failedCount += remaining.length;
            break;
          }
        }
      }
      const { error } = await supabase.from("case_visual_jobs").update({ status: failedCount ? "partial" : "complete", error_message: failureMessage, updated_at: new Date().toISOString() }).eq("game_id", game.id);
      if (error) throw error;
    } catch (error) {
      const message = safeError(error);
      await supabase.from("case_visual_assets").update({ status: "failed", updated_at: new Date().toISOString() }).eq("game_id", game.id).eq("status", "pending");
      await supabase.from("case_visual_jobs").upsert({ game_id: game.id, status: "failed", error_message: message, updated_at: new Date().toISOString() });
      throw error;
    }
  }
}

export const caseVisualService = new CaseVisualService();
