import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("CGV : une seule version, affichée sur la page et enregistrée avec chaque consentement", () => {
  const shared = read("supabase/functions/_shared/consent-texts.ts");
  assert.match(shared, /export const VERSION = "\d{4}-\d{2}-\d{2}";/);
  // La page CGV et les paiements des analyses lisent cette version, sans copie locale.
  assert.match(read("src/pages/CGV.tsx"), /version \{VERSION\}/);
  for (const fn of ["create-express-checkout", "create-video-checkout"]) {
    const source = read(`supabase/functions/${fn}/index.ts`);
    assert.match(source, /import \{ VERSION as CGV_VERSION \} from "\.\.\/_shared\/consent-texts\.ts";/, fn);
    assert.doesNotMatch(source, /const CGV_VERSION = /, fn);
  }
});

test("CGV : pas de limite de responsabilité opposée aux consommateurs, garanties légales et médiateur indiqués", () => {
  const cgv = read("src/pages/CGV.tsx");
  assert.match(cgv, /clients professionnels, la responsabilité totale/);
  assert.match(cgv, /garantie légale de conformité/);
  assert.match(cgv, /sasmediationsolution-conso\.fr/);
  assert.doesNotMatch(cgv, /jusqu'à l'ouverture de l'inscription en ligne/);
});
