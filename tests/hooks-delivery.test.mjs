import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHooksEmail,
  hasHooksConsent,
  HOOKS_CHECKOUT_CONSENT,
  HOOKS_CONSENT_TEXT,
  HOOKS_PACKS,
  hooksPackFor,
} from "../supabase/functions/_shared/hooks-delivery.ts";

const email = (patch = {}) => buildHooksEmail({
  pack: HOOKS_PACKS.hooks_250,
  accessUrl: "https://fredwav.com/claim/hooks#exemple",
  customerName: "Camille Martin",
  amountCents: 4900,
  currency: "eur",
  sessionId: "cs_live_123",
  paidAt: new Date("2026-09-23T10:00:00Z"),
  siteUrl: "https://fredwav.com",
  ...patch,
});

test("Hooks : le pack vient uniquement d'un code produit connu", () => {
  assert.equal(hooksPackFor({ produit: "hooks_100" })?.name, "Pack 100 hooks");
  assert.equal(hooksPackFor({ produit: "hooks_850" })?.code, "hooks_850");
  for (const metadata of [null, undefined, {}, { produit: "hooks_42" }, { produit: "toString" }, { produit: "__proto__" }]) {
    assert.equal(hooksPackFor(metadata), null);
  }
});

test("Hooks : la bibliothèque complète livre les fichiers des 3 packs, sans doublon", () => {
  const paths = HOOKS_PACKS.hooks_850.files.map((f) => f.path);
  const packs = ["hooks_100", "hooks_250", "hooks_500"].flatMap((c) => HOOKS_PACKS[c].files.map((f) => f.path));
  assert.deepEqual([...paths].sort(), [...packs].sort());
  assert.equal(new Set(paths).size, paths.length);
});

test("Hooks : l'email confirme l'accord avant le téléchargement et contient un lien d'accès", () => {
  const { subject, html } = email();
  assert.equal(subject, "Tes hooks sont prêts : Pack 250 hooks");
  assert.match(html, /Salut Camille,/);
  assert.match(html, /49,00/);
  assert.match(html, /cs_live_123/);
  assert.ok(html.includes("https://fredwav.com/claim/hooks#exemple"));
  assert.doesNotMatch(html, /pack-250\.(pdf|xlsx)/);
  assert.ok(html.includes(HOOKS_CONSENT_TEXT.replace(/'/g, "&#39;")));
  assert.match(html, /premier téléchargement/);
  assert.match(html, /\/retractation/);
  assert.match(html, /Modèle à compléter/);
  assert.doesNotMatch(html, /[—–→]/);
});

test("Hooks : seul l'accord exprès exact, obligatoire et accepté, débloque la livraison", () => {
  const session = {
    consent: { terms_of_service: "accepted" },
    consent_collection: { terms_of_service: "required" },
    custom_text: { terms_of_service_acceptance: { message: HOOKS_CHECKOUT_CONSENT } },
  };
  assert.equal(hasHooksConsent(session), true);
  assert.equal(hasHooksConsent({ ...session, consent: null }), false);
  assert.equal(hasHooksConsent({ ...session, consent_collection: { terms_of_service: "none" } }), false);
  assert.equal(hasHooksConsent({ ...session, custom_text: null }), false);
  assert.equal(hasHooksConsent({
    ...session,
    custom_text: { terms_of_service_acceptance: { message: "J’accepte les CGV." } },
  }), false);
});

test("Hooks : le nom du client est échappé", () => {
  const { html } = email({ customerName: "<script>x</script> Doe" });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Salut &lt;script&gt;x&lt;\/script&gt;,/);
  assert.match(email({ customerName: null }).html, /Salut,/);
});
