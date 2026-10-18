import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { db, enqueue, logUnmatchedPayment, OWNER_EMAIL } from "./commerce.ts";
import { OFFER_LABELS } from "./commerce-checkout.ts";

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
const parisDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

/**
 * Paiement d'un accompagnement (sessions créées par openCheckout, reconnues à
 * leur métadonnée commerce_order_id). Renvoie false pour une session d'un autre
 * produit. Un paiement rejoué est sans effet : la référence Stripe est unique.
 */
export async function commerceCheckout(
  _stripe: Stripe,
  session: Stripe.Checkout.Session,
  receivedAt: number,
) {
  const orderId = session.metadata?.commerce_order_id;
  if (!orderId) return false;
  const client = db();
  const { data: o, error: lookupError } = await client.from("commerce_orders")
    .select("*").eq("id", orderId).maybeSingle();
  if (lookupError) throw lookupError;

  if (session.payment_status !== "paid") {
    // Paiement différé (prélèvement, virement) : la place reste tenue le temps du règlement.
    if (o && session.status === "complete") {
      await client.rpc("commerce_hold", {
        p_order: o.id,
        p_until: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
    }
    return true;
  }
  const due = o ? o.amount_cents - o.amount_received : null;
  const reason = !o
    ? "Commande non rattachée"
    : session.metadata?.offer !== o.offer
    ? "Offre incorrecte"
    : session.mode !== "payment" || session.currency !== "eur" ||
        session.amount_total !== due
    ? "Montant, devise ou mode incorrect"
    : !o.consent_at
    ? "Consentement manquant"
    : !session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true"
    ? "Paiement test sans activation réelle"
    : null;
  const unmatched = (why: string) =>
    logUnmatchedPayment(client, {
      session_id: session.id,
      reason: why,
      amount_cents: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email,
      received_at: new Date(receivedAt * 1000).toISOString(),
    });
  if (reason || !o) {
    await unmatched(reason ?? "Commande non rattachée");
    await enqueue(
      client,
      `unmatched:${session.id}`,
      OWNER_EMAIL,
      "Paiement à rapprocher",
      `${session.id}\n${reason}\nAucun nouvel accès ouvert.`,
    );
    return true;
  }
  const { error } = await client.rpc("commerce_record_payment", {
    p_order: o.id,
    p_method: "stripe",
    p_reference: session.id,
    p_amount: session.amount_total,
    p_received: new Date(receivedAt * 1000).toISOString(),
  });
  if (error) {
    await unmatched(error.message);
    throw error;
  }
  const offer = OFFER_LABELS[o.offer] ?? o.offer;
  const next = o.offer === "academy"
    ? (o.start_date <= new Date().toISOString().slice(0, 10)
      ? "Tu reçois dans quelques minutes un second e-mail avec ton lien d'accès au Discord de la Wav Academy."
      : `Ton accès s'ouvre le ${parisDate(o.start_date)} : tu recevras ce jour-là ton lien d'accès au Discord.`)
    : `Rendez-vous convenu le ${parisDate(o.start_date)} à ${String(o.start_time).slice(0, 5)} (heure de Paris). Si le règlement est arrivé après cette date, Fred conviendra avec toi d'une nouvelle date.`;
  await enqueue(
    client,
    `paid:${session.id}`,
    o.email,
    `Paiement reçu · ${offer}`,
    `Bonjour ${o.first_name},\n\nTon paiement de ${euros(session.amount_total ?? 0)} TTC pour ${offer} est bien reçu.\n${next}\n\nRéférence de commande : ${o.id}\n\nFred Wav`,
  );
  await enqueue(
    client,
    `paid-owner:${session.id}`,
    OWNER_EMAIL,
    `Nouvelle vente · ${offer} · ${o.first_name}`,
    `${o.first_name} · ${o.email}\n${euros(session.amount_total ?? 0)} TTC (Stripe ${session.id})\nDémarrage : ${o.start_date}\nCommande ${o.id}`,
  );
  return true;
}
