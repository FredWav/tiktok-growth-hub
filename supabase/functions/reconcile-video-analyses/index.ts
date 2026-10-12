import { db, deliverMail, json, headers, service } from "../_shared/commerce.ts";
import { advanceVideo, failVideo, log, type VideoRow } from "../_shared/video-analysis.ts";

// Quota WavStats : 30 req/min par clé, partagé avec l'Analyse Express.
const MAX_WAVSTATS_CALLS = 10;
const STALE_START_MS = 5 * 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (!service(req)) return json({ error: "Accès refusé" }, 403);
  const client = db();
  const apiKey = Deno.env.get("WAVSTATS_API_KEY") || Deno.env.get("WAV_SOCIAL_SCAN_API_KEY") || "";
  const allowTest = Deno.env.get("ALLOW_TEST_FULFILLMENT") === "true";
  const summary = { checked: 0, errors: 0 };
  const deadline = Date.now() + 25_000;
  try {
    const retryBefore = new Date(Date.now() - 60_000).toISOString();
    const { data, error } = await client.from("video_analyses").select("*")
      .or(`status.in.(processing,completed,starting),and(status.eq.paid,updated_at.lt.${retryBefore})`)
      .order("updated_at").limit(30);
    if (error) throw error;
    let calls = 0;
    for (const row of (data || []) as VideoRow[]) {
      if (Date.now() > deadline) break;
      if (row.checkout_mode === "test" && !allowTest) continue;
      try {
        if (row.status === "starting") {
          // Verrou pris mais job jamais enregistré : issue inconnue, pas de second POST.
          if (Date.now() - new Date(row.updated_at).getTime() > STALE_START_MS) {
            await failVideo(client, row, "Lancement interrompu sans identifiant de job : vérifier GET /jobs?type=video_analysis avant relance");
          }
          continue;
        }
        if (row.status !== "completed") {
          if (calls >= MAX_WAVSTATS_CALLS) continue;
          calls++;
        }
        await advanceVideo(client, row, apiKey);
        summary.checked++;
      } catch (e) {
        summary.errors++;
        log(row, `reconcile error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        // Rotation de la file : les lignes en erreur ne bloquent pas les suivantes.
        if (row.status !== "starting") {
          await client.from("video_analyses").update({ updated_at: new Date().toISOString() })
            .eq("id", row.id).eq("status", row.status).in("status", ["processing", "completed"]);
        }
      }
    }
    await deliverMail(client);
    return json(summary);
  } catch (e) {
    console.error("[video-analysis] reconcile failed", e);
    return json({ error: "Rattrapage à retenter", ...summary }, 500);
  }
});
