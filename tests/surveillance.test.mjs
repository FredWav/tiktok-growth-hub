import test from "node:test";
import assert from "node:assert/strict";
import { referenceDatabase } from "./reference-db.mjs";

// Bouchon de pg_net : chaque requête reçoit un numéro, la réponse est écrite par le test.
const NET = `
CREATE SCHEMA net;
CREATE TABLE net._http_response(id bigint PRIMARY KEY, status_code integer, timed_out boolean, error_msg text);
CREATE SEQUENCE net.ids;
CREATE FUNCTION net.http_get(url text, timeout_milliseconds integer) RETURNS bigint
  LANGUAGE sql AS 'SELECT nextval(''net.ids'')';
`;

async function database() {
  const db = await referenceDatabase();
  await db.exec(NET);
  return db;
}

const mails = async (db) =>
  (await db.query(`SELECT subject, body FROM commerce_mail WHERE dedupe_key LIKE 'surveillance:%' ORDER BY created_at, subject`)).rows;
const state = async (db, cle) => (await db.query(`SELECT * FROM surveillance WHERE cle = $1`, [cle])).rows[0];

/** Un passage de la tâche des 5 minutes, la requête précédente ayant reçu `response`. */
async function tick(db, response) {
  const s = await state(db, "site");
  if (s.derniere_requete && response) {
    await db.query(`INSERT INTO net._http_response(id, status_code, timed_out, error_msg) VALUES ($1, $2, $3, $4)`,
      [s.derniere_requete, response.status ?? null, response.timedOut ?? false, response.error ?? null]);
  }
  await db.query(`SELECT surveillance_verifier()`);
}

test("site : alerte au 2e échec de suite, une seule fois, puis e-mail de retour", async () => {
  const db = await database();
  try {
    await tick(db); // première requête, rien à lire
    await tick(db, { status: 200 });
    await tick(db, { status: 502 });
    assert.equal((await mails(db)).length, 0, "un seul échec : pas d'alerte");
    await tick(db, { timedOut: true });
    await tick(db, { error: "Couldn't connect to server" });
    let sent = await mails(db);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, "Alerte : le site ne répond plus");
    assert.match(sent[0].body, /fredwav\.164-68-118-130\.sslip\.io/);
    assert.match(sent[0].body, /aucune réponse en 15 secondes/);
    assert.equal((await state(db, "site")).en_alerte, true);

    await tick(db, { status: 401 }); // site de test protégé : en ligne
    sent = await mails(db);
    assert.equal(sent.length, 2);
    assert.match(sent[1].subject, /^Site rétabli/);
    const s = await state(db, "site");
    assert.equal(s.en_alerte, false);
    assert.equal(s.echecs, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM commerce_mail WHERE recipient = 'contact@fredwav.com' AND dedupe_key LIKE 'surveillance:%'`)).rows[0].n, 2);
  } finally { await db.close(); }
});

test("site : une réponse pas encore arrivée ne compte pas comme une panne", async () => {
  const db = await database();
  try {
    await tick(db);
    await tick(db, { status: 503 });
    await tick(db); // pg_net en retard : aucune réponse pour la requête précédente
    await tick(db);
    assert.equal((await state(db, "site")).echecs, 1);
    assert.equal((await mails(db)).length, 0);
  } finally { await db.close(); }
});

test("sauvegarde : alerte après 26 h sans signal, une seule fois ; le signal du VPS la lève", async () => {
  const db = await database();
  try {
    await tick(db);
    assert.equal((await mails(db)).length, 0);
    await db.query(`UPDATE surveillance SET dernier_ok = now() - interval '27 hours' WHERE cle = 'sauvegarde'`);
    await tick(db);
    await tick(db);
    let sent = await mails(db);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, "Alerte : sauvegarde de la base manquante");

    // Le rôle du VPS peut envoyer le signal, mais rien écrire d'autre.
    await db.exec(`SET ROLE sauvegarde`);
    await db.query(`SELECT sauvegarde_signal('Sauvegarde fredwav-x.dump : 432K, 29 tables du site')`);
    await assert.rejects(db.query(`INSERT INTO commerce_mail(dedupe_key, recipient, subject, body) VALUES ('x','x','x','x')`));
    await assert.rejects(db.query(`SELECT surveillance_verifier()`));
    await db.exec(`RESET ROLE`);

    sent = await mails(db);
    assert.equal(sent.length, 2);
    assert.equal(sent[1].subject, "Sauvegarde de la base rétablie");
    assert.match(sent[1].body, /29 tables du site/);
    assert.equal((await state(db, "sauvegarde")).en_alerte, false);
  } finally { await db.close(); }
});

test("surveillance : fermée aux visiteurs et aux comptes connectés", async () => {
  const db = await database();
  try {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query(`SELECT * FROM surveillance`));
      await assert.rejects(db.query(`SELECT sauvegarde_signal('x')`));
      await assert.rejects(db.query(`SELECT surveillance_verifier()`));
      await db.exec(`RESET ROLE`);
    }
  } finally { await db.close(); }
});
