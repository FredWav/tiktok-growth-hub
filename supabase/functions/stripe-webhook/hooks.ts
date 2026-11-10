import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { deliverMail, logUnmatchedPayment } from "../_shared/commerce.ts";
import {
  buildHooksEmail,
  hasHooksConsent,
  HOOKS_CHECKOUT_CONSENT,
  HOOKS_CONSENT_VERSION,
  hooksPackFor,
  type HooksPack,
} from "../_shared/hooks-delivery.ts";
import { type CheckoutContext, getErrorMessage, jsonResponse, safeNotifyError, safeNotifySuccess } from "./context.ts";

/** Pack de hooks acheté, lu sur la metadata du Payment Link (recopiée sur la session). */
async function resolveHooksPack(stripe: Stripe, session: Stripe.Checkout.Session): Promise<HooksPack | null> {
  const direct = hooksPackFor(session.metadata);
  if (direct || !session.payment_link) return direct;
  // Filet de sécurité si la metadata n'a pas été recopiée : on relit le lien lui-même.
  try {
    const linkId = typeof session.payment_link === "string" ? session.payment_link : session.payment_link.id;
    const link = await stripe.paymentLinks.retrieve(linkId);
    return hooksPackFor(link.metadata);
  } catch (err) {
    console.error(`Payment Link lookup failed: session=${session.id}`, getErrorMessage(err));
    return null;
  }
}

/**
 * Archive l'accord de la session payée et envoie sa confirmation sur support durable.
 * Les fichiers sont remis par hooks-download, après l'envoi de cette confirmation.
 */
async function deliverHooksPack(
  supabase: any,
  session: Stripe.Checkout.Session,
  pack: HooksPack,
  eventCreated: number,
): Promise<Response> {
  if (session.payment_status !== "paid") {
    return jsonResponse({ received: true, product: pack.code, fulfilment: "awaiting_payment" });
  }
  if (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
    console.log(`Test hooks checkout without fulfilment: session=${session.id}`);
    return jsonResponse({ received: true, product: pack.code, fulfilment: "disabled_for_test" });
  }

  const email = session.customer_details?.email;
  try {
    if (!email) throw new Error("email client absent de la session");
    const mailKey = `hooks:${session.id}`;
    const { data: previous, error: previousError } = await supabase.from("commerce_mail")
      .select("state").eq("dedupe_key", mailKey).maybeSingle();
    if (previousError) throw previousError;
    if (previous?.state === "sent") {
      return jsonResponse({ received: true, product: pack.code, fulfilment: "already_sent" });
    }

    if (!hasHooksConsent(session)) {
      await logUnmatchedPayment(supabase, {
        session_id: session.id,
        reason: `hooks_consent_review:${pack.code}`,
        amount_cents: session.amount_total,
        currency: session.currency,
        email,
        received_at: new Date(eventCreated * 1000).toISOString(),
      });
      await safeNotifyError(
        "Livraison hooks suspendue",
        `Accord non vérifiable • ${pack.name} • ${email} • session=${session.id}. Vérifier le Checkout et traiter la commande.`,
      );
      return jsonResponse({ received: true, product: pack.code, fulfilment: "consent_review" });
    }

    const { error: orderError } = await supabase.from("hooks_orders").upsert({
      stripe_session_id: session.id,
      pack_code: pack.code,
      email,
      paid_at: new Date(eventCreated * 1000).toISOString(),
      consent_version: HOOKS_CONSENT_VERSION,
      checkout_consent_text: HOOKS_CHECKOUT_CONSENT,
    }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
    if (orderError) throw orderError;
    const { data: order, error: lookupError } = await supabase.from("hooks_orders")
      .select("access_token,paid_at").eq("stripe_session_id", session.id).single();
    if (lookupError) throw lookupError;

    const siteUrl = (Deno.env.get("SITE_URL") || "https://fredwav.com").replace(/\/$/, "");
    const accessUrl = `${siteUrl}/claim/hooks#${order.access_token}`;
    const { subject, html } = buildHooksEmail({
      pack,
      accessUrl,
      customerName: session.customer_details?.name,
      amountCents: session.amount_total,
      currency: session.currency,
      sessionId: session.id,
      paidAt: new Date(order.paid_at),
      siteUrl,
    });

    // Pas enqueue() : il ignore une file absente, et le client ne recevrait rien.
    const { data: queued, error: mailError } = await supabase.from("commerce_mail").upsert(
      { dedupe_key: mailKey, recipient: email, subject, body: html },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    ).select("id");
    if (mailError) throw mailError;

    if (queued?.length) {
      await safeNotifySuccess("Vente hooks", `${pack.name} • ${email} • session=${session.id}`);
    }
    // Envoi immédiat (sinon le mail attend le passage automatique de 5 min).
    try {
      await deliverMail(supabase as never);
    } catch (sendErr) {
      console.error(`Immediate hooks mail send failed: session=${session.id}`, getErrorMessage(sendErr));
    }
    return jsonResponse({ received: true, product: pack.code, fulfilment: "queued" });
  } catch (err) {
    const message = getErrorMessage(err);
    console.error(`Hooks delivery failed: session=${session.id}`, message);
    await safeNotifyError(
      "Livraison hooks",
      `Échec • ${pack.name} • ${email ?? "email inconnu"} • session=${session.id} • ${message}. Stripe renverra l'événement.`,
    );
    return jsonResponse({ error: "Hooks delivery failed" }, 500);
  }
}

/** Packs de hooks vendus par Payment Link. */
export async function handleHooksCheckout(ctx: CheckoutContext): Promise<Response | null> {
  const pack = await resolveHooksPack(ctx.stripe, ctx.session);
  if (!pack) return null;
  return await deliverHooksPack(ctx.supabase, ctx.session, pack, ctx.event.created);
}
