import test from "node:test";
import assert from "node:assert/strict";
import { referenceDatabase } from "./reference-db.mjs";

const sales = async (db, from, to) => (await db.query("SELECT admin_sales($1, $2) AS s", [from, to])).rows[0].s;

test("ventes par période : paiements confirmés seulement, heure de Paris, remboursements déduits", async () => {
  const db = await referenceDatabase();
  try {
    const empty = await sales(db, "2026-10-01", "2026-10-03");
    assert.deepEqual(empty.analyses, { express: 0, video: 0 });
    assert.equal(empty.daily.length, 3);
    assert.deepEqual(empty.accompagnements.academy, { orders: 0, revenue_cents: 0 });

    // Express payée le 2 octobre à 23 h 30 à Paris (21 h 30 UTC) : comptée le 2, pas le 3.
    await db.query(`INSERT INTO express_analyses(tiktok_username, status, stripe_session_id, email, created_at)
      VALUES ('payee','complete','cs_live_1','a@example.invalid','2026-10-02 21:30:00+00')`);
    // Panier abandonné : jamais une vente.
    await db.query(`INSERT INTO express_analyses(tiktok_username, status, email, created_at)
      VALUES ('panier','awaiting_payment','b@example.invalid','2026-10-02 10:00:00+00')`);
    // Vidéos : une payée en réel, une en mode test, une remboursée.
    for (const [mode, status] of [["live", "completed"], ["test", "completed"], ["live", "refunded"]]) {
      await db.query(`INSERT INTO video_analyses(email, tiktok_url, video_id, status, checkout_mode, paid_at,
          cgv_version, immediate_delivery_notice_version, cgv_accepted_text, immediate_delivery_accepted_text, accepted_at)
        VALUES ('v@example.invalid','https://www.tiktok.com/@x/video/1','1',$1,$2,'2026-10-01 09:00:00+00','t','t','t','t', now())`, [status, mode]);
    }
    // Academy payée 749 €, puis 100 € remboursés.
    const order = (await db.query(`INSERT INTO commerce_orders(offer, email, first_name, amount_cents, amount_received, paid_at, status, start_date)
      VALUES ('academy','c@example.invalid','C',74900,74900,'2026-10-03 08:00:00+00','active','2026-11-01') RETURNING id`)).rows[0].id;
    await db.query(`INSERT INTO commerce_receipts(order_id, method, reference, amount_cents, received_at)
      VALUES ($1,'stripe','pi_1',74900,'2026-10-03 08:00:00+00'), ($1,'refund','re_1',-10000,'2026-10-03 12:00:00+00')`, [order]);
    await db.query(`SELECT commerce_submit_application($1)`, [{ request_id: crypto.randomUUID(), offer: "premium", first_name: "T",
      email: "t@example.invalid", account_or_project: "Projet", objective: "Objectif concret", timing: "", commitments: {}, fingerprint: "x" }]);

    const s = await sales(db, "2026-10-01", "2026-10-03");
    assert.deepEqual(s.analyses, { express: 1, video: 1 });
    assert.deepEqual(s.accompagnements.academy, { orders: 1, revenue_cents: 64900 });
    assert.deepEqual(s.accompagnements.premium, { orders: 0, revenue_cents: 0 });
    assert.deepEqual(s.daily.map((d) => [d.day, d.express, d.video, d.revenue_cents]), [
      ["2026-10-01", 0, 1, 0],
      ["2026-10-02", 1, 0, 0],
      ["2026-10-03", 0, 0, 64900],
    ]);
    // La demande Premium a été créée maintenant, hors de la période.
    assert.equal(s.applications.premium, 0);
    const today = new Date().toISOString().slice(0, 10);
    assert.equal((await sales(db, today, today)).applications.premium, 1);
  } finally { await db.close(); }
});

test("statistiques : fonction et cache réservés à la clé de service, page_views fermée en écriture", async () => {
  const db = await referenceDatabase();
  try {
    for (const role of ["anon", "authenticated"]) {
      const fn = (await db.query(`SELECT has_function_privilege($1,'admin_sales(date,date)','EXECUTE') AS ok`, [role])).rows[0].ok;
      assert.equal(fn, false, `${role} admin_sales`);
      for (const privilege of ["SELECT", "INSERT"]) {
        const cache = (await db.query(`SELECT has_table_privilege($1,'admin_stats_cache',$2) AS ok`, [role, privilege])).rows[0].ok;
        assert.equal(cache, false, `${role} ${privilege} admin_stats_cache`);
      }
      for (const privilege of ["INSERT", "UPDATE", "DELETE"]) {
        const pv = (await db.query(`SELECT has_table_privilege($1,'page_views',$2) AS ok`, [role, privilege])).rows[0].ok;
        assert.equal(pv, false, `${role} ${privilege} page_views`);
      }
    }
    const fn = (await db.query(`SELECT to_regprocedure('update_page_view_duration(uuid,integer)') AS f`)).rows[0].f;
    assert.equal(fn, null);
  } finally { await db.close(); }
});
