import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { deliverMail } from "../_shared/commerce.ts";
import {
  buildHooksEmail,
  HOOKS_BUCKET,
  HOOKS_LINK_TTL_SECONDS,
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
 * Met en file l'email de livraison (liens signés + rappel de la renonciation, qui vaut
 * confirmation sur support durable). En cas d'échec on répond 500 : Stripe renvoie
 * l'événement, et la dedupe_key évite tout doublon d'email.
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
    const links: { label: string; url: string }[] = [];
    for (const file of pack.files) {
      const { data, error } = await supabase.storage.from(HOOKS_BUCKET)
        .createSignedUrl(file.path, HOOKS_LINK_TTL_SECONDS, { download: true });
      if (error || !data?.signedUrl) {
        throw new Error(`fichier ${HOOKS_BUCKET}/${file.path} : ${error ? getErrorMessage(error) : "introuvable"}`);
      }
      links.push({ label: file.label, url: data.signedUrl });
    }

    const consentAccepted = session.consent?.terms_of_service === "accepted";
    const { subject, html } = buildHooksEmail({
      pack,
      links,
      customerName: session.customer_details?.name,
      amountCents: session.amount_total,
      currency: session.currency,
      sessionId: session.id,
      paidAt: new Date(eventCreated * 1000),
      consentAccepted,
      siteUrl: Deno.env.get("SITE_URL") || "https://fredwav.com",
    });

    // Pas enqueue() : il ignore une file absente, et le client ne recevrait rien.
    const { data: queued, error: mailError } = await supabase.from("commerce_mail").upsert(
      { dedupe_key: `hooks:${session.id}`, recipient: email, subject, body: html },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    ).select("id");
    if (mailError) throw mailError;

    if (queued?.length) {
      if (!consentAccepted) {
        await safeNotifyError("Livraison hooks", `Renonciation absente • session=${session.id} • vérifier le Payment Link`);
      }
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
