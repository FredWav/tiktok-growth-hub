import test from "node:test";
import assert from "node:assert/strict";
import { referenceDatabase } from "./reference-db.mjs";

test("vue d'ensemble : ventes du mois, choses à traiter, incidents et places", async () => {
  const db = await referenceDatabase();
  try {
    const empty = (await db.query("SELECT admin_overview() AS o")).rows[0].o;
    assert.equal(empty.sales.express, 0);
    assert.equal(empty.todo.applications, 0);
    assert.equal(empty.places.academy.months.length, 3);

    // Analyse Express payée ce mois-ci, une autre bloquée en cours depuis une heure.
    await db.query(`INSERT INTO express_analyses(tiktok_username, status, stripe_session_id, email)
      VALUES ('payee','complete','cs_live_1','a@example.invalid')`);
    await db.query(`INSERT INTO express_analyses(tiktok_username, status, stripe_session_id, email, created_at, processing_started_at)
      VALUES ('bloquee','processing','cs_live_2','b@example.invalid', now()-interval '1 hour', now()-interval '1 hour')`);
    // Analyse non payée : ni vente ni incident.
    await db.query(`INSERT INTO express_analyses(tiktok_username, status, email) VALUES ('panier','awaiting_payment','c@example.invalid')`);
    // Analyse vidéo échouée, et une demande d'accompagnement à traiter.
    await db.query(`INSERT INTO video_analyses(email, tiktok_url, video_id, status, checkout_mode, paid_at,
        cgv_version, immediate_delivery_notice_version, cgv_accepted_text, immediate_delivery_accepted_text, accepted_at)
      VALUES ('d@example.invalid','https://www.tiktok.com/@x/video/1','1','failed','live', now(), 't','t','t','t', now())`);
    await db.query(`SELECT commerce_submit_application($1)`, [{ request_id: crypto.randomUUID(), offer: "premium", first_name: "T", email: "t@example.invalid", account_or_project: "Projet", objective: "Objectif concret", timing: "", commitments: {}, fingerprint: "x" }]);

    const o = (await db.query("SELECT admin_overview() AS o")).rows[0].o;
    assert.equal(o.sales.express, 2);
    assert.equal(o.sales.video, 1); // payée puis échouée : vente encaissée tant qu'elle n'est pas remboursée
    assert.equal(o.todo.express_incidents, 1);
    assert.equal(o.todo.video_incidents, 1);
    assert.equal(o.todo.applications, 1);
  } finally { await db.close(); }
});

test("vue d'ensemble et tâches planifiées : réservées à la clé de service", async () => {
  const db = await referenceDatabase();
  try {
    for (const role of ["anon", "authenticated"]) {
      for (const fn of ["admin_overview()", "admin_cron_status()"]) {
        const ok = (await db.query(`SELECT has_function_privilege($1,$2,'EXECUTE') AS ok`, [role, fn])).rows[0].ok;
        assert.equal(ok, false, `${role} ${fn}`);
      }
    }
    // Sans pg_cron (base de test), la liste est vide plutôt qu'en erreur.
    assert.deepEqual((await db.query("SELECT admin_cron_status() AS s")).rows[0].s, []);
  } finally { await db.close(); }
});
