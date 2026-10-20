import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { referenceDatabase } from "./reference-db.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("rétractation : formulaire, fonction et base proposent les mêmes prestations", async () => {
  const form = [...read("src/pages/Retractation.tsx").matchAll(/<option value="([a-z_]+)">/g)].map((m) => m[1]);
  const labels = read("supabase/functions/withdrawal-request/index.ts").match(/const OFFER_LABELS[^}]+}/)[0];
  const server = [...labels.matchAll(/^\s+([a-z_]+):/gm)].map((m) => m[1]);
  assert.deepEqual(form, server);
  for (const offer of ["analyse_express", "analyse_video", "one_shot", "wav_academy", "wav_premium", "hooks_packs"]) {
    assert.ok(form.includes(offer), offer);
  }

  const db = await referenceDatabase();
  try {
    for (const [i, offer] of form.entries()) {
      await db.query(`INSERT INTO withdrawal_requests(request_reference, customer_name, email, order_reference, offer, declaration_version, declaration_text)
        VALUES ($1, 'Test', 't@example.invalid', 'ref', $2, 'v1', 'Je me rétracte.')`, [`RET-TEST-${i}`, offer]);
    }
    await assert.rejects(db.query(`INSERT INTO withdrawal_requests(request_reference, customer_name, email, order_reference, offer, declaration_version, declaration_text)
      VALUES ('RET-TEST-X', 'Test', 't@example.invalid', 'ref', 'inconnue', 'v1', 'Je me rétracte.')`), /withdrawal_requests_offer_check/);
  } finally { await db.close(); }
});
