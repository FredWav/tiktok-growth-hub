import type { Database } from "./commerce.ts";
import { flagExpressSupport, updateExpressAttempt, type ExpressRow } from "./express-finalize.ts";
import { isValidTikTokUsername, normalizeTikTokUsername } from "./tiktok-username.ts";

// Caller must first acquire a starting row. Never retry a POST automatically:
// after a timeout the partner may already have accepted it.
export async function launchExpressJob(client: Database, row: ExpressRow, apiKey: string) {
  let jobId: string | undefined;
  try {
    if (!apiKey) throw new Error("Clé API WavStats non configurée");
    const username = normalizeTikTokUsername(row.tiktok_username);
    if (!isValidTikTokUsername(username)) {
      throw new Error("Identifiant TikTok invalide : utiliser le @ du profil, sans espace ni accent");
    }
    const response = await fetch(`https://wavstats.com/api/v1/accounts/${encodeURIComponent(username)}/analyze`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Lancement WavStats : HTTP ${response.status}`);
    const result = await response.json();
    const id = result.jobId ?? result.job_id;
    if (typeof id !== "string" || !id.trim()) throw new Error("Identifiant de traitement absent de la réponse WavStats");
    jobId = id;
    const saved = await updateExpressAttempt(client, row, {
      tiktok_username: username, job_id: jobId, status: "processing",
      launch_started_at: null, error_message: null,
      result_data: null, health_score: null, completed_at: null,
    });
    if (!saved) throw new Error("Le dossier a changé pendant le lancement");
    return saved;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await flagExpressSupport(row,
      jobId ? `${reason} · traitement WavStats à récupérer : ${jobId}` : `${reason} · vérifier WavStats avant de relancer`,
      client, true);
    throw new Error(reason);
  }
}
