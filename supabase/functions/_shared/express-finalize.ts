import type { Database } from "./commerce.ts";
import { extractHealthScoreNumber, hasAiInsights, normalizeWavStatsResult } from "./wavstats-normalizer.ts";
import { normalizeExpressSample } from "./express-sample.ts";
import { EXPRESS_LAUNCH_TIMEOUT_MS, isExpressComplete } from "./express-state.ts";
import { sendExpressResultMail } from "./express-result-mail.ts";

export type ExpressRow = {
  id: string;
  job_id: string | null;
  status: string;
  tiktok_username: string;
  stripe_session_id: string | null;
  result_data: unknown;
  email: string | null;
  report_version: string;
  processing_started_at: string | null;
  created_at: string;
  support_requested_at: string | null;
  result_email_sent_at?: string | null;
  error_message?: string | null;
  health_score?: number | null;
};

// An old poll must not overwrite a retry, refund, or concurrent completion.
export async function updateExpressAttempt(client: Database, row: ExpressRow, patch: Record<string, unknown>) {
  let query = client.from("express_analyses").update(patch).eq("id", row.id).eq("status", row.status);
  query = row.job_id == null ? query.is("job_id", null) : query.eq("job_id", row.job_id);
  query = row.processing_started_at == null
    ? query.is("processing_started_at", null)
    : query.eq("processing_started_at", row.processing_started_at);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  return data as ExpressRow | null;
}

async function currentRow(client: Database, id: string) {
  const { data, error } = await client.from("express_analyses").select("*").eq("id", id).single();
  if (error || !data) throw error || new Error("Analyse introuvable");
  return data as ExpressRow;
}

function storedResult(row: ExpressRow) {
  if (row.status === "refunded") return {
    status: "failed", username: row.tiktok_username,
    error: "Le remboursement de cette analyse a été enregistré. Contacte Fred si nécessaire.",
  };
  if (isExpressComplete(row) && row.result_data) return {
    status: "complete", username: row.tiktok_username, data: row.result_data,
  };
  if (row.status === "failed") return {
    status: "failed", username: row.tiktok_username,
    error: "Le rapport nécessite une intervention. Fred intervient sous deux jours ouvrés ; remboursement intégral si la résolution échoue.",
  };
  return { status: row.status, username: row.tiktok_username };
}

export async function flagExpressSupport(row: ExpressRow, reason: string, client: Database, failed = false) {
  if (isExpressComplete(row) || row.status === "refunded") return row;
  return await updateExpressAttempt(client, row, {
    support_requested_at: row.support_requested_at || new Date().toISOString(),
    error_message: reason.slice(0, 1000),
    ...(failed ? { status: "failed", launch_started_at: null } : {}),
  });
}

// Browser, admin and scheduler share the same finalizer and stored contract.
export async function pollExpress(row: ExpressRow, client: Database) {
  if (isExpressComplete(row) || ["failed", "refunded"].includes(row.status)) return storedResult(row);
  const delayed = Date.now() - new Date(row.processing_started_at || row.created_at).getTime() > EXPRESS_LAUNCH_TIMEOUT_MS;
  const fail = async (reason: string) => {
    const saved = await flagExpressSupport(row, reason, client, true);
    return storedResult(saved || await currentRow(client, row.id));
  };
  const warn = async (reason: string, message: string) => {
    const saved = await flagExpressSupport(row, reason, client);
    if (!saved) return storedResult(await currentRow(client, row.id));
    return { status: "processing", delayed, username: row.tiktok_username, current_step: message };
  };

  if (!row.job_id) {
    // Unpaid intentions are not interrupted launches.
    if (["pending", "awaiting_payment"].includes(row.status)) return storedResult(row);
    if (delayed) return await fail("Lancement interrompu : aucun identifiant de traitement enregistré. Vérifier WavStats avant une relance manuelle.");
    return { status: "starting", delayed, username: row.tiktok_username };
  }
  const key = Deno.env.get("WAVSTATS_API_KEY") || Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
  if (!key) return await warn("Configuration analyse manquante", "La connexion au service d’analyse nécessite une vérification.");
  let response: Response;
  try {
    response = await fetch(`https://wavstats.com/api/v1/jobs/${encodeURIComponent(row.job_id)}`, {
      headers: { "X-API-Key": key }, signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    return await warn(`Consultation WavStats impossible : ${error instanceof Error ? error.message : String(error)}`,
      "Connexion au service d’analyse interrompue. Nouvelle vérification en cours.");
  }
  if (!response.ok) {
    await response.body?.cancel();
    const reason = `Consultation WavStats : HTTP ${response.status} (traitement ${row.job_id})`;
    if ([404, 410].includes(response.status)) return await fail(reason + " : traitement introuvable");
    return await warn(reason, "Consultation du traitement temporairement indisponible. Nouvelle vérification en cours.");
  }
  let job: { status: string; result?: unknown; progress?: number; progressMessage?: string };
  try {
    job = await response.json();
  } catch {
    return await warn("Réponse WavStats illisible", "Réponse du service d’analyse temporairement indisponible.");
  }
  if (!job || typeof job.status !== "string") return await fail("Réponse WavStats sans statut de traitement");
  if (job.status === "completed") {
    if (!job.result) return await fail("WavStats a terminé le traitement sans fournir de rapport");
    let normalized: ReturnType<typeof normalizeWavStatsResult>;
    try {
      normalized = row.report_version === "sample-v3"
        ? normalizeExpressSample(job.result)
        : normalizeWavStatsResult(job.result);
      if (!hasAiInsights(normalized)) throw new Error("Interprétations absentes du résultat");
    } catch (error) {
      return await fail(`Rapport ${row.report_version} incompatible : ${error instanceof Error ? error.message : String(error)}`);
    }
    const saved = await updateExpressAttempt(client, row, {
      status: "complete", result_data: normalized,
      health_score: extractHealthScoreNumber(normalized),
      completed_at: new Date().toISOString(), error_message: null, launch_started_at: null,
    });
    const final = saved || await currentRow(client, row.id);
    // La livraison du rapport ne doit jamais faire échouer la finalisation :
    // le cron de rattrapage repassera si la mise en file échoue.
    try {
      await sendExpressResultMail(client, final);
    } catch (error) {
      console.error("Mail de rapport non mis en file", row.id, error);
    }
    return storedResult(final);
  }
  if (["failed", "cancelled"].includes(job.status)) return await fail(`Échec du prestataire d’analyse : ${job.status}`);
  if (delayed) return await warn(row.error_message || "Traitement supérieur à cinq minutes après paiement",
    "Délai inhabituel : Fred est prévenu pour une intervention sous deux jours ouvrés.");
  return { status: "processing", progress: job.progress || 0, current_step: job.progressMessage || null, delayed, username: row.tiktok_username };
}
