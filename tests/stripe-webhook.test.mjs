import test from "node:test";
import assert from "node:assert/strict";
import { routeCheckout } from "../supabase/functions/stripe-webhook/router.ts";
import { beginEvent, finishEvent } from "../supabase/functions/stripe-webhook/events.ts";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

function deps() {
  const calls = { unmatched: [], alerts: [] };
  return {
    calls,
    deps: {
      logUnmatched: async (ctx) => { calls.unmatched.push(ctx.session.id); },
      notifyError: async (title, message) => { calls.alerts.push(`${title} • ${message}`); },
      json,
      errorMessage: (e) => (e instanceof Error ? e.message : String(e)),
    },
  };
}

const ctx = (patch = {}) => ({ session: { id: "cs_test_1", payment_status: "paid", ...patch } });
const claims = (name) => async () => json({ received: true, product: name });
const ignores = async () => null;
const breaks = async () => { throw new Error("table indisponible"); };

test("routeur : le premier module qui reconnaît la session répond", async () => {
  const seen = [];
  const spy = (name, handler) => [name, async (c) => { seen.push(name); return handler(c); }];
  const { deps: d, calls } = deps();
  const res = await routeCheckout(ctx(), [spy("a", ignores), spy("b", claims("b")), spy("c", claims("c"))], d);
  assert.deepEqual(await res.json(), { received: true, product: "b" });
  assert.deepEqual(seen, ["a", "b"]);
  assert.deepEqual(calls.unmatched, []);
});

test("routeur : une panne d'un module n'empêche pas le suivant de traiter sa session", async () => {
  const { deps: d, calls } = deps();
  const res = await routeCheckout(ctx(), [["commerce", breaks], ["express", claims("express")]], d);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: true, product: "express" });
  assert.deepEqual(calls.unmatched, []);
});

test("routeur : panne sans repreneur → 500 pour que Stripe rejoue, rien « à rapprocher »", async () => {
  const { deps: d, calls } = deps();
  const res = await routeCheckout(ctx(), [["commerce", breaks], ["express", ignores]], d);
  assert.equal(res.status, 500);
  assert.match((await res.json()).failures[0], /commerce : table indisponible/);
  assert.deepEqual(calls.unmatched, []);
  assert.equal(calls.alerts.length, 1);
});

test("routeur : paiement reconnu par personne → consigné à rapprocher", async () => {
  const { deps: d, calls } = deps();
  const res = await routeCheckout(ctx(), [["a", ignores]], d);
  assert.deepEqual(await res.json(), { received: true });
  assert.deepEqual(calls.unmatched, ["cs_test_1"]);
  assert.match(calls.alerts[0], /Paiement à rapprocher : cs_test_1/);
});

test("routeur : session non payée et non reconnue → rien à rapprocher", async () => {
  const { deps: d, calls } = deps();
  await routeCheckout(ctx({ payment_status: "unpaid" }), [["a", ignores]], d);
  assert.deepEqual(calls.unmatched, []);
  assert.deepEqual(calls.alerts, []);
});

/** Client minimal imitant supabase-js sur une table stripe_events en mémoire. */
function fakeClient({ missing = false } = {}) {
  const rows = new Map();
  const result = (data, error = null) => ({ data, error });
  return {
    rows,
    from() {
      if (missing) {
        const err = { code: "PGRST205" };
        return { insert: async () => result(null, err), update: () => ({ eq: async () => result(null, err) }) };
      }
      return {
        insert: async (row) => {
          if (rows.has(row.id)) return result(null, { code: "23505" });
          rows.set(row.id, { attempts: 1, processed_at: null, ...row });
          return result(null);
        },
        select: () => ({ eq: (_c, id) => ({ single: async () => result(rows.get(id) ?? null) }) }),
        update: (patch) => ({ eq: async (_c, id) => { Object.assign(rows.get(id), patch); return result(null); } }),
      };
    },
  };
}

const event = { id: "evt_1", type: "checkout.session.completed", livemode: false };

test("événements : premier passage, puis doublon une fois traité avec succès", async () => {
  const client = fakeClient();
  assert.equal(await beginEvent(client, event), "new");
  await finishEvent(client, event.id, true, { status: 200 });
  assert.ok(client.rows.get("evt_1").processed_at);
  assert.equal(await beginEvent(client, event), "duplicate");
});

test("événements : un échec reste ouvert et le rejeu est retraité", async () => {
  const client = fakeClient();
  assert.equal(await beginEvent(client, event), "new");
  await finishEvent(client, event.id, false, { status: 500, error: "SMTP indisponible" });
  assert.equal(client.rows.get("evt_1").processed_at, null);
  assert.equal(client.rows.get("evt_1").last_error, "SMTP indisponible");
  assert.equal(await beginEvent(client, event), "retry");
  assert.equal(client.rows.get("evt_1").attempts, 2);
});

test("événements : sans table, le webhook traite quand même", async () => {
  const client = fakeClient({ missing: true });
  assert.equal(await beginEvent(client, event), "untracked");
  await finishEvent(client, event.id, true, {});
});
