import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import {
  CGV_TEXT,
  db,
  earlyText,
  email,
  fingerprint,
  headers,
  json,
  site,
  text,
  VERSION,
} from "../_shared/commerce.ts";
import { openCheckout, salesEnabled } from "../_shared/commerce-checkout.ts";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";

/**
 * Achat direct de la Wav Academy : réserve une place sur le premier mois disponible
 * (consentements enregistrés avant la redirection), puis ouvre le paiement Stripe.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    if (!salesEnabled()) {
      return json({ error: "Les inscriptions sont momentanément fermées. Écris à contact@fredwav.com.", code: "sales_closed" }, 503);
    }
    const b = await req.json();
    if (b.website) return json({ error: "Demande non acceptée" }, 400);
    if (b.consent_cgv !== true || b.early_start !== true) {
      return json({ error: "Coche les deux cases pour continuer." }, 422);
    }
    const start = text(b.expected_start, 10, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error("Date invalide");
    const client = db();
    const values = {
      first_name: text(b.first_name, 1, 100),
      email: email(b.email),
      expected_start: start,
      early: true,
      fingerprint: await fingerprint(req),
    };
    const { data: started, error } = await client.rpc("commerce_academy_start", {
      v: {
        ...values,
        consent: {
          version: VERSION,
          cgv: CGV_TEXT,
          early: earlyText("academy"),
          start_date: start,
          fingerprint: values.fingerprint,
          accepted_at: new Date().toISOString(),
        },
      },
    });
    if (error) {
      if (error.hint === "capacity_full") {
        return json({ error: "La Wav Academy est complète pour les trois prochains mois.", code: "capacity_full" }, 409);
      }
      if (error.hint === "start_changed") {
        return json({ error: "La date de démarrage vient de changer (une place a été prise). Actualise la page pour voir la nouvelle date.", code: "start_changed" }, 409);
      }
      console.error("[academy-checkout]", error);
      return json({ error: /Trop de tentatives/.test(error.message) ? error.message : "Inscription impossible pour le moment. Réessaie dans un instant." }, 400);
    }
    const { data: order, error: orderError } = await client.from("commerce_orders")
      .select("*").eq("id", started.id).single();
    if (orderError) throw orderError;
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const url = await openCheckout(stripe, client, order, {
      success: `${site()}/wavacademy/merci?commande=${order.id}`,
      cancel: `${site()}/wavacademy/inscription`,
    });
    return json({ url, start_date: order.start_date, amount_cents: order.amount_cents });
  } catch (error) {
    console.error("[academy-checkout]", error);
    // Type d'erreur Stripe (sans détail) : distingue une clé mal autorisée d'une panne.
    const stripeType = (error as { type?: string } | null)?.type;
    return json({
      error: error instanceof Error && /place|Champ|Email|Date/.test(error.message) ? error.message : "Paiement momentanément indisponible. Réessaie dans un instant.",
      ...(stripeType?.startsWith("Stripe") ? { code: stripeType } : {}),
    }, 400);
  }
});
