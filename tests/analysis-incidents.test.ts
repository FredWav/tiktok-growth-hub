import test from "node:test";
import assert from "node:assert/strict";
import { videoIncident } from "../src/lib/analysis-incidents.ts";

test("analyse vidéo : un e-mail de rapport en échec est à vérifier, pas « envoyé »", () => {
  const base = { created_at: "2026-10-19T20:00:00Z", paid_at: "2026-10-19T20:00:00Z", completed_at: "2026-10-19T20:01:00Z" };
  assert.equal(videoIncident({ ...base, status: "delivered", mail_state: "failed" }), "e-mail du rapport en échec");
  assert.equal(videoIncident({ ...base, status: "delivered", mail_state: "sent" }), null);
  assert.equal(videoIncident({ ...base, status: "delivered", mail_state: "pending" }), null);
});
