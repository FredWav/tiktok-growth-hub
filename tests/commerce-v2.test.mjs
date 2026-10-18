import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { referenceDatabase } from "./reference-db.mjs";

const parisToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const monthStart = (offset = 0) => {
  const [y, m] = parisToday().split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return d.toISOString().slice(0, 10);
};
const consent = { version: "test", cgv: "CGV test", early: "Accès immédiat test", fingerprint: "fp" };
const academy = (db, email, expected = parisToday()) =>
  db.query(`SELECT commerce_academy_start($1) AS r`, [
    { first_name: "Test", email, expected_start: expected, early: true, fingerprint: "fp", consent },
  ]).then((r) => r.rows[0].r);
const propose = (db, offer, start, extra = {}) =>
  db.query(`SELECT * FROM commerce_create_order($1)`, [{
    offer, first_name: "Test", email: `${offer}@example.invalid`, start_date: start,
    start_time: "10:00", hold_until: new Date(Date.now() + 3 * 86400000).toISOString(), ...extra,
  }]).then((r) => r.rows[0]);

test("catalogue en base aligné sur src/config/offers.ts", async () => {
  const db = await referenceDatabase();
  try {
    const source = readFileSync(new URL("../src/config/offers.ts", import.meta.url), "utf8");
    const block = (id) => source.slice(source.indexOf(`  ${id}: {`), source.indexOf("\n  },", source.indexOf(`  ${id}: {`)));
    const rows = (await db.query(`SELECT * FROM commerce_offers ORDER BY id`)).rows;
    assert.deepEqual(rows.map((r) => r.id), ["academy", "one_shot", "premium"]);
    for (const row of rows) {
      const b = block(row.id);
      assert.match(b, new RegExp(`price: ${row.price_cents / 100},`), row.id);
      assert.match(b, new RegExp(`capacityPerMonth: ${row.monthly_capacity},`), row.id);
      assert.match(b, new RegExp(`purchase: "${row.purchase}"`), row.id);
      if (row.next_price_cents) assert.match(b, new RegExp(`nextPrice: ${row.next_price_cents / 100} `), row.id);
    }
    assert.match(source, /LAUNCH_END_LABEL = "31\/12\/2026"/);
    assert.equal(rows.find((r) => r.id === "academy").launch_until.toISOString?.().slice(0, 10) ?? rows[0].launch_until, "2026-12-31");
  } finally { await db.close(); }
});

test("Academy 2026-10 : accès à vie ; anciens droits de six mois intacts", async () => {
  const db = await referenceDatabase();
  try {
    const a = await propose(db, "academy", "2027-03-10");
    assert.equal(a.ends_at, null);
    assert.equal(a.amount_cents, 74900);
    const legacy = (await db.query(`INSERT INTO commerce_orders(offer,offer_version,email,first_name,amount_cents,start_date) VALUES('academy','2026-09-v3','old@example.invalid','Old',74900,'2026-05-01') RETURNING *`)).rows[0];
    assert.equal(new Date(legacy.ends_at).toISOString(), "2026-10-31T23:00:00.000Z");
    // Une mise à jour technique ne recalcule rien.
    await db.query(`UPDATE commerce_orders SET last_processed_at=now(), lock_until=null WHERE id=$1`, [legacy.id]);
    const after = (await db.query(`SELECT ends_at FROM commerce_orders WHERE id=$1`, [legacy.id])).rows[0];
    assert.equal(new Date(after.ends_at).toISOString(), "2026-10-31T23:00:00.000Z");
  } finally { await db.close(); }
});

test("Premium et One Shot : montant et durée libres", async () => {
  const db = await referenceDatabase();
  try {
    const p = await propose(db, "premium", "2027-03-10", { amount_cents: 279900, duration_weeks: 12 });
    assert.equal(p.amount_cents, 279900);
    assert.equal(p.duration_weeks, 12);
    assert.equal(new Date(p.ends_at).toISOString(), "2027-06-02T08:00:00.000Z");
    const d = await propose(db, "premium", "2027-04-10");
    assert.equal(d.amount_cents, 149900);
    assert.equal(d.duration_weeks, 6);
    const o = await propose(db, "one_shot", "2027-03-11");
    assert.equal(o.amount_cents, 39900);
    assert.equal(o.duration_weeks, null);
    await assert.rejects(() => propose(db, "premium", "2027-05-10", { amount_cents: 0 }));
  } finally { await db.close(); }
});

test("places : jamais plus de 2 Premium sur un mois, une demande ne consomme rien", async () => {
  const db = await referenceDatabase();
  try {
    await db.query(`SELECT commerce_submit_application($1)`, [{ request_id: crypto.randomUUID(), offer: "premium", first_name: "T", email: "t@example.invalid", account_or_project: "Projet", objective: "Objectif concret", timing: "", commitments: {}, fingerprint: "x" }]);
    await propose(db, "premium", "2027-03-02");
    const second = await propose(db, "premium", "2027-03-20");
    await assert.rejects(() => propose(db, "premium", "2027-03-25"), /Mois complet/);
    // Une réservation échue libère la place.
    await db.query(`UPDATE commerce_orders SET hold_until=now()-interval '1 minute' WHERE id=$1`, [second.id]);
    const third = await propose(db, "premium", "2027-03-25");
    // L'ancienne réservation ne peut plus être reprise : le mois est de nouveau complet.
    await assert.rejects(() => db.query(`SELECT commerce_hold($1, now()+interval '31 minutes')`, [second.id]), /Plus de place/);
    // La réservation en cours se prolonge sans difficulté.
    await db.query(`SELECT commerce_hold($1, now()+interval '31 minutes')`, [third.id]);
    // Fred peut ouvrir une place de plus sur ce mois.
    await db.query(`INSERT INTO commerce_capacity(offer,month,capacity) VALUES('premium','2027-03-01',3)`);
    await db.query(`SELECT commerce_hold($1, now()+interval '31 minutes')`, [second.id]);
  } finally { await db.close(); }
});

