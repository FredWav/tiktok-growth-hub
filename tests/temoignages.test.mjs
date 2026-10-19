import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { referenceDatabase } from "./reference-db.mjs";

const seed = readFileSync(new URL("../scripts/sql/temoignages-2026-10.sql", import.meta.url), "utf8");

test("reprise des témoignages du code : fiches complétées sans doublon, rejouable", async () => {
  const db = await referenceDatabase();
  try {
    // Fiches existantes en production (photo déjà saisie, nom exact de la base).
    await db.query(`INSERT INTO trusted_clients(name, avatar_url, offers) VALUES
      ('David Agaesse', 'https://exemple.invalid/david.jpg', '{premium}'),
      ('Lucille', 'https://exemple.invalid/lucille.jpg', '{premium}'),
      ('William Wood', 'https://exemple.invalid/william.jpg', '{premium}')`);
    await db.exec(seed);
    await db.exec(seed);
    const rows = (await db.query(`SELECT * FROM trusted_clients ORDER BY display_order, name`)).rows;
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
    assert.equal(rows.length, 3 + 13); // 3 existantes + 13 créées (David et Lucille complétées)
    assert.equal(byName["David Agaesse"].metric, "×4");
    assert.equal(byName["David Agaesse"].avatar_url, "https://exemple.invalid/david.jpg");
    assert.equal(byName["Lucille"].youtube_id, "Hgkn3ifjSS0");
    assert.equal(byName["William Wood"].metric, null);
    assert.equal(byName["PlotBreaker"].avatar_url, "/plotbreaker.jpg");
    const results = rows.filter((r) => r.metric && r.result && !r.anonymous).map((r) => r.name);
    assert.deepEqual(results.slice(0, 3), ["PlotBreaker", "Antoine au Vietnam", "Lucille"]);
    assert.equal(rows.filter((r) => r.youtube_id).length, 14);
    assert.deepEqual(rows.filter((r) => r.featured).map((r) => r.name).sort(), ["David Agaesse", "Lucille", "PlotBreaker"]);
    await assert.rejects(() => db.query(`UPDATE trusted_clients SET youtube_id='pas-un-id' WHERE name='Hugo'`));
  } finally { await db.close(); }
});
