/**
 * Cycle de vie d'une Analyse Vidéo TikTok : lancement WavStats, suivi, livraison, échec.
 *
 * Mêmes règles que l'Analyse Express (express-launch / express-finalize) :
 * - un seul POST par commande, protégé par une écriture conditionnelle ;
 * - jamais de second POST automatique quand l'issue du premier est inconnue ;
 * - aucun rapport livré sans résultat normalisé.
 *
 * Pas d'import Deno/npm à l'exécution : testable depuis Node (tests/video-analysis.test.mjs).
 */
import type { Database } from "./commerce.ts";
import { notifyError, notifySuccess } from "./itpush.ts";
import { normalizeVideoResult } from "./video-report.ts";

export const WAVSTATS_API = "https://wavstats.com/api/v1";
export const VIDEO_MAX_LAUNCH_ATTEMPTS = 3;
export const VIDEO_DELAY_ALERT_MS = 15 * 60_000;
const OWNER_EMAIL = "fredwavcm@gmail.com";

export type VideoRow = {
  id: string;
  email: string;
  tiktok_url: string;
  video_id: string;
  status: string;
  checkout_mode: string;
  stripe_session_id: string | null;
  job_id: string | null;
  launch_attempts: number;
  processing_started_at: string | null;
  report_token: string;
  support_requested_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export const log = (row: Pick<VideoRow, "id" | "job_id" | "status">, message: string) =>
  console.log(`[video-analysis] order=${row.id} job=${row.job_id ?? "-"} status=${row.status} ${message}`);

export const site = () => (typeof Deno !== "undefined" && Deno.env.get("SITE_URL")) || "https://fredwav.com";
export const reportUrl = (row: Pick<VideoRow, "report_token">) =>
  `${site()}/analyse-video/rapport?t=${row.report_token}`;

/** Écriture conditionnelle : une exécution périmée ne peut pas écraser un état plus récent. */
export async function updateVideo(client: Database, row: VideoRow, patch: Record<string, unknown>) {
  let query = client.from("video_analyses")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", row.id).eq("status", row.status);
  query = row.job_id == null ? query.is("job_id", null) : query.eq("job_id", row.job_id);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  return data as VideoRow | null;
}

async function queueMail(client: Database, key: string, recipient: string, subject: string, body: string) {
  // Pas enqueue() : il ignore une file absente, et le client ne recevrait rien.
  const { error } = await client.from("commerce_mail").upsert(
    { dedupe_key: key, recipient, subject, body },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) throw error;
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const p = (html: string) => `<p style="margin:0 0 14px;line-height:1.6">${html}</p>`;
const frame = (inner: string) =>
  `<div style="font-family:Arial,sans-serif;color:#0F0F0F;max-width:600px;margin:0 auto;padding:24px">${inner}
<hr style="border:none;border-top:1px solid #E6E6E6;margin:24px 0">
<p style="margin:0;font-size:13px;color:#6B6B6B">Une question : contact@fredwav.com · CGV : <a href="${site()}/cgv" style="color:#92721C">${site()}/cgv</a></p></div>`;

export function buildVideoReportEmail(row: Pick<VideoRow, "report_token" | "tiktok_url">) {
  const url = reportUrl(row);
  const html = frame(`${p("Bonjour,")}
${p("Ton analyse vidéo est terminée.")}
${p("Nous avons analysé ta vidéo pour identifier ce qui fonctionne, les principaux freins à sa performance et les modifications prioritaires que tu peux appliquer sur tes prochaines publications.")}
<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 18px"><tr><td>
<a href="${esc(url)}" style="display:block;text-align:center;background:#D9B53F;color:#0F0F0F;text-decoration:none;font-weight:bold;padding:14px 18px;border-radius:6px">Voir mon analyse</a>
</td></tr></table>
${p("Depuis cette page, tu peux aussi télécharger ton rapport complet en PDF. Garde cet e-mail : le lien reste valable.")}
${p(`<span style="font-size:13px;color:#6B6B6B">Vidéo analysée : ${esc(row.tiktok_url)}</span>`)}
${p("À bientôt,<br>Fred<br>FredWav")}`);
  return { subject: "Ton analyse vidéo TikTok est prête 🚀", html };
}

export function buildVideoFailureEmail(row: Pick<VideoRow, "tiktok_url" | "id">) {
  const html = frame(`${p("Bonjour,")}
${p("Ton paiement est bien enregistré, mais l'analyse de ta vidéo n'a pas pu aboutir automatiquement.")}
${p(`Fred est prévenu et revient vers toi sous deux jours ouvrés, sans nouveau paiement. Si la résolution échoue, l'analyse est remboursée intégralement.`)}
${p("Vérifie en attendant que la vidéo est bien publique : une vidéo privée ou supprimée ne peut pas être analysée.")}
${p(`<span style="font-size:13px;color:#6B6B6B">Vidéo : ${esc(row.tiktok_url)} · Référence : ${esc(row.id)}</span>`)}
${p("Fred<br>FredWav")}`);
  return { subject: "Ton analyse vidéo TikTok : on s'en occupe", html };
}

/** Passe la commande en échec, prévient le client et Fred. Idempotent (dedupe_key). */
export async function failVideo(client: Database, row: VideoRow, reason: string) {
  const saved = await updateVideo(client, row, {
    status: "failed",
    error_message: reason.slice(0, 1000),
    support_requested_at: row.support_requested_at || new Date().toISOString(),
  });
  if (!saved) return null;
  log(saved, `failed: ${reason}`);
  const mail = buildVideoFailureEmail(saved);
  await queueMail(client, `video-failed:${saved.id}`, saved.email, mail.subject, mail.html);
  await queueMail(client, `video-failed-owner:${saved.id}`, OWNER_EMAIL, "Analyse vidéo à reprendre",
    `Commande ${saved.id}\nVidéo : ${saved.tiktok_url}\nJob : ${saved.job_id ?? "aucun"}\nStripe : ${saved.stripe_session_id}\nCause : ${reason}`);
  await safe(() => notifyError("Analyse Vidéo", `${reason} • order=${saved.id} • job=${saved.job_id ?? "-"}`));
  return saved;
}

async function safe(fn: () => Promise<unknown>) {
  try { await fn(); } catch (err) { console.error("[video-analysis] notification", err); }
}

/** Alerte support sans changer le statut (retard, API momentanément indisponible). */
async function flagSupport(client: Database, row: VideoRow, reason: string) {
  if (row.support_requested_at) return row;
  const saved = await updateVideo(client, row, {
    support_requested_at: new Date().toISOString(),
    error_message: reason.slice(0, 1000),
  });
  if (saved) {
    log(saved, `support: ${reason}`);
    await safe(() => notifyError("Analyse Vidéo", `${reason} • order=${saved.id} • job=${saved.job_id ?? "-"}`));
  }
  return saved;
}

/**
 * Lance le job WavStats d'une commande payée. Un seul appelant gagne le verrou
 * `paid -> starting` ; les autres (webhook rejoué, cron, relance) ne font rien.
 */
export async function launchVideoJob(client: Database, row: VideoRow, apiKey: string) {
  if (row.status !== "paid" || row.job_id) return row;
  const { data: locked, error: lockError } = await client.from("video_analyses")
    .update({
      status: "starting",
      launch_attempts: row.launch_attempts + 1,
      processing_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id).eq("status", "paid").is("job_id", null).eq("launch_attempts", row.launch_attempts)
    .select("*").maybeSingle();
  if (lockError) throw lockError;
  if (!locked) return null;
  const current = locked as VideoRow;
  log(current, `launch attempt=${current.launch_attempts}`);

  if (!apiKey) return await failVideo(client, current, "Clé API WavStats non configurée");

  let response: Response;
  try {
    response = await fetch(`${WAVSTATS_API}/videos/analyze`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ tiktokUrl: current.tiktok_url, quality_mode: "rapide" }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    // Issue inconnue : WavStats a peut-être accepté le job. Pas de second POST automatique.
    return await failVideo(client, current,
      `Lancement interrompu (${err instanceof Error ? err.message : String(err)}) : vérifier GET /jobs?type=video_analysis avant toute relance`);
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    const reason = `Lancement WavStats : HTTP ${response.status} ${detail}`.trim();
    // 429 / 5xx : la requête a été refusée, aucun job créé. Nouvelle tentative par le cron.
    if ((response.status === 429 || response.status >= 500) && current.launch_attempts < VIDEO_MAX_LAUNCH_ATTEMPTS) {
      log(current, `retry later: ${reason}`);
      return await updateVideo(client, current, { status: "paid", error_message: reason.slice(0, 1000) });
    }
    return await failVideo(client, current, reason);
  }

  let jobId: unknown;
  try {
    const body = await response.json();
    jobId = body?.jobId ?? body?.job_id;
  } catch {
    jobId = null;
  }
  if (typeof jobId !== "string" || !jobId.trim()) {
    return await failVideo(client, current, "Réponse WavStats sans identifiant de job : vérifier GET /jobs avant relance");
  }
  const saved = await updateVideo(client, current, { status: "processing", job_id: jobId, error_message: null });
  if (saved) log(saved, "job created");
  return saved;
}

/** Interroge WavStats une fois et fait avancer la commande. */
export async function pollVideo(client: Database, row: VideoRow, apiKey: string) {
  if (row.status !== "processing" || !row.job_id) return row;
  const delayed = Date.now() - new Date(row.processing_started_at || row.created_at).getTime() > VIDEO_DELAY_ALERT_MS;
  const later = async (reason: string) => (delayed ? await flagSupport(client, row, reason) : row);

  let response: Response;
  try {
    response = await fetch(`${WAVSTATS_API}/jobs/${encodeURIComponent(row.job_id)}`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return await later(`Consultation WavStats impossible : ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) {
    await response.body?.cancel();
    const reason = `Consultation WavStats : HTTP ${response.status}`;
    if ([404, 410].includes(response.status)) return await failVideo(client, row, `${reason} : job introuvable`);
    return await later(reason);
  }

  let job: { status?: unknown; result?: unknown; error?: unknown; progressMessage?: unknown };
  try {
    job = await response.json();
  } catch {
    return await later("Réponse WavStats illisible");
  }

  if (job?.status === "completed") {
    if (!job.result) return await failVideo(client, row, "WavStats a terminé le job sans résultat");
    let report: unknown;
    try {
      report = normalizeVideoResult(job.result);
    } catch (err) {
      // Le résultat brut est conservé : le rapport pourra être régénéré sans repayer WavStats.
      const withRaw = await updateVideo(client, row, { result_raw: job.result });
      if (!withRaw) return null;
      return await failVideo(client, withRaw,
        `Résultat WavStats inexploitable : ${err instanceof Error ? err.message : String(err)}`);
    }
    const saved = await updateVideo(client, row, {
      status: "completed",
      result_raw: job.result,
      report_data: report,
      completed_at: new Date().toISOString(),
      error_message: null,
    });
    if (saved) log(saved, "analysis completed");
    return saved;
  }
  if (job?.status === "failed" || job?.status === "cancelled") {
    const detail = typeof job.error === "string" ? job.error
      : (job.error as { message?: string } | undefined)?.message ?? "";
    return await failVideo(client, row, `Job WavStats ${job.status}${detail ? ` : ${detail}` : ""}`);
  }
  return await later("Analyse vidéo supérieure à 15 minutes");
}

/** Met en file l'e-mail « rapport prêt ». Idempotent. */
export async function deliverVideoReport(client: Database, row: VideoRow) {
  if (row.status !== "completed") return row;
  const mail = buildVideoReportEmail(row);
  await queueMail(client, `video-report:${row.id}`, row.email, mail.subject, mail.html);
  const saved = await updateVideo(client, row, {
    status: "delivered",
    result_email_queued_at: new Date().toISOString(),
  });
  if (saved) {
    log(saved, "report email queued");
    await safe(() => notifySuccess("Analyse Vidéo", `Livrée • order=${saved.id}`));
  }
  return saved;
}

/** Fait avancer une commande d'un cran (webhook, cron). */
export async function advanceVideo(client: Database, row: VideoRow, apiKey: string) {
  let current: VideoRow | null = row;
  if (current.status === "paid") current = await launchVideoJob(client, current, apiKey);
  if (current?.status === "processing") current = await pollVideo(client, current, apiKey);
  if (current?.status === "completed") current = await deliverVideoReport(client, current);
  return current;
}
