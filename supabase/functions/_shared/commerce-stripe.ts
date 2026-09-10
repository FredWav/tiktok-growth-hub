import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { db, enqueue, logUnmatchedPayment } from "./commerce.ts";

export async function commerceCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  receivedAt: number,
) {
  const client = db();
  const reference = session.client_reference_id;
  const link = typeof session.payment_link === "string"
    ? session.payment_link
    : session.payment_link?.id;
  const academyLink = Deno.env.get("COMMERCE_ACADEMY_PAYMENT_LINK_ID");
  const premiumLink = Deno.env.get("COMMERCE_PREMIUM_PAYMENT_LINK_ID");
  const knownLink = !!link && (link === academyLink || link === premiumLink);
  const isUuid = reference && /^[a-f\d-]{36}$/i.test(reference);
  const lookup = isUuid
    ? await client.from("commerce_orders").select("*").eq("id", reference)
      .maybeSingle()
    : { data: null, error: null };
  // Tant que le socle commerce v3 n'est pas déployé en base, la table est absente :
  // on laisse alors la branche historique (Analyse Express) traiter la session.
  if (lookup.error) {
    const code = (lookup.error as { code?: string }).code;
    // 42P01 (Postgres) et PGRST205 (cache de schéma PostgREST) = table absente.
    if (code === "42P01" || code === "PGRST205") return false;
    throw lookup.error;
  }

  const o = lookup.data;
  if (!knownLink && !o) return false; // Historical checkout handled by the existing branch.
  if (session.payment_status !== "paid") return true;
  const expectedLink = o?.offer === "academy" ? academyLink : premiumLink;
  let reason = !o
    ? "Commande non rattachée"
    : !knownLink || link !== expectedLink
    ? "Lien produit incorrect"
    : session.mode !== "payment" || session.currency !== "eur" ||
        session.amount_total !== o.amount_cents
    ? "Montant, devise ou mode incorrect"
    : !o.consent_at
    ? "Consentement manquant"
    : !session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true"
    ? "Paiement test sans activation réelle"
    : null;
  if (!reason && o) {
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 2,
    });
    const priceId = Deno.env.get(
      o.offer === "academy"
        ? "COMMERCE_ACADEMY_PRICE_ID"
        : "COMMERCE_PREMIUM_PRICE_ID",
    );
    if (
      !priceId || items.data.length !== 1 ||
      items.data[0].price?.id !== priceId || items.data[0].quantity !== 1
    ) reason = "Prix Stripe non reconnu";
  }
  if (reason) {
    await logUnmatchedPayment(client, {
      session_id: session.id,
      reason,
      amount_cents: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email,
      received_at: new Date(receivedAt * 1000).toISOString(),
    });
    await enqueue(
      client,
      `unmatched:${session.id}`,
      "contact@fredwav.com",
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
    await logUnmatchedPayment(client, {
      session_id: session.id,
      reason: error.message,
      amount_cents: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email,
      received_at: new Date(receivedAt * 1000).toISOString(),
    });
    throw error;
  }
  await enqueue(
    client,
    `paid:${session.id}`,
    o.email,
    "Paiement reçu",
    `Commande ${o.id}\n${
      o.amount_cents / 100
    } € TTC reçus.\nDate convenue : ${o.start_date}.\nLes accès seront ouverts à cette date. Si le règlement est arrivé après celle-ci, Fred conviendra avec toi d'une nouvelle date.`,
  );
  return true;
}
