import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { db, enqueue, logUnmatchedPayment } from "../_shared/commerce.ts";
import { getStripePricesForMode } from "../_shared/stripe-config.ts";
import { checkoutMismatch } from "../_shared/checkout-validation.ts";
import { type CheckoutContext, getErrorMessage, jsonResponse, safeNotifyError } from "./context.ts";

type ExpressConsentConfirmation = {
  email: string;
  tiktok_username: string;
  cgv_version: string;
  immediate_delivery_notice_version: string;
  cgv_accepted_text: string;
  immediate_delivery_accepted_text: string;
  accepted_at: string;
};

async function sendExpressOrderConfirmation(
  consent: ExpressConsentConfirmation,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const siteUrl = Deno.env.get("SITE_URL") || "https://fredwav.com";
  const acceptedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(consent.accepted_at));
  const amount = typeof session.amount_total === "number"
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: (session.currency || "eur").toUpperCase(),
      }).format(session.amount_total / 100)
    : "montant indiqué sur votre reçu Stripe";

  const text = [
    "Confirmation de votre commande Analyse Express",
    `Paiement confirmé : ${amount}`,
    `Compte analysé : @${consent.tiktok_username}`,
    `Acceptés le : ${acceptedAt}`,
    `Version des CGV : ${consent.cgv_version}`,
    consent.cgv_accepted_text,
    `Version de l'information sur l'exécution immédiate : ${consent.immediate_delivery_notice_version}`,
    consent.immediate_delivery_accepted_text,
    `Référence Stripe : ${session.id}`,
    `CGV : ${siteUrl}/cgv`,
    `Rétractation : ${siteUrl}/retractation`,
  ].join("\n\n");

  await enqueue(db(), `express-contract:${session.id}`, consent.email,
    // La référence Stripe reste dans le texte (rétractation, support), pas dans l'objet.
    "Commande Analyse Express confirmée", text);
}

function getExpectedExpressPriceId(livemode: boolean): string {
  const mode = livemode ? "live" : "test";
  return Deno.env.get(livemode ? "STRIPE_EXPRESS_PRICE_ID_LIVE" : "STRIPE_EXPRESS_PRICE_ID_TEST") ||
    getStripePricesForMode(mode).analyse_express;
}

async function triggerExpressAnalysis(sessionId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const response = await fetch(`${supabaseUrl}/functions/v1/express-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok || response.status === 202) {
    const detail = (await response.text()).slice(0, 1_000);
    throw new Error(`Lancement du rapport impossible (${response.status}) : ${detail}`);
  }
}

/**
 * Analyse Express : le client_reference_id pointe vers express_analyses.
 * On rattache la preuve de consentement à la session même si le client
 * ferme la page avant le retour navigateur vers /analyse-express/result.
 */
export async function handleExpressCheckout(ctx: CheckoutContext): Promise<Response | null> {
  const { stripe, supabase, session, event } = ctx;
  if (session.client_reference_id) {
    const { data: expressConsent, error: expressLookupError } = await supabase
      .from("express_purchase_consents")
      .select("id, email, tiktok_username, cgv_version, immediate_delivery_notice_version, cgv_accepted_text, immediate_delivery_accepted_text, accepted_at, confirmation_sent_at, checkout_mode")
      .eq("express_analysis_id", session.client_reference_id)
      .maybeSingle();

    if (expressLookupError) {
      console.error("Express consent lookup failed:", expressLookupError);
      await safeNotifyError(
        "Analyse Express Webhook",
        `Échec lecture consentement • session=${session.id}`,
      );
      return jsonResponse({ error: "Express consent lookup failed" }, 500);
    }

    if (expressConsent) {
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
      const expectedPrice = getExpectedExpressPriceId(session.livemode);
      const mismatch = checkoutMismatch(session, items.data, expectedPrice, 1990);
      if (mismatch) {
        if (session.payment_status === "paid") {
          await logUnmatchedPayment(supabase, { session_id: session.id, reason: `Express : ${mismatch}`, amount_cents: session.amount_total, currency: session.currency, email: session.customer_details?.email, received_at: new Date(event.created * 1000).toISOString() });
        }
        await safeNotifyError("Analyse Express Webhook", `${mismatch} • ${session.id} • aucun rapport rattaché`);
        return jsonResponse({ received: true, reconciliation_required: true });
      }
      const checkoutIsTest = expressConsent.checkout_mode === "test";
      if (checkoutIsTest === event.livemode) {
        await safeNotifyError(
          "Analyse Express Webhook",
          `Incohérence mode consentement/Stripe • session=${session.id}`,
        );
        return jsonResponse({ error: "Express checkout mode mismatch" }, 500);
      }

      const linkedAt = new Date().toISOString();
      const { data: consentLinked, error: consentUpdateError } = await supabase
        .from("express_purchase_consents")
        .update({
          stripe_session_id: session.id,
          stripe_payment_status: session.payment_status,
          stripe_linked_at: linkedAt,
        })
        .eq("id", expressConsent.id)
        .or(`stripe_session_id.is.null,stripe_session_id.eq.${session.id}`).select("id").maybeSingle();

      if (consentUpdateError || !consentLinked) {
        console.error("Express consent Stripe link failed:", consentUpdateError);
        await safeNotifyError(
          "Analyse Express Webhook",
          `Échec liaison consentement/Stripe • session=${session.id}`,
        );
        return jsonResponse({ error: "Express consent link failed" }, 500);
      }

      // Ne marque l'analyse comme payée que lorsque Stripe le confirme.
      // express-analysis conserve sa propre vérification avant de lancer le rapport.
      if (session.payment_status === "paid") {
        const { data: analysisLinked, error: analysisUpdateError } = await supabase
          .from("express_analyses")
          .update({ stripe_session_id: session.id })
          .eq("id", session.client_reference_id)
          .or(`stripe_session_id.is.null,stripe_session_id.eq.${session.id}`).select("id").maybeSingle();

        if (analysisUpdateError || !analysisLinked) {
          console.error("Express analysis Stripe link failed:", analysisUpdateError);
          await safeNotifyError(
            "Analyse Express Webhook",
            `Échec liaison analyse/Stripe • session=${session.id}`,
          );
          return jsonResponse({ error: "Express analysis link failed" }, 500);
        }

        if (checkoutIsTest && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
          console.log(`Test Analyse Express linked without fulfilment: session=${session.id}`);
          return jsonResponse({
            received: true,
            linked: true,
            product: "analyse_express",
            fulfilment: "disabled_for_test",
          });
        }

        // Durable queue: SMTP downtime must not prevent a paid analysis from starting.
        // The historical sent marker avoids re-mailing already confirmed orders.
        if (!expressConsent.confirmation_sent_at) {
          await sendExpressOrderConfirmation(expressConsent as ExpressConsentConfirmation, session);
        }

        try {
          // Le rapport et la séquence opt-in doivent démarrer même si le
          // client ferme Stripe sans revenir sur la page résultat.
          await triggerExpressAnalysis(session.id);
        } catch (analysisTriggerError) {
          const message = getErrorMessage(analysisTriggerError);
          await safeNotifyError(
            "Analyse Express Webhook",
            `Échec lancement rapport • session=${session.id} • ${message}`,
          );
          return jsonResponse({ error: "Express analysis trigger failed" }, 500);
        }
      }

      console.log(
        `Analyse Express consent linked: analysis=${session.client_reference_id}, session=${session.id}, payment=${session.payment_status}`,
      );
      return jsonResponse({ received: true, linked: true, product: "analyse_express" });
    }
  }
  return null;
}
