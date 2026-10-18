import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import {
  CGV_TEXT,
  db,
  earlyText,
  headers,
  json,
  site,
  uuid,
  VERSION,
} from "../_shared/commerce.ts";
import { openCheckout, salesEnabled } from "../_shared/commerce-checkout.ts";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";

/**
 * Lien personnel /inscription/:token, envoyé par Fred après une demande
 * (One Shot, Wav Premium, ou Wav Academy réglée hors ligne) : récapitulatif,
 * acceptation des modalités, puis paiement Stripe ou virement.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const b = await req.json(), client = db();
    const unavailable =
      "Ce lien d’inscription n’est pas valide ou n’est plus actif. Vérifie que tu as copié le lien complet reçu par email, ou contacte Fred pour en recevoir un nouveau.";
    let token: string;
    try {
      token = uuid(b?.token);
    } catch {
      return json({ error: unavailable, code: "invalid_link" }, 404);
    }
    const { data: o, error } = await client.from("commerce_orders").select("*")
      .eq("token", token).maybeSingle();
    if (error) throw error;
    if (!o || ["cancelled", "expired"].includes(o.status)) {
      return json({ error: unavailable, code: "invalid_link" }, 404);
    }
    if (b.action === "accept") {
      if (b.expected_starts_at !== o.starts_at) throw new Error("La date ou l’heure a changé. Actualise la page avant d’accepter.");
      if (o.status === "needs_reschedule") {
        throw new Error("La date doit être reconvenue avec Fred.");
      }
      if (b.consent_cgv !== true) {
        throw new Error("Accepte les CGV pour confirmer.");
      }
      if (
        new Date(o.starts_at).getTime() < Date.now() + 14 * 86400000 &&
        b.early_start !== true
      ) {
        throw new Error(
          "Demande un démarrage anticipé ou conviens avec Fred d'une date après 14 jours.",
        );
      }
      const { error: acceptError } = await client.rpc("commerce_accept", {
        p_token: o.token,
        p_start: o.start_date,
        p_early: b.early_start === true,
        p_consent: {
          version: VERSION,
          cgv: CGV_TEXT,
          early: b.early_start === true ? earlyText(o.offer) : null,
          start_date: o.start_date,
          starts_at: o.starts_at,
        },
      });
      if (acceptError) {
        throw new Error(
          "Modalités non confirmées. Actualise la page ou contacte Fred pour replanifier.",
        );
      }
    }
    const { data: current, error: currentError } = await client.from("commerce_orders")
      .select("*").eq("id", o.id).single();
    if (currentError) throw currentError;
    const canPay = salesEnabled() && !!current.consent_at &&
      current.amount_received < current.amount_cents &&
      current.status !== "needs_reschedule";
    if (b.action === "checkout") {
      if (!canPay) throw new Error("Le paiement en ligne n’est pas disponible pour cette inscription. Contacte Fred.");
      const stripe = new Stripe(getStripeSecretKey(), {
        apiVersion: "2025-08-27.basil",
        httpClient: Stripe.createFetchHttpClient(),
      });
      const url = await openCheckout(stripe, client, current, {
        success: `${site()}/inscription/${current.token}?paiement=ok`,
        cancel: `${site()}/inscription/${current.token}`,
      });
      return json({ url });
    }
    return json({
      offer: current.offer,
      first_name: current.first_name,
      amount_cents: current.amount_cents,
      amount_received: current.amount_received,
      start_date: current.start_date,
      start_time: current.start_time,
      starts_at: current.starts_at,
      ends_at: current.ends_at,
      duration_weeks: current.duration_weeks,
      hold_until: current.hold_until,
      sales_enabled: salesEnabled(),
      status: current.status,
      accepted: !!current.consent_at,
      cgv_text: CGV_TEXT,
      early_text: earlyText(current.offer),
      can_pay: canPay,
      transfer_instructions: canPay
        ? (Deno.env.get("COMMERCE_TRANSFER_INSTRUCTIONS") ||
          "Fred te transmet le RIB et la facture directement. Indique la référence de commande avec ton virement.")
        : null,
      reference: current.id,
    });
  } catch (error) {
    return json({
      error: error instanceof Error
        ? error.message
        : "Inscription indisponible",
    }, 400);
  }
});