test("remboursement : la place est libérée", async () => {
  const db = await referenceDatabase();
  try {
    const a = await propose(db, "premium", "2027-03-02");
    await propose(db, "premium", "2027-03-03");
    await db.query(`SELECT commerce_accept($1,$2,true,$3)`, [a.token, a.start_date, { version: "t", cgv: "t", early: "t" }]);
    await db.query(`SELECT commerce_record_payment($1,'transfer','vir-1',149900,now())`, [a.id]);
    await db.query(`UPDATE commerce_orders SET hold_until=null WHERE id=$1`, [a.id]);
    await assert.rejects(() => propose(db, "premium", "2027-03-04"), /Mois complet/);
    await db.query(`SELECT commerce_record_payment($1,'refund','rbt-1',-149900,now())`, [a.id]);
    await propose(db, "premium", "2027-03-04");
  } finally { await db.close(); }
});

test("achat direct Academy : 5 places par mois, puis le mois suivant, reprise du double clic", async () => {
  const db = await referenceDatabase();
  try {
    const first = await academy(db, "a0@example.invalid");
    assert.equal(first.start_date, parisToday());
    assert.equal(first.amount_cents, 74900);
    const again = await academy(db, "a0@example.invalid");
    assert.equal(again.id, first.id);
    assert.equal(again.reused, true);
    for (let i = 1; i < 5; i++) await academy(db, `a${i}@example.invalid`);
    await assert.rejects(() => academy(db, "a5@example.invalid"), /La date de démarrage a changé/);
    const next = await academy(db, "a5@example.invalid", monthStart(1));
    assert.equal(next.start_date, monthStart(1));
    const places = (await db.query(`SELECT commerce_places() AS p`)).rows[0].p;
    assert.equal(places.academy.months[0].remaining, 0);
    assert.equal(places.academy.months[1].remaining, 4);
    assert.equal(places.premium.months[0].capacity, 2);
    assert.equal(places.one_shot.months[0].capacity, 10);
    const order = (await db.query(`SELECT * FROM commerce_orders WHERE id=$1`, [first.id])).rows[0];
    assert.equal(order.ends_at, null);
    assert.ok(order.consent_at);
    assert.equal(order.source, "direct");
  } finally { await db.close(); }
});

test("Academy : paiement reçu après la date prévue, accès ouvert sans replanification", async () => {
  const db = await referenceDatabase();
  try {
    const a = await propose(db, "academy", "2020-01-06");
    await db.query(`SELECT commerce_accept($1,$2,true,$3)`, [a.token, a.start_date, { version: "t", cgv: "t", early: "t" }]);
    await db.query(`SELECT commerce_record_payment($1,'stripe','cs_test_late',74900,now())`, [a.id]);
    assert.equal((await db.query(`SELECT status FROM commerce_orders WHERE id=$1`, [a.id])).rows[0].status, "scheduled");
    const p = await propose(db, "one_shot", "2020-01-06");
    await db.query(`SELECT commerce_accept($1,$2,true,$3)`, [p.token, p.start_date, { version: "t", cgv: "t", early: "t" }]);
    await db.query(`SELECT commerce_record_payment($1,'stripe','cs_test_late2',39900,now())`, [p.id]);
    assert.equal((await db.query(`SELECT status FROM commerce_orders WHERE id=$1`, [p.id])).rows[0].status, "needs_reschedule");
  } finally { await db.close(); }
});

test("droits : seul le compteur de places est public ; ancien élève passé à vie", async () => {
  const db = await referenceDatabase();
  try {
    for (const role of ["anon", "authenticated"]) {
      const allowed = async (fn) => (await db.query(`SELECT has_function_privilege($1,$2,'EXECUTE') AS ok`, [role, fn])).rows[0].ok;
      assert.equal(await allowed("commerce_places()"), true);
      for (const fn of ["commerce_academy_start(jsonb)", "commerce_hold(uuid,timestamptz)", "commerce_create_order(jsonb)", "commerce_grant_lifetime(text,uuid)", "commerce_month_taken(text,date,uuid)"]) {
        assert.equal(await allowed(fn), false, `${role} ${fn}`);
      }
    }
    await db.query(`INSERT INTO wavacademy_subscriptions(email,plan_type,access_months,access_expires_at,status) VALUES('Old@Example.invalid','acces',6,now()+interval '20 days','active')`);
    assert.equal((await db.query(`SELECT commerce_grant_lifetime('old@example.invalid', null) AS n`)).rows[0].n, 1);
    assert.equal((await db.query(`SELECT access_expires_at FROM wavacademy_subscriptions`)).rows[0].access_expires_at, null);
    await assert.rejects(() => db.query(`SELECT commerce_grant_lifetime('old@example.invalid', null)`));
  } finally { await db.close(); }
});
