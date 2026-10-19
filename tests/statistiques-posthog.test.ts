import test from "node:test";
import assert from "node:assert/strict";
import { fetchSiteStats, parseRange, statsQueries, todayInParis } from "../supabase/functions/_shared/posthog-stats.ts";
import { offerFromHref } from "../src/lib/funnel-offers.ts";

test("période : format strict, jamais dans le futur, 366 jours au plus", () => {
  assert.deepEqual(parseRange("2026-10-01", "2026-10-19", "2026-10-19"), { from: "2026-10-01", to: "2026-10-19" });
  assert.throws(() => parseRange("2026-10-01' OR 1=1 --", "2026-10-19", "2026-10-19"), /AAAA-MM-JJ/);
  assert.throws(() => parseRange("2026-10-10", "2026-10-01", "2026-10-19"), /après/);
  assert.throws(() => parseRange("2026-10-01", "2026-10-20", "2026-10-19"), /futur/);
  assert.throws(() => parseRange("2025-10-18", "2026-10-19", "2026-10-19"), /trop longue/);
  assert.doesNotThrow(() => parseRange("2025-10-19", "2026-10-19", "2026-10-19"));
  // Minuit à Paris (22 h UTC en été) : on est déjà le lendemain.
  assert.equal(todayInParis(new Date("2026-08-01T22:30:00Z")), "2026-08-02");
});

test("requêtes : bornes en heure de Paris, anciens événements rattachés au vocabulaire commun", () => {
  const q = statsQueries({ from: "2026-10-01", to: "2026-10-31" });
  assert.match(q.audience, /toDateTime\('2026-10-01 00:00:00', 'Europe\/Paris'\)/);
  assert.match(q.audience, /timestamp < toDateTime\('2026-11-01 00:00:00', 'Europe\/Paris'\)/);
  // Les événements de paiement (nouveaux et anciens) sont lus, et tombent dans l'étape par défaut.
  assert.match(q.funnel, /'checkout_start', 'express_checkout_start', 'video_checkout_start', 'checkout_open'\) AND timestamp/);
  assert.match(q.funnel, /'application_submit', 'checkout_start'\) AS step/);
  assert.match(q.funnel, /event IN \('express_cta_click', 'express_checkout_start'\), 'express'/);
  // Aucune requête ne lit de donnée personnelle.
  for (const sql of Object.values(q)) assert.doesNotMatch(sql, /email|\$ip|distinct_id|properties\s*(,|FROM)/i);
});

test("PostHog absent ou en panne : bloc indisponible avec sa raison, jamais zéro", async () => {
  const range = { from: "2026-10-01", to: "2026-10-02" };
  const none = await fetchSiteStats(fetch, null, range);
  assert.deepEqual(Object.values(none).map((b) => b.available), Array(7).fill(false));
  assert.match((none.audience as { reason: string }).reason, /POSTHOG_PERSONAL_API_KEY/);

  const calls: string[] = [];
  const fakeFetch = async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push(url);
    assert.equal((init.headers as Record<string, string>).Authorization, "Bearer phx_test");
    if (body.query.query.includes("argMin(toString(properties.$referring_domain)")) return new Response("{}", { status: 503 });
    return Response.json({ columns: ["pageviews", "visitors"], results: [[12, 5]] });
  };
  const stats = await fetchSiteStats(fakeFetch, { apiKey: "phx_test", projectId: "324948", host: "https://us.posthog.com" }, range);
  assert.equal(calls[0], "https://us.posthog.com/api/projects/324948/query/");
  assert.deepEqual(stats.audience, { available: true, rows: [{ pageviews: 12, visitors: 5 }] });
  assert.deepEqual(stats.sources, { available: false, reason: "PostHog a répondu 503" });
});

test("clic commercial : offre déduite du lien", () => {
  assert.equal(offerFromHref("/analyse-express"), "express");
  assert.equal(offerFromHref("/analyse-video"), "video");
  assert.equal(offerFromHref("/wavacademy"), "academy");
  assert.equal(offerFromHref("/academy/inscription"), "academy");
  assert.equal(offerFromHref("/one-shot#modalites"), "one_shot");
  assert.equal(offerFromHref("/candidature?offre=premium"), "premium");
  assert.equal(offerFromHref("/candidature?offre=conseil"), "conseil");
  assert.equal(offerFromHref("/candidature"), "conseil");
  assert.equal(offerFromHref("/accompagnements"), "accompagnements");
  assert.equal(offerFromHref("/temoignages"), "autre");
});
