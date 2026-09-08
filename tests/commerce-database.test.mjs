import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Premium : horaire Paris conservé, changement d'heure et consentement périmé", async () => {
  const db = await database();
  try {
    const o = (await db.query(`INSERT INTO commerce_orders(offer,email,first_name,amount_cents,start_date,start_time) VALUES('premium','test@example.invalid','Test',199000,'2027-10-15','10:30') RETURNING *`)).rows[0];
    assert.equal(new Date(o.starts_at).toISOString(), "2027-10-15T08:30:00.000Z");
    assert.equal(new Date(o.ends_at).toISOString(), "2027-11-14T09:30:00.000Z");
    await accept(db,o);
    await db.query(`UPDATE commerce_orders SET start_time='11:30' WHERE id=$1`,[o.id]);
    assert.equal((await db.query(`SELECT consent_at FROM commerce_orders WHERE id=$1`,[o.id])).rows[0].consent_at,null);
    await assert.rejects(()=>db.query(`SELECT commerce_accept($1,$2,true,$3)`,[o.token,o.start_date,{starts_at:o.starts_at}]));
  } finally { await db.close(); }
});

test("RPC internes interdits au public et verrou d'activation respecte l'encaissement", async () => {
  const db = await database();
  try {
    for (const role of ["anon","authenticated"]) {
      const result = (await db.query(`SELECT has_function_privilege($1,'commerce_record_payment(uuid,text,text,integer,timestamptz,uuid)','EXECUTE') AS allowed`,[role])).rows[0];
      assert.equal(result.allowed,false);
    }
    const o = await order(db);
    await db.query(`UPDATE commerce_orders SET lock_until=now()+interval '2 minutes' WHERE id=$1`,[o.id]);
    await assert.rejects(()=>pay(db,o));
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM commerce_receipts`)).rows[0].n,0);
  } finally { await db.close(); }
});

test("échec d'enregistrement de la notification : aucune fausse candidature réussie", async () => {
  const db = await database();
  try {
    await db.exec(`CREATE FUNCTION test_mail_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Simulated outbox failure'; END $$; CREATE TRIGGER test_mail_failure BEFORE INSERT ON commerce_mail FOR EACH ROW EXECUTE FUNCTION test_mail_failure();`);
    const v={request_id:crypto.randomUUID(),offer:"premium",first_name:"Test",email:"test@example.invalid",account_or_project:"Projet test",objective:"Objectif concret à tester",timing:"",commitments:{},fingerprint:"test"};
    await assert.rejects(()=>db.query(`SELECT commerce_submit_application($1)`,[v]));
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM commerce_applications`)).rows[0].n,0);
    await db.exec(`DROP TRIGGER test_mail_failure ON commerce_mail`);
    await db.query(`SELECT commerce_submit_application($1)`,[v]);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM commerce_applications`)).rows[0].n,1);
  } finally { await db.close(); }
});

