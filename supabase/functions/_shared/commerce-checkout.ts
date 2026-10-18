import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import type { Database } from "./commerce.ts";

/**
 * Session Stripe Checkout d'une commande d'accompagnement (One Shot, Wav Academy,
 * Wav Premium). Le montant vient de la commande en base, jamais du navigateur.
 * Les moyens de paiement sont ceux activés dans Stripe (carte, Klarna, Scalapay,
 * PayPal) : aucun n'est imposé ici.
 */
export const OFFER_LABELS: Record<string, string> = {
  one_shot: "One Shot",
  academy: "Wav Academy",
  premium: "Wav Premium",
};

const DESCRIPTIONS: Record<string, string> = {
  one_shot: "Audit de ton compte et rendez-vous de 1 h 30 avec Fred",
  academy: "Accompagnement collectif, accès à vie tant que la Wav Academy existe",
  premium: "Accompagnement individuel avec Fred",
};

// Stripe exige au moins 30 minutes ; la place est tenue un peu plus longtemps.
const SESSION_MINUTES = 31;
const HOLD_MINUTES = 34;

export type CommerceOrder = {
  id: string;
  offer: string;
  email: string;
  amount_cents: number;
  amount_received: number;
  duration_weeks: number | null;
  checkout_session_id: string | null;
};

export function salesEnabled() {
  return Deno.env.get("COMMERCE_SALES_ENABLED") === "true";
}

export async function openCheckout(
  stripe: Stripe,
  client: Database,
  order: CommerceOrder,
  urls: { success: string; cancel: string },
): Promise<string> {
  const due = order.amount_cents - order.amount_received;
  if (due <= 0) throw new Error("Commande déjà réglée");

  // Double clic ou retour arrière : la session encore ouverte est reprise.
  if (order.checkout_session_id) {
    const previous = await stripe.checkout.sessions.retrieve(order.checkout_session_id)
      .catch(() => null);
    if (
      previous?.status === "open" && previous.url && previous.amount_total === due &&
      previous.expires_at * 1000 > Date.now() + 5 * 60_000
    ) return previous.url;
  }

  const { error: holdError } = await client.rpc("commerce_hold", {
    p_order: order.id,
    p_until: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
  });
  if (holdError) {
    throw new Error(
      holdError.hint === "capacity_full"
        ? "Il n’y a plus de place disponible pour ce mois. Contacte Fred pour choisir une autre date."
        : "Réservation impossible pour le moment. Actualise la page.",
    );
  }

  const name = OFFER_LABELS[order.offer] ?? "Accompagnement Fred Wav";
  const description = order.offer === "premium" && order.duration_weeks
    ? `${DESCRIPTIONS.premium}, ${order.duration_weeks} semaines`
    : DESCRIPTIONS[order.offer];
  const metadata = { commerce_order_id: order.id, offer: order.offer };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: due,
        // Prix TTC : la taxe éventuelle est comprise, jamais ajoutée au montant.
        tax_behavior: "inclusive",
        product_data: { name, description },
      },
    }],
    // Mêmes réglages que les liens de paiement des analyses : facture, adresse
    // de facturation, taxe automatique (désactivable par COMMERCE_AUTOMATIC_TAX=false).
    automatic_tax: { enabled: Deno.env.get("COMMERCE_AUTOMATIC_TAX") !== "false" },
    billing_address_collection: "required",
    customer_creation: "always",
    invoice_creation: { enabled: true, invoice_data: { description: `${name} · commande ${order.id}`, metadata } },
    client_reference_id: order.id,
    customer_email: order.email,
    metadata,
    payment_intent_data: { metadata, description: `${name} · commande ${order.id}` },
    expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
    success_url: urls.success,
    cancel_url: urls.cancel,
  });
  if (!session.url) throw new Error("Session de paiement indisponible");
  const { error } = await client.from("commerce_orders").update({
    checkout_session_id: session.id,
  }).eq("id", order.id);
  if (error) throw error;
  return session.url;
}
