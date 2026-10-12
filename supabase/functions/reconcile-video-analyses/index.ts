import { cronCaller, db, deliverMail, json, headers } from "../_shared/commerce.ts";
import { reconcileVideoAnalyses } from "../_shared/video-reconcile.ts";

// Déclenchement à la demande (support, test). Le passage régulier vient du cron Express.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (!cronCaller(req)) return json({ error: "Accès refusé" }, 403);
  try {
    const client = db();
    const summary = await reconcileVideoAnalyses(client);
    await deliverMail(client);
    return json(summary);
  } catch (e) {
    console.error("[video-analysis] reconcile failed", e);
    return json({ error: "Rattrapage à retenter" }, 500);
  }
});
