import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseTikTokVideoUrl } from "../supabase/functions/_shared/tiktok-video-url.ts";
import {
  advanceVideo,
  deliverVideoReport,
  launchVideoJob,
  pollVideo,
  VIDEO_MAX_LAUNCH_ATTEMPTS,
} from "../supabase/functions/_shared/video-analysis.ts";

const originalFetch = globalThis.fetch;
const originalDeno = globalThis.Deno;
let calls;
beforeEach(() => {
  calls = [];
  globalThis.Deno = { env: { get: () => undefined } };
  globalThis.fetch = async () => { throw new Error("Unexpected external request blocked"); };
});
afterEach(() => { globalThis.fetch = originalFetch; globalThis.Deno = originalDeno; });

function row(patch = {}) {
  return {
    id: "order-1", email: "client@example.com", tiktok_url: "https://www.tiktok.com/@fred/video/7400000000000000000",
    video_id: "7400000000000000000", status: "paid", checkout_mode: "live", stripe_session_id: "cs_live_x",
    job_id: null, launch_attempts: 0, processing_started_at: null, report_token: "11111111-1111-4111-8111-111111111111",
    support_requested_at: null, error_message: null, result_raw: null, report_data: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...patch,
  };
}

// Écritures conditionnelles en mémoire : modélise les exécutions concurrentes sans base réelle.
function database(initial) {
  let stored = structuredClone(initial);
  const mails = new Map();
  const client = {
    from(table) {
      if (table === "commerce_mail") {
        return {
          async upsert(value) {
            if (!mails.has(value.dedupe_key)) mails.set(value.dedupe_key, value);
            return { error: null };
          },
        };
      }
      let patch;
      const filters = [];
      return {
        update(value) { patch = value; return this; },
        select() { return this; },
        eq(key, value) { filters.push(r => r[key] === value); return this; },
        is(key, value) { filters.push(r => (r[key] ?? null) === value); return this; },
        async maybeSingle() {
          if (!filters.every(f => f(stored))) return { data: null, error: null };
          if (patch) stored = { ...stored, ...patch };
          return { data: structuredClone(stored), error: null };
        },
        single() { return this.maybeSingle(); },
      };
    },
  };
  return { client, get row() { return structuredClone(stored); }, mails };
}

const wavstats = (handler) => {
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (!u.startsWith("https://wavstats.com/")) return new Response("{}");
    calls.push({ url: u, method: init.method || "GET", body: init.body });
    return handler(u, init);
  };
};

test("URL : formes valides normalisées, liens courts reconnus, le reste refusé", () => {
  const v = parseTikTokVideoUrl("https://www.tiktok.com/@Fred.Wav/video/7412345678901234567?is_from_webapp=1&sender_device=pc");
  assert.deepEqual(v, { kind: "video", username: "fred.wav", videoId: "7412345678901234567",
    url: "https://www.tiktok.com/@fred.wav/video/7412345678901234567" });
  assert.equal(parseTikTokVideoUrl("m.tiktok.com/@a/video/7412345678901234567").kind, "video");
  assert.equal(parseTikTokVideoUrl("Regarde ça https://vm.tiktok.com/ZMabc123/ trop bien").kind, "short");
  assert.equal(parseTikTokVideoUrl("https://www.tiktok.com/t/ZT8abcdEf/").kind, "short");
  for (const bad of ["", "   ", "bonjour", "https://www.youtube.com/watch?v=1", "https://evil.com/@a/video/7412345678901234567",
    "https://www.tiktok.com/@fred", "https://www.tiktok.com/@a/video/abc", "https://tiktok.com.evil.com/@a/video/7412345678901234567", 42, null]) {
    assert.equal(parseTikTokVideoUrl(bad).kind, "invalid", String(bad));
  }
  assert.match(parseTikTokVideoUrl("https://www.tiktok.com/@a/photo/7412345678901234567").reason, /carrousel/);
});

test("un seul POST WavStats même si le lancement est appelé deux fois en parallèle", async () => {
  const db = database(row());
  wavstats(async () => { await new Promise(r => setTimeout(r, 5)); return Response.json({ jobId: "job-1", status: "pending" }, { status: 202 }); });
  const snapshot = db.row;
  await Promise.all([launchVideoJob(db.client, snapshot, "k"), launchVideoJob(db.client, snapshot, "k")]);
  assert.equal(calls.filter(c => c.method === "POST").length, 1);
  assert.equal(db.row.status, "processing");
  assert.equal(db.row.job_id, "job-1");
  assert.deepEqual(JSON.parse(calls[0].body), { tiktokUrl: snapshot.tiktok_url, quality_mode: "rapide" });
});