async function database() {
  const db = new PGlite();
  await db.exec(
    `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT null::uuid';
    CREATE TABLE user_roles(user_id uuid,role text);
    CREATE TABLE wavacademy_subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,status text,access_expires_at timestamptz);
    CREATE TABLE express_analyses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),status text,email text,tiktok_username text,stripe_session_id text);
  `,
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20260908120000_commerce_v3.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  return db;
}
async function order(db, start = "2027-08-31") {
  return (await db.query(
    `INSERT INTO commerce_orders(offer,email,first_name,amount_cents,start_date) VALUES('academy','test@example.invalid','Test',74900,$1) RETURNING *`,
    [start],
  )).rows[0];
}
async function accept(db, o) {
  await db.query(`SELECT commerce_accept($1,$2,true,$3)`, [
    o.token,
    o.start_date,
    { version: "test", cgv: "CGV test", early: "Demande expresse test" },
  ]);
}
async function pay(
  db,
  o,
  amount = 74900,
  reference = "virement-test",
  date = new Date(),
) {
  await db.query(`SELECT commerce_record_payment($1,'transfer',$2,$3,$4)`, [
    o.id,
    reference,
    amount,
    date,
  ]);
}

test("migration, Paris fin de mois et six anniversaires depuis la date initiale", async () => {
  const db = await database();
  try {
    const o = await order(db);
    assert.equal(
      new Date(o.starts_at).toISOString(),
      "2027-08-30T22:00:00.000Z",
    );
    assert.equal(new Date(o.ends_at).toISOString(), "2028-02-28T23:00:00.000Z");
    const days = (await db.query(
      `SELECT (($1::date + make_interval(months=>m))::date)::text AS day FROM generate_series(0,5) m`,
      ["2027-08-31"],
    )).rows.map((r) => r.day);
    assert.deepEqual(days, [
      "2027-08-31",
      "2027-09-30",
      "2027-10-31",
      "2027-11-30",
      "2027-12-31",
      "2028-01-31",
    ]);
  } finally {
    await db.close();
  }
});
test("paiement anticipé et consentement : programmé, jamais actif", async () => {
  const db = await database();
  try {
    const o = await order(db);
    await pay(db, o);
    await accept(db, o);
    const saved =
      (await db.query("SELECT * FROM commerce_orders WHERE id=$1", [o.id]))
        .rows[0];
    assert.equal(saved.status, "scheduled");
    assert.equal(saved.amount_received, 74900);
    await pay(db, o);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM commerce_receipts"))
        .rows[0].n,
      1,
    );
    await assert.rejects(() => pay(db, o, 100, "virement-test"));
    await assert.rejects(() => pay(db, o, 100, "autre"));
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM commerce_mail")).rows[0]
        .n,
      1,
    );
  } finally {
    await db.close();
  }
});
test("paiement tardif exige replanification puis nouveau consentement", async () => {
  const db = await database();
  try {
    const o = await order(db, "2020-01-06");
    await accept(db, o);
    await pay(db, o);
    assert.equal(
      (await db.query("SELECT status FROM commerce_orders")).rows[0].status,
      "needs_reschedule",
    );
    await db.query(
      `UPDATE commerce_orders SET start_date='2027-10-06' WHERE id=$1`,
      [o.id],
    );
    const changed = (await db.query("SELECT * FROM commerce_orders")).rows[0];
    assert.equal(changed.consent_at, null);
    assert.equal(changed.status, "pending");
    await accept(db, changed);
    assert.equal(
      (await db.query("SELECT status FROM commerce_orders")).rows[0].status,
      "scheduled",
    );
  } finally {
    await db.close();
  }
});
test("virement partiel, solde, remboursement et protection contre réutilisation", async () => {
  const db = await database();
  try {
    const o = await order(db);
    await accept(db, o);
    await pay(db, o, 10000, "partiel");
    await pay(db, o, 64900, "solde");
    await db.query(
      `SELECT commerce_record_payment($1,'refund','remboursement',-74900,now())`,
      [o.id],
    );
    const saved =
      (await db.query("SELECT amount_received,status FROM commerce_orders"))
        .rows[0];
    assert.deepEqual(saved, { amount_received: 0, status: "cancelled" });
    await assert.rejects(() => pay(db, o, 74900, "nouveau"));
    await assert.rejects(() =>
      db.query(
        `SELECT commerce_record_payment($1,'refund','excessif',-1,now())`,
        [o.id],
      )
    );
  } finally {
    await db.close();
  }
});
test("demande et e-mails atomiques : retry sans double candidature ni notification", async () => {
  const db = await database();
  try {
    const v = {
      request_id: crypto.randomUUID(),
      offer: "academy",
      first_name: "Test",
      email: "test@example.invalid",
      account_or_project: "Projet débutant",
      objective: "Je veux lancer mon compte",
      timing: "dans six mois",
      commitments: { price: true, practice: true, commercial_call: true },
      fingerprint: "fake-ip",
    };
    const a =
      (await db.query("SELECT commerce_submit_application($1) AS id", [v]))
        .rows[0].id;
    const b =
      (await db.query("SELECT commerce_submit_application($1) AS id", [v]))
        .rows[0].id;
    assert.equal(a, b);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM commerce_mail")).rows[0]
        .n,
      2,
    );
    for (let i = 0; i < 4; i++) {
      await db.query("SELECT commerce_submit_application($1)", [{
        ...v,
        request_id: crypto.randomUUID(),
      }]);
    }
    await assert.rejects(() =>
      db.query("SELECT commerce_submit_application($1)", [{
        ...v,
        request_id: crypto.randomUUID(),
      }])
    );
  } finally {
    await db.close();
  }
});
test("finalisation répétée : un résultat et une seule notification en attente", async () => {
  const db = await database();
  try {
    const { rows: [o] } = await db.query(
      `INSERT INTO express_analyses(status,email,tiktok_username,stripe_session_id) VALUES('processing','test@example.invalid','test','cs_test_fake') RETURNING id`,
    );
    await db.query(
      `UPDATE express_analyses SET status='complete' WHERE id=$1`,
      [o.id],
    );
    await db.query(
      `UPDATE express_analyses SET status='complete' WHERE id=$1`,
      [o.id],
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM commerce_mail")).rows[0]
        .n,
      1,
    );
  } finally {
    await db.close();
  }
});
