import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHooksEmail,
  HOOKS_CONSENT_TEXT,
  HOOKS_PACKS,
  hooksPackFor,
} from "../supabase/functions/_shared/hooks-delivery.ts";

const email = (patch = {}) => buildHooksEmail({
  pack: HOOKS_PACKS.hooks_250,
  links: HOOKS_PACKS.hooks_250.files.map((f) => ({ label: f.label, url: `https://x.test/${f.path}?token=a&b=1` })),
  customerName: "Camille Martin",
  amountCents: 4900,
  currency: "eur",
  sessionId: "cs_live_123",
  paidAt: new Date("2026-09-23T10:00:00Z"),
  consentAccepted: true,
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

test("Hooks : l'email contient les liens, le récapitulatif et la renonciation", () => {
  const { subject, html } = email();
  assert.equal(subject, "Tes hooks sont prêts : Pack 250 hooks");
  assert.match(html, /Salut Camille,/);
  assert.match(html, /49,00/);
  assert.match(html, /cs_live_123/);
  assert.ok(html.includes("https://x.test/pack-250.pdf?token=a&amp;b=1"));
  assert.ok(html.includes("https://x.test/pack-250.xlsx?token=a&amp;b=1"));
  assert.ok(html.includes(HOOKS_CONSENT_TEXT.replace(/'/g, "&#39;")));
  assert.doesNotMatch(html, /[—–→]/);
});

test("Hooks : sans consentement Stripe, l'email n'affirme pas de renonciation", () => {
  const { html } = email({ consentAccepted: false });
  assert.doesNotMatch(html, /renonce/);
});

test("Hooks : le nom du client est échappé", () => {
  const { html } = email({ customerName: "<script>x</script> Doe" });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Salut &lt;script&gt;x&lt;\/script&gt;,/);
  assert.match(email({ customerName: null }).html, /Salut,/);
});