test("rejeu (webhook, cron) sur une commande déjà lancée : aucun nouveau POST", async () => {
  const db = database(row({ status: "processing", job_id: "job-1", processing_started_at: new Date().toISOString() }));
  wavstats(async () => Response.json({ status: "processing", progress: 40 }));
  await launchVideoJob(db.client, db.row, "k");
  await advanceVideo(db.client, db.row, "k");
  assert.equal(calls.filter(c => c.method === "POST").length, 0);
  assert.equal(db.row.status, "processing");
});

test("429 / 5xx : retour en file, puis échec après le nombre maximal de tentatives", async () => {
  const db = database(row());
  wavstats(async () => new Response('{"error":{"code":"rate_limited"}}', { status: 429 }));
  await launchVideoJob(db.client, db.row, "k");
  assert.equal(db.row.status, "paid");
  assert.equal(db.row.launch_attempts, 1);
  for (let i = 1; i < VIDEO_MAX_LAUNCH_ATTEMPTS; i++) await launchVideoJob(db.client, db.row, "k");
  assert.equal(db.row.status, "failed");
  assert.equal(calls.length, VIDEO_MAX_LAUNCH_ATTEMPTS);
  assert.ok(db.mails.has("video-failed:order-1"));
});

test("timeout réseau au lancement : échec support, jamais de second POST", async () => {
  const db = database(row());
  wavstats(async () => { throw new Error("timeout"); });
  await launchVideoJob(db.client, db.row, "k");
  assert.equal(db.row.status, "failed");
  assert.match(db.row.error_message, /GET \/jobs/);
  await launchVideoJob(db.client, db.row, "k");
  assert.equal(calls.length, 1);
});

test("400 (vidéo privée ou invalide) : échec immédiat, client et Fred prévenus", async () => {
  const db = database(row());
  wavstats(async () => new Response('{"error":{"code":"bad_request"}}', { status: 400 }));
  await launchVideoJob(db.client, db.row, "k");
  assert.equal(db.row.status, "failed");
  assert.ok(db.mails.has("video-failed:order-1"));
  assert.ok(db.mails.has("video-failed-owner:order-1"));
});

test("job failed / cancelled : commande en échec, jobId conservé, aucun rapport", async () => {
  for (const status of ["failed", "cancelled"]) {
    const db = database(row({ status: "processing", job_id: "job-1", processing_started_at: new Date().toISOString() }));
    wavstats(async () => Response.json({ status, error: { message: "video unavailable" } }));
    await pollVideo(db.client, db.row, "k");
    assert.equal(db.row.status, "failed");
    assert.equal(db.row.job_id, "job-1");
    assert.equal(db.row.report_data, null);
    assert.ok(!db.mails.has("video-report:order-1"));
  }
});

test("API indisponible : la commande reste en cours, alerte seulement après 15 minutes", async () => {
  const db = database(row({ status: "processing", job_id: "job-1", processing_started_at: new Date().toISOString() }));
  wavstats(async () => new Response("", { status: 503 }));
  await pollVideo(db.client, db.row, "k");
  assert.equal(db.row.status, "processing");
  assert.equal(db.row.support_requested_at, null);
  const late = database(row({ status: "processing", job_id: "job-1", processing_started_at: new Date(Date.now() - 20 * 60_000).toISOString() }));
  await pollVideo(late.client, late.row, "k");
  assert.equal(late.row.status, "processing");
  assert.ok(late.row.support_requested_at);
});

test("résultat inexploitable : échec, résultat brut conservé pour régénérer sans repayer", async () => {
  const db = database(row({ status: "processing", job_id: "job-1", processing_started_at: new Date().toISOString() }));
  wavstats(async () => Response.json({ status: "completed", result: { unexpected: true } }));
  await pollVideo(db.client, db.row, "k");
  assert.equal(db.row.status, "failed");
  assert.deepEqual(db.row.result_raw, { unexpected: true });
  assert.ok(!db.mails.has("video-report:order-1"));
});

test("livraison : un seul e-mail même si elle est rejouée", async () => {
  const db = database(row({ status: "completed", job_id: "job-1", report_data: { version: "video-v1" } }));
  const snapshot = db.row;
  await deliverVideoReport(db.client, snapshot);
  await deliverVideoReport(db.client, snapshot);
  assert.equal(db.row.status, "delivered");
  assert.equal(db.mails.size, 1);
  const mail = db.mails.get("video-report:order-1");
  assert.equal(mail.subject, "Ton analyse vidéo TikTok est prête 🚀");
  assert.match(mail.body, /analyse-video\/rapport\?t=11111111-1111-4111-8111-111111111111/);
});
