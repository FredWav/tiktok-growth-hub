import Stripe from "https://esm.sh/stripe@18.5.0";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { db, headers, json } from "../_shared/commerce.ts";
import { pollExpress, type ExpressRow } from "../_shared/express-finalize.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" },405);
  try {
    const { session_id } = await req.json();
    if (typeof session_id !== "string" || !/^cs_(live|test)_[a-zA-Z0-9]+$/.test(session_id)) return json({ error: "Référence invalide" },400);
    const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" || (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true")) return json({ error: "Paiement non confirmé" },403);
    const { data, error } = await db().from("express_analyses").select("*").eq("stripe_session_id",session.id).maybeSingle();
    if (error) throw error;
    if (!data) return json({ status: "starting" });
    // No browser-provided job id is read. The paid order owns the only authorized job.
    return json(await pollExpress(data as ExpressRow));
  } catch (e) { console.error(e); return json({ error: "Consultation temporairement indisponible. Réessaie sans repayer." },500); }
});
