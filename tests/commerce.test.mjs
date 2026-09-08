import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExpressSample } from "../supabase/functions/_shared/express-sample.ts";
import { checkoutMismatch } from "../supabase/functions/_shared/checkout-validation.ts";

test("Stripe : produit, montant, devise, quantité et configuration contrôlés", () => {
  const session = { mode: "payment", currency: "eur", amount_total: 1190 };
  const items = [{ quantity: 1, price: { id: "price_express" } }];
  assert.equal(checkoutMismatch(session, items, "price_express", 1190), null);
  for (const patch of [{currency:"usd"}, {amount_total:100}, {mode:"subscription"}]) assert.ok(checkoutMismatch({...session,...patch},items,"price_express",1190));
  assert.ok(checkoutMismatch(session, items, undefined, 1190));
  assert.ok(checkoutMismatch(session, items, "price_other", 1190));
  assert.ok(checkoutMismatch(session, [...items,...items], "price_express", 1190));
  assert.ok(checkoutMismatch(session, [{...items[0],quantity:2}], "price_express", 1190));
});

function fixture(count) {
  const videos = Array.from(
    { length: count },
    (_, i) => ({
      id: String(i + 1),
      date: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
      views: 100 + i,
      likes: 10,
      comments: 2,
      shares: 1,
      saves: 1,
    }),
  );
  const videoIds = videos.map((v) => v.id);
  return {
    account: {
      username: "test",
      followers: 900,
      totalVideos: 500,
      totalLikes: 9000,
    },
    videos,
    aiAnalysis: { summary: "Hypothèse à vérifier" },
    healthScore: { total: 50 },
    averages: { views: 999999 },
    analysisScope: {
      videoIds,
      sections: { aiAnalysis: videoIds, healthScore: videoIds },
    },
  };
}
test("120 vidéos : mêmes moyennes et médianes, compteurs globaux séparés", () => {
  const result = normalizeExpressSample(fixture(120));
  assert.equal(result.sample.count, 120);
  assert.equal(result.sample.limited, false);
  assert.equal(result.account.avg_views, 159.5);
  assert.equal(result.account.median_views, 159.5);
  assert.equal(result.account.video_count, 500);
  assert.equal(result.account.follower_count, 900);
  assert.equal(result.top_videos[0].id, "120");
  assert.equal(result.account.recent_videos.length, 120);
  assert.equal(result.account.niche_confidence, null);
});
test("petit compte : analyse possible avec avertissement", () => {
  const result = normalizeExpressSample(fixture(3));
  assert.equal(result.sample.count, 3);
  assert.equal(result.sample.limited, true);
  assert.equal(result.account.avg_views, 101);
});
test("zéro, compte privé et échantillon surdimensionné refusés", () => {
  assert.throws(() => normalizeExpressSample(fixture(0)));
  assert.throws(() => normalizeExpressSample(fixture(121)));
  const f = fixture(3);
  f.account.isPrivate = true;
  assert.throws(() => normalizeExpressSample(f), /privé/);
});
test("aucun remplacement cosmétique de 30 par 120 dans les recommandations", () => {
  const f = fixture(120);
  f.analysisScope.sections.aiAnalysis = f.analysisScope.videoIds.slice(0, 30);
  assert.throws(() => normalizeExpressSample(f), /Périmètre divergent/);
});
test("données absentes, dates invalides et doublons non présentés comme complets", () => {
  const f = fixture(3);
  delete f.videos[0].saves;
  assert.throws(() => normalizeExpressSample(f), /Métrique indisponible/);
  const g = fixture(3);
  g.videos[1].id = g.videos[0].id;
  assert.throws(() => normalizeExpressSample(g), /dupliqués/);
  const h = fixture(3);
  h.videos[0].date = "invalid";
  assert.throws(() => normalizeExpressSample(h), /Dates/);
});
