// Sonde ponctuelle : récupère le JSON réel d'un job WavStats `video_analysis`.
//
// La clé n'est jamais écrite dans le dépôt : elle est lue dans l'environnement du terminal.
//   $env:WAVSTATS_API_KEY = "wss_..."
//   node scripts/wavstats-video-probe.mjs                     -> réutilise un job vidéo déjà terminé (gratuit)
//   node scripts/wavstats-video-probe.mjs <url-tiktok>        -> idem, sinon lance UNE analyse de cette vidéo
//   node scripts/wavstats-video-probe.mjs --force <url>       -> lance une analyse même si un job existe
//
// Le JSON brut est enregistré dans tmp/ (ignoré par git).
import { mkdirSync, writeFileSync } from "node:fs";

const API = "https://wavstats.com/api/v1";
const key = process.env.WAVSTATS_API_KEY;
if (!key) {
  console.error("WAVSTATS_API_KEY absente de l'environnement.");
  process.exit(1);
}
const args = process.argv.slice(2);
const force = args.includes("--force");
const url = args.find((a) => a !== "--force");

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "X-API-Key": key, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} -> HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

function save(job, extra = {}) {
  mkdirSync("tmp", { recursive: true });
  const file = `tmp/wavstats-video-${job.id}.json`;
  writeFileSync(file, JSON.stringify({ probe: extra, job }, null, 2));
  console.log(`JSON brut enregistré : ${file}`);
  console.log(`status=${job.status} creditsSpent=${job.creditsSpent ?? "?"} completedAt=${job.completedAt ?? "?"}`);
}

if (!force) {
  const list = await call("/jobs?type=video_analysis&status=completed&limit=5");
  const first = list.jobs?.[0];
  if (first) {
    console.log(`Job vidéo terminé trouvé : ${first.id} (aucun crédit dépensé)`);
    save(await call(`/jobs/${encodeURIComponent(first.id)}`), { source: "existing" });
    process.exit(0);
  }
  console.log("Aucun job vidéo terminé sur cette clé.");
}

if (!url) {
  console.error("Passe l'URL d'une vidéo TikTok publique pour lancer UNE analyse.");
  process.exit(1);
}

const started = Date.now();
const launch = await call("/videos/analyze", {
  method: "POST",
  body: JSON.stringify({ tiktokUrl: url, quality_mode: "rapide" }),
});
const jobId = launch.jobId ?? launch.job_id;
console.log(`Analyse lancée : job ${jobId}`);

while (Date.now() - started < 15 * 60_000) {
  await new Promise((r) => setTimeout(r, 20_000));
  const job = await call(`/jobs/${encodeURIComponent(jobId)}`);
  console.log(`${Math.round((Date.now() - started) / 1000)} s : ${job.status} ${job.progress ?? ""} ${job.progressMessage ?? ""}`);
  if (["completed", "failed", "cancelled"].includes(job.status)) {
    save(job, { source: "launched", tiktokUrl: url, durationSeconds: Math.round((Date.now() - started) / 1000) });
    process.exit(job.status === "completed" ? 0 : 2);
  }
}
console.error(`Délai de 15 min dépassé : job ${jobId} toujours en cours (relancer la sonde sans --force le récupérera).`);
process.exit(3);
