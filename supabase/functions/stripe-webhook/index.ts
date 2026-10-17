import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logUnmatchedPayment } from "../_shared/commerce.ts";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { commerceCheckout } from "../_shared/commerce-stripe.ts";
import { type CheckoutContext, corsHeaders, getErrorMessage, jsonResponse, safeNotifyError } from "./context.ts";
import { beginEvent, finishEvent } from "./events.ts";
import { type NamedHandler, routeCheckout } from "./router.ts";
import { handleHooksCheckout } from "./hooks.ts";
import { handleVideo } from "./video.ts";
import { handleExpressCheckout } from "./express.ts";
import { handleLegacyAcademyCheckout, handleSubscriptionDeleted } from "./academy-legacy.ts";

/**
 * Webhook Stripe : vérifie la signature, écarte les événements déjà traités,
 * puis confie chaque session Checkout au module du produit concerné.
 * L'ordre compte : du plus spécifique (commande nominative) au plus générique.
 */
const CHECKOUT_HANDLERS: NamedHandler[] = [
  ["commerce", async ({ stripe, session, event }) =>
    await commerceCheckout(stripe, session, event.created)
      ? jsonResponse({ received: true, product: "commerce_v3" })
      : null],
  ["hooks", handleHooksCheckout],
  ["video", handleVideo],
  ["express", handleExpressCheckout],
  ["academy_legacy", handleLegacyAcademyCheckout],
];

async function logUnmatched({ supabase, session, event }: CheckoutContext): Promise<void> {
  await logUnmatchedPayment(supabase, {
    session_id: session.id,
    reason: "Paiement non rattaché à une commande reconnue",
    amount_cents: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email,
    received_at: new Date(event.created * 1000).toISOString(),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const webhookSecretTest = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");
    const webhookSecrets = [webhookSecret, webhookSecretTest].filter(Boolean) as string[];
    const stripeSecretKey = getStripeSecretKey();

    if (!sig) {
      return jsonResponse({ error: "Stripe signature missing" }, 400);
    }

    if (!stripeSecretKey) {
      console.error("Stripe secret key missing. Webhook event ignored.");
      await safeNotifyError("Stripe Webhook", "Clé Stripe manquante - événement ignoré");
      return jsonResponse({ error: "stripe_secret_key_missing" }, 500);
    }

    if (webhookSecrets.length === 0) {
      console.error("Stripe webhook signing secret missing. Webhook event ignored, but acknowledged to avoid retry storms.");
      await safeNotifyError("Stripe Webhook", "Secret de signature webhook manquant - événement ignoré");
      return jsonResponse({ error: "webhook_secret_missing" }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Backend service credentials missing. Webhook event ignored.");
      await safeNotifyError("Stripe Webhook", "Credentials backend manquants - événement ignoré");
      return jsonResponse({ error: "backend_credentials_missing" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Vérifie d'abord avec le secret live ; en cas d'échec, tente le secret test (sandbox).
    // En Edge Function, Stripe doit utiliser la version async, sinon la crypto Web
    // déclenche "SubtleCryptoProvider cannot be used in a synchronous context".
    let verified: Stripe.Event | null = null;
    for (const secret of webhookSecrets) {
      try {
        verified = await stripe.webhooks.constructEventAsync(body, sig, secret);
        break;
      } catch (err) {
        console.warn("Stripe signature verification failed with one configured secret:", getErrorMessage(err));
      }
    }
    if (!verified) {
      return jsonResponse({ error: "Invalid Stripe signature" }, 400);
    }
    const event = verified;

    const state = await beginEvent(supabase, event);
    if (state === "duplicate") {
      return jsonResponse({ received: true, duplicate: true });
    }

    let response = jsonResponse({ received: true });
    try {
      // ── Checkout terminé / paiement différé confirmé ──────────────────────
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const session = event.data.object as Stripe.Checkout.Session;
        response = await routeCheckout(
          { stripe, supabase, session, event, supabaseUrl, serviceRoleKey },
          CHECKOUT_HANDLERS,
          { logUnmatched, notifyError: safeNotifyError, json: jsonResponse, errorMessage: getErrorMessage },
        );
      } else if (event.type === "customer.subscription.deleted") {
        await handleSubscriptionDeleted(supabase, event);
      }
    } catch (error) {
      await finishEvent(supabase, event.id, false, { error: getErrorMessage(error) });
      throw error;
    }

    const outcome = await response.clone().json().catch(() => ({}));
    await finishEvent(supabase, event.id, response.ok, { status: response.status, ...outcome });
    return response;
  } catch (error) {
    console.error("Webhook error:", error);
    await safeNotifyError("Stripe Webhook", getErrorMessage(error));
    // A processing failure must be visible to Stripe so the signed event is
    // retried. Product handlers above are idempotent across those replays.
    return jsonResponse({ received: false, processing_error: true }, 500);
  }
});
