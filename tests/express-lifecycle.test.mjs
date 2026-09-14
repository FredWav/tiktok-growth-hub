import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { pollExpress, updateExpressAttempt } from "../supabase/functions/_shared/express-finalize.ts";
import { launchExpressJob } from "../supabase/functions/_shared/express-launch.ts";
import { canRetryExpress, isExpressActive, isExpressComplete } from "../supabase/functions/_shared/express-state.ts";
import { readFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const originalDeno = globalThis.Deno;
beforeEach(() => {
  globalThis.Deno = { env: { get: () => "fake-key" } };
  globalThis.fetch = async () => { throw new Error("Unexpected external request blocked"); };
});
afterEach(() => { globalThis.fetch = originalFetch; globalThis.Deno = originalDeno; });

function row(patch = {}) {
  return {
    id: "analysis", tiktok_username: "test", stripe_session_id: "cs_test_fake", email: null,
    status: "processing", job_id: "job-old", report_version: "legacy", result_data: null,
    health_score: null, processing_started_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    support_requested_at: null, error_message: null, ...patch,
  };
}

// In-memory conditional writes model concurrent polls/retries without database access.
function database(initial) {
  let stored = structuredClone(initial);
  let failNextWrite = false;
  let completions = 0;
  const client = {
    from() {
      let patch;
      const filters = [];
      const query = {
        update(value) { patch = value; return this; },
        select() { return this; },
        eq(key, value) { filters.push(r => r[key] === value); return this; },
        is(key, value) { filters.push(r => (r[key] ?? null) === value); return this; },
        async maybeSingle() {
          if (patch && failNextWrite) { failNextWrite = false; return { data: null, error: new Error("write failed") }; }
          if (!filters.every(f => f(stored))) return { data: null, error: null };
          if (patch) {
            if (patch.status === "complete" && stored.status !== "complete") completions++;
            stored = { ...stored, ...patch };
          }
          return { data: structuredClone(stored), error: null };
        },
        single() { return this.maybeSingle(); },
      };
      return query;
    },
  };
  return { client, get row() { return structuredClone(stored); }, change(patch) { Object.assign(stored, patch); },
    failWrite() { failNextWrite = true; }, get completions() { return completions; } };
}

const legacyReport = () => ({
  account: { username: "test" }, aiAnalysis: { summary: "Conseil simulé" },
  healthScore: { total: 60 },
  topVideos: [{ id: "1", date: "2026-09-01", views: 100, likes: 10, comments: 1, shares: 1, saves: 1 }],
});
function sampleReport() {
  const report = legacyReport();
  return { ...report, videos: report.topVideos,
    analysisScope: { videoIds: ["1"], sections: { aiAnalysis: ["1"], healthScore: ["1"] } } };
}
const completed = result => { globalThis.fetch = async () => Response.json({ status: "completed", result }); };

test("un lancement interrompu devient relançable sans créer un second job", async () => {
  const db = database(row({ status: "starting", job_id: null, processing_started_at: null }));
  const result = await pollExpress(db.row, db.client);
  assert.equal(result.status, "failed");
  assert.equal(canRetryExpress(db.row), true);
  assert.match(db.row.error_message, /Lancement interrompu/);
  assert.ok(db.row.support_requested_at);
});

test("ni paiement attendu ni lancement récent ne sont déclarés en échec", async () => {
  for (const status of ["awaiting_payment", "pending", "starting"]) {
    const db = database(row({ status, job_id: null, processing_started_at: status === "starting" ? new Date().toISOString() : null }));
    assert.equal((await pollExpress(db.row, db.client)).status, status);
    assert.equal(db.row.support_requested_at, null);
  }
});

test("404 et 410 sont des échecs explicites, les pannes temporaires restent récupérables", async () => {
  for (const status of [404, 410, 401, 403, 429, 500, 503]) {
    const db = database(row());
    globalThis.fetch = async () => new Response("unavailable", { status });
    const result = await pollExpress(db.row, db.client);
    assert.equal(result.status, [404, 410].includes(status) ? "failed" : "processing");
    assert.match(db.row.error_message, new RegExp("HTTP " + status));
  }
});

test("une coupure réseau est visible puis le même job peut terminer", async () => {
  const db = database(row());
  globalThis.fetch = async () => { throw new DOMException("network timeout", "TimeoutError"); };
  assert.equal((await pollExpress(db.row, db.client)).status, "processing");
  assert.match(db.row.error_message, /network timeout/);
  completed(legacyReport());
  assert.equal((await pollExpress(db.row, db.client)).status, "complete");
  assert.equal(db.row.error_message, null);
});

test("les rapports historiques et les rapports sample-v3 respectent leur contrat enregistré", async () => {
  for (const version of ["legacy", "sample-v3"]) {
    const db = database(row({ report_version: version }));
    completed(version === "legacy" ? legacyReport() : sampleReport());
    assert.equal((await pollExpress(db.row, db.client)).status, "complete");
    assert.equal(db.row.health_score, 60);
    assert.equal(db.row.result_data.sample?.count, version === "sample-v3" ? 1 : undefined);
  }
});

test("aucun contournement de sample-v3 et aucune réussite sans rapport ou sans IA", async () => {
  for (const [version, report] of [["sample-v3", legacyReport()], ["legacy", undefined], ["legacy", { account: { username: "test" } }]]) {
    const db = database(row({ report_version: version }));
    completed(report);
    assert.equal((await pollExpress(db.row, db.client)).status, "failed");
    assert.equal(db.row.result_data, null);
  }
});

test("deux finalisations concurrentes ne produisent qu’une seule transition de réussite", async () => {
  const db = database(row()), snapshot = db.row;
  completed(legacyReport());
  const results = await Promise.all([pollExpress(snapshot, db.client), pollExpress(snapshot, db.client)]);
  assert.ok(results.every(r => r.status === "complete"));
  assert.equal(db.completions, 1);
});

test("une réponse tardive ne peut écraser une relance ou un remboursement", async () => {
  for (const remote of ["completed", "failed"]) {
    for (const change of [{ status: "refunded" }, { status: "processing", job_id: "new-job" }, { status: "processing", processing_started_at: "2026-09-09T12:00:00Z" }]) {
      const db = database(row()), old = db.row;
      globalThis.fetch = async () => { db.change(change); return Response.json({ status: remote, result: legacyReport() }); };
      await pollExpress(old, db.client);
      for (const [key, value] of Object.entries(change)) assert.equal(db.row[key], value);
      assert.equal(db.row.result_data, null);
      assert.equal(db.row.error_message, null);
    }
  }
});

test("les analyses remboursées et les rapports archivés ne déclenchent aucun appel prestataire", async () => {
  for (const status of ["refunded", "complete", "completed"]) {
    const db = database(row({ status, result_data: { saved: true } }));
    const result = await pollExpress(db.row, db.client);
    assert.equal(result.status, status === "refunded" ? "failed" : "complete");
    assert.equal(canRetryExpress({ ...db.row, health_score: 60 }), false);
  }
});

test("deux relances simultanées ne peuvent acquérir le même dossier", async () => {
  const db = database(row({ status: "failed" })), old = db.row;
  const lock = { status: "starting", job_id: null, processing_started_at: new Date().toISOString() };
  const results = await Promise.all([updateExpressAttempt(db.client, old, lock), updateExpressAttempt(db.client, old, lock)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(canRetryExpress(db.row), false);
});

test("le lancement stocke le job et efface les anciens résultats seulement après acceptation", async () => {
  const db = database(row({ status: "starting", job_id: null, tiktok_username: "@TEST", result_data: { previous: true } }));
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.match(url, /accounts\/test\/analyze$/); assert.equal(options.method, "POST"); assert.ok(options.signal);
    return Response.json({ jobId: "new-job" });
  };
  await launchExpressJob(db.client, db.row, "fake-key");
  assert.equal(calls, 1); assert.equal(db.row.status, "processing"); assert.equal(db.row.job_id, "new-job");
  assert.equal(db.row.result_data, null);
});

test("timeout et réponse sans job donnent un échec récupérable sans répéter le POST", async () => {
  for (const timeout of [false, true]) {
    const db = database(row({ status: "starting", job_id: null }));
    let calls = 0;
    globalThis.fetch = async () => { calls++; if (timeout) throw new DOMException("timeout", "TimeoutError"); return Response.json({}); };
    await assert.rejects(launchExpressJob(db.client, db.row, "fake-key"));
    assert.equal(calls, 1); assert.equal(db.row.status, "failed"); assert.match(db.row.error_message, /vérifier WavStats/);
  }
});

test("un échec de stockage conserve l’identifiant distant pour récupération manuelle", async () => {
  const db = database(row({ status: "starting", job_id: null }));
  globalThis.fetch = async () => { db.failWrite(); return Response.json({ job_id: "recover-me" }); };
  await assert.rejects(launchExpressJob(db.client, db.row, "fake-key"));
  assert.equal(db.row.status, "failed"); assert.match(db.row.error_message, /recover-me/);
});

test("les nouveaux statuts sont distingués des achats non payés dans le suivi admin", () => {
  assert.equal(isExpressActive(row({ status: "starting", job_id: null })), true);
  assert.equal(isExpressActive(row({ status: "awaiting_payment", job_id: null })), false);
  assert.equal(isExpressActive(row({ status: "pending", job_id: null })), false);
  assert.equal(isExpressComplete(row({ status: "completed" })), true);
  assert.equal(canRetryExpress(row({ status: "complete", health_score: 60, error_message: "IA absente" })), true);
});

test("le checkout reste ouvert en legacy tant que sample-v3 n'est pas validé", () => {
  const source = readFileSync(new URL("../supabase/functions/create-express-checkout/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /nouvelles analyses sont temporairement suspendues/);
  assert.match(source, /EXPRESS_SAMPLE_CONTRACT_VERIFIED[\s\S]*\?[\s\S]*"sample-v3"[\s\S]*:[\s\S]*"legacy"/);
  assert.match(source, /report_version:\s*reportVersion/);
});

test("le webhook exige un événement Stripe signé et un paiement confirmé avant les emails Express", () => {
  const source = readFileSync(new URL("../supabase/functions/stripe-webhook/index.ts", import.meta.url), "utf8");
  const signatureCheck = source.indexOf("constructEventAsync");
  const paymentCheck = source.indexOf('if (session.payment_status === "paid")');
  const confirmation = source.lastIndexOf("await sendExpressOrderConfirmation");
  const analysisLaunch = source.lastIndexOf("await triggerExpressAnalysis");
  assert.ok(signatureCheck >= 0);
  assert.ok(paymentCheck > signatureCheck);
  assert.ok(confirmation > paymentCheck);
  assert.ok(analysisLaunch > confirmation);
  assert.match(source, /checkout\.session\.async_payment_succeeded/);
  assert.match(source, /express-contract:\$\{session\.id\}/);
});

test("les emails Express utilisent une file durable avec déduplication et cinq tentatives", () => {
  const commerce = readFileSync(new URL("../supabase/functions/_shared/commerce.ts", import.meta.url), "utf8");
  const reconciliation = readFileSync(new URL("../supabase/functions/reconcile-express-analyses/index.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20260908120000_commerce_v3.sql", import.meta.url), "utf8");
  const scheduler = readFileSync(new URL("../supabase/migrations/20260908121000_commerce_scheduler.sql", import.meta.url), "utf8");
  assert.match(commerce, /state\.in\.\(pending,failed\)/);
  assert.match(commerce, /\.lt\("attempts", 5\)/);
  assert.match(commerce, /SMTP_PASSWORD/);
  assert.match(reconciliation, /await deliverMail\(client\)/);
  assert.match(migration, /dedupe_key text NOT NULL UNIQUE/);
  assert.match(migration, /express-result:'\|\|NEW\.id/);
  assert.match(scheduler, /cron\.schedule\('express-v3-minute','\* \* \* \* \*'/);
});

test("la page Express annonce jusqu’à 120 vidéos sans tiret cadratin", () => {
  const source = readFileSync(new URL("../src/pages/AnalyseExpress.tsx", import.meta.url), "utf8");
  assert.match(source, /jusqu’à 120 vidéos/);
  assert.doesNotMatch(source, /120 maximum|max 120|\u2014/i);
});
