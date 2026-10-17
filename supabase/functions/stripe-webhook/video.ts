import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { db, deliverMail, enqueue, logUnmatchedPayment } from "../_shared/commerce.ts";
import { checkoutMismatch } from "../_shared/checkout-validation.ts";
import { advanceVideo, watchVideo, type VideoRow } from "../_shared/video-analysis.ts";
import { type CheckoutContext, getErrorMessage, jsonResponse, safeNotifyError } from "./context.ts";

/**
 * Analyse Vidéo : le client_reference_id pointe vers video_analyses.
 * Renvoie null si la session ne concerne pas ce produit (les autres branches la traitent).
 * Une fois le paiement enregistré, on répond 200 même si le lancement échoue :
 * la commande porte son état, et le cron reconcile-express-analyses reprend la suite.
 */
async function handleVideoCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventCreated: number,
): Promise<Response | null> {
  const reference = session.client_reference_id;
  if (!reference || !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(reference)) return null;
  const client = db();
  const { data, error } = await client.from("video_analyses").select("*").eq("id", reference).maybeSingle();
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "42P01" || code === "PGRST205") return null; // Migration pas encore appliquée.
    // Une panne propre à la table vidéo ne doit jamais bloquer les autres produits
    // (Express, Academy) : on alerte et on laisse les branches suivantes traiter la session.
    // Si c'était une commande vidéo, elle finit dans les paiements à rapprocher.
    console.error(`[video-analysis] lookup failed: session=${session.id}`, getErrorMessage(error));
    await safeNotifyError("Analyse Vidéo Webhook", `Lecture video_analyses impossible • session=${session.id} • vérifier si ce paiement est une Analyse Vidéo`);
    return null;
  }
  if (!data) return null;
  const row = data as VideoRow;
  const tag = `[video-analysis] order=${row.id} session=${session.id}`;

  if (session.payment_status !== "paid") {
    console.log(`${tag} payment=${session.payment_status}`);
    return jsonResponse({ received: true, product: "video_analysis", fulfilment: "awaiting_payment" });
  }

  const reconcile = async (reason: string) => {
    await logUnmatchedPayment(client, {
      session_id: session.id, reason: `Vidéo : ${reason}`, amount_cents: session.amount_total,
      currency: session.currency, email: session.customer_details?.email,
      received_at: new Date(eventCreated * 1000).toISOString(),
    });
    await safeNotifyError("Analyse Vidéo Webhook", `${reason} • ${tag} • aucun lancement`);
    console.error(`${tag} reconciliation required: ${reason}`);
    return jsonResponse({ received: true, product: "video_analysis", reconciliation_required: true });
  };

  if ((row.checkout_mode === "live") !== session.livemode) return await reconcile("mode Stripe incohérent");
  if (row.stripe_session_id && row.stripe_session_id !== session.id) {
    return await reconcile("commande déjà rattachée à un autre paiement");
  }
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
  // Le produit Stripe fait foi (STRIPE_VIDEO_PRODUCT_ID_*) : le prix peut changer dans
  // Stripe sans toucher aux secrets. Un ID de tarif précis reste accepté s'il est configuré.
  const suffix = session.livemode ? "LIVE" : "TEST";
  const price = items.data[0]?.price;
  const productId = typeof price?.product === "string" ? price.product : price?.product?.id;
  const expectedProduct = Deno.env.get(`STRIPE_VIDEO_PRODUCT_ID_${suffix}`);
  const expectedPrice = Deno.env.get(`STRIPE_VIDEO_PRICE_ID_${suffix}`);
  const recognized = (!!expectedProduct && productId === expectedProduct) || (!!expectedPrice && price?.id === expectedPrice);
  const mismatch = checkoutMismatch(session, items.data, recognized ? price?.id : undefined, price?.unit_amount ?? -1);
  if (mismatch) return await reconcile(mismatch);

  const fulfil = session.livemode || Deno.env.get("ALLOW_TEST_FULFILLMENT") === "true";
  if (row.status === "awaiting_payment") {
    const { error: linkError } = await client.from("video_analyses")
      .update({
        stripe_session_id: session.id,
        paid_at: new Date(eventCreated * 1000).toISOString(),
        ...(fulfil ? { status: "paid" } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id).eq("status", "awaiting_payment")
      .or(`stripe_session_id.is.null,stripe_session_id.eq.${session.id}`);
    if (linkError) {
      console.error(`${tag} link failed`, getErrorMessage(linkError));
      return jsonResponse({ error: "Video order link failed" }, 500);
    }
    console.log(`${tag} payment linked`);
    const acceptedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "long", timeZone: "Europe/Paris" })
      .format(new Date((data as { accepted_at: string }).accepted_at));
    const consent = data as { cgv_version: string; cgv_accepted_text: string; immediate_delivery_notice_version: string; immediate_delivery_accepted_text: string };
    const siteUrl = Deno.env.get("SITE_URL") || "https://fredwav.com";
    await enqueue(client, `video-contract:${session.id}`, row.email, `Commande Analyse Vidéo confirmée — ${session.id}`, [
      "Confirmation de ta commande Analyse Vidéo TikTok",
      `Paiement confirmé : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format((session.amount_total ?? 0) / 100)}`,
      `Vidéo analysée : ${row.tiktok_url}`,
      "Ton rapport t'est envoyé par e-mail dès que l'analyse est terminée (quelques minutes en fonctionnement normal).",
      `Acceptés le : ${acceptedAt}`,
      `Version des CGV : ${consent.cgv_version}`, consent.cgv_accepted_text,
      `Version de l'information sur l'exécution immédiate : ${consent.immediate_delivery_notice_version}`, consent.immediate_delivery_accepted_text,
      `Référence : ${row.id} · Stripe : ${session.id}`,
      `CGV : ${siteUrl}/cgv`, `Rétractation : ${siteUrl}/retractation`,
    ].join("\n\n"));
  }
  if (!fulfil) {
    console.log(`${tag} test payment linked without fulfilment`);
    return jsonResponse({ received: true, product: "video_analysis", fulfilment: "disabled_for_test" });
  }

  try {
    const { data: fresh, error: readError } = await client.from("video_analyses").select("*").eq("id", row.id).single();
    if (readError) throw readError;
    const apiKey = Deno.env.get("WAVSTATS_API_KEY") || Deno.env.get("WAV_SOCIAL_SCAN_API_KEY") || "";
    const launched = await advanceVideo(client, fresh as VideoRow, apiKey);
    if (launched?.status === "processing") {
      // Suivi rapproché en arrière-plan : le rapport part dès la fin de l'analyse,
      // sans attendre le cron. La réponse à Stripe n'attend pas ce suivi.
      const watch = watchVideo(client, launched.id, apiKey, { onDelivered: () => deliverMail(client) })
        .catch((e) => console.error(`${tag} watch failed`, getErrorMessage(e)));
      // deno-lint-ignore no-explicit-any
      const rt = (globalThis as any).EdgeRuntime;
      if (rt?.waitUntil) rt.waitUntil(watch);
    }
  } catch (err) {
    // Paiement déjà enregistré : le cron reprendra, inutile de faire rejouer Stripe.
    console.error(`${tag} launch deferred`, getErrorMessage(err));
    await safeNotifyError("Analyse Vidéo Webhook", `Lancement différé au cron • ${tag} • ${getErrorMessage(err)}`);
  }
  return jsonResponse({ received: true, product: "video_analysis", linked: true });
}

export async function handleVideo(ctx: CheckoutContext): Promise<Response | null> {
  return await handleVideoCheckout(ctx.stripe, ctx.session, ctx.event.created);
}
