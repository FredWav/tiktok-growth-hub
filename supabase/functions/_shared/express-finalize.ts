import { db } from "./commerce.ts";
import {
  extractHealthScoreNumber,
  hasAiInsights,
  normalizeWavStatsResult,
} from "./wavstats-normalizer.ts";
import { normalizeExpressSample } from "./express-sample.ts";

export type ExpressRow = {
  id: string;
  job_id: string | null;
  status: string;
  tiktok_username: string;
  stripe_session_id: string;
  result_data: unknown;
  email: string | null;
  report_version: string;
  processing_started_at: string | null;
  created_at: string;
  support_requested_at: string | null;
};

export async function flagExpressSupport(
  row: ExpressRow,
  reason: string,
  failed = false,
) {
  const { error } = await db().from("express_analyses").update({
    support_requested_at: row.support_requested_at || new Date().toISOString(),
    error_message: reason,
    ...(failed ? { status: "failed" } : {}),
  }).eq("id", row.id).not("status", "in", "(complete,completed)");
  if (error) throw error;
}

// Used by browser polling and cron. Conditional write + database outbox serialize completion.
export async function pollExpress(row: ExpressRow) {
  if (row.status === "refunded") {
    return {
      status: "failed",
      error:
        "Le remboursement de cette analyse a été enregistré. Contacte Fred si nécessaire.",
      username: row.tiktok_username,
    };
  }
  if (["complete", "completed"].includes(row.status) && row.result_data) {
    return {
      status: "complete",
      data: row.result_data,
      username: row.tiktok_username,
    };
  }
  if (row.status === "failed") {
    return {
      status: "failed",
      error:
        "Fred intervient sous deux jours ouvrés. Si l’analyse ne peut pas être résolue, il valide le remboursement intégral.",
      username: row.tiktok_username,
    };
  }
  const start = row.processing_started_at || row.created_at;
  const delayed = Date.now() - new Date(start).getTime() > 5 * 60000;
  if (delayed) {
    await flagExpressSupport(
      row,
      "Traitement supérieur à cinq minutes après paiement",
    );
  }
  if (!row.job_id) {
    return { status: "starting", delayed, username: row.tiktok_username };
  }
  const key = Deno.env.get("WAVSTATS_API_KEY") ||
    Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
  if (!key) throw new Error("Configuration analyse manquante");
  const response = await fetch(
    `https://wavstats.com/api/v1/jobs/${encodeURIComponent(row.job_id)}`,
    { headers: { "X-API-Key": key }, signal: AbortSignal.timeout(15000) },
  );
  if (!response.ok) {
    return { status: "processing", delayed, username: row.tiktok_username };
  }
  const job = await response.json();
  if (job.status === "completed" && job.result) {
    let normalized: ReturnType<typeof normalizeWavStatsResult>;
    try {
      normalized = row.report_version === "sample-v3"
        ? normalizeExpressSample(job.result)
        : normalizeWavStatsResult(job.result);
      if (!hasAiInsights(normalized)) {
        throw new Error("Interprétations absentes du résultat");
      }
    } catch (e) {
      await flagExpressSupport(
        row,
        e instanceof Error ? e.message : "Rapport incohérent",
        true,
      );
      return {
        status: "failed",
        error:
          "Le rapport nécessite une vérification. Fred intervient sous deux jours ouvrés ; remboursement intégral si la résolution échoue.",
        username: row.tiktok_username,
      };
    }
    const { error } = await db().from("express_analyses").update({
      status: "complete",
      result_data: normalized,
      health_score: extractHealthScoreNumber(normalized),
      completed_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", row.id).eq("job_id", row.job_id).in("status", [
      "starting",
      "processing",
    ]);
    if (error) throw error;
    const { data: saved, error: readError } = await db().from(
      "express_analyses",
    ).select("status,result_data").eq("id", row.id).single();
    if (readError || saved.status !== "complete") {
      throw new Error("Finalisation à retenter");
    }
    return {
      status: "complete",
      data: saved.result_data,
      username: row.tiktok_username,
    };
  }
  if (["failed", "cancelled"].includes(job.status)) {
    await flagExpressSupport(row, "Échec du prestataire d’analyse", true);
    return {
      status: "failed",
      error:
        "L’analyse n’a pas abouti. Fred intervient sous deux jours ouvrés ; remboursement intégral si la résolution échoue.",
      username: row.tiktok_username,
    };
  }
  return {
    status: "processing",
    progress: job.progress || 0,
    current_step: delayed
      ? "Délai inhabituel : Fred est prévenu pour une intervention sous deux jours ouvrés."
      : job.progressMessage || null,
    delayed,
    username: row.tiktok_username,
  };
}
