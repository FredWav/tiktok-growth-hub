import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function safeNotifyError(title: string, message: string): Promise<void> {
  try {
    await notifyError(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send error notification for ${title}:`, notifyErr);
  }
}

async function safeNotifySuccess(title: string, message: string): Promise<void> {
  try {
    await notifySuccess(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send success notification for ${title}:`, notifyErr);
  }
}

/** Call the discord-role Edge Function to grant or revoke a role. */
async function assignDiscordRole(
  discordUserId: string,
  roleEnvKey: string,
  action: "grant" | "revoke"
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const roleId = Deno.env.get(roleEnvKey);

  if (!roleId) {
    console.warn(`Discord role env var not set: ${roleEnvKey}. Skipping role assignment.`);
    return;
  }

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/discord-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action, discordUserId, roleId }),
    });
    const result = await resp.json();
    console.log(`Discord role ${action} (${roleEnvKey}) for ${discordUserId}:`, result);
  } catch (err) {
    console.error(`Failed to ${action} Discord role for ${discordUserId}:`, err);
  }
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
    let event: Stripe.Event;

    if (!sig) {
      return jsonResponse({ error: "Stripe signature missing" }, 400);
    }

    if (!stripeSecretKey) {
      console.error("Stripe secret key missing. Webhook event ignored.");
      await safeNotifyError("Stripe Webhook", "Clé Stripe manquante - événement ignoré");
      return jsonResponse({ received: true, ignored: true, reason: "stripe_secret_key_missing" });
    }

    if (webhookSecrets.length === 0) {
      console.error("Stripe webhook signing secret missing. Webhook event ignored, but acknowledged to avoid retry storms.");
      await safeNotifyError("Stripe Webhook", "Secret de signature webhook manquant - événement ignoré");
      return jsonResponse({ received: true, ignored: true, reason: "webhook_secret_missing" });
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
      return jsonResponse({ received: true, ignored: true, reason: "backend_credentials_missing" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Vérifie d'abord avec le secret live ; en cas d'échec, tente le secret test (sandbox).
    let verified: Stripe.Event | null = null;
    for (const secret of webhookSecrets) {
      try {
        verified = stripe.webhooks.constructEvent(body, sig, secret);
        break;
      } catch (err) {
        console.warn("Stripe signature verification failed with one configured secret:", getErrorMessage(err));
      }
    }
    if (!verified) {
      return jsonResponse({ error: "Invalid Stripe signature" }, 400);
    }
    event = verified;

    // ── checkout.session.completed ────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      // Plan → Discord role env mapping (used when consent record drives the flow)
      const ROLE_ENV_BY_PLAN: Record<string, string> = {
        live: "DISCORD_VIP2_ROLE_ID",
      };

      // Resolve the wavacademy purchase context from one of two sources:
      //   (1) Legacy Edge Function checkout — info lives in session.metadata
      //   (2) Stripe Payment Link — info lives in wavacademy_consents
      //       keyed by session.client_reference_id
      let plan: string | null = null;
      let discordRoleEnv: string | null = null;
      let email: string | null = null;
      let consentId: string | null = null;
      let accessMonths: number | null = null;

      if (metadata?.type?.startsWith("wavacademy_")) {
        plan = (metadata.plan as string) ?? null;
        discordRoleEnv = (metadata.discord_role_env as string) ?? null;
        email = (metadata.email as string) || session.customer_details?.email || null;
      } else if (session.client_reference_id) {
        const { data: consent } = await supabase
          .from("wavacademy_consents")
          .select("id, email, plan_type, access_months, consent_cgv, consent_renonciation")
          .eq("id", session.client_reference_id)
          .maybeSingle();

        if (consent && consent.consent_cgv && consent.consent_renonciation) {
          consentId = consent.id;
          plan = consent.plan_type;
          accessMonths = consent.access_months ?? null;
          discordRoleEnv = ROLE_ENV_BY_PLAN[consent.plan_type] ?? null;
          email = consent.email || session.customer_details?.email || null;

          // Link the Stripe session back onto the consent row (legal trail)
          await supabase
            .from("wavacademy_consents")
            .update({ stripe_session_id: session.id })
            .eq("id", consent.id);
        }
      }

      if (!plan || !discordRoleEnv || !email) {
        console.log("Checkout session is not a Wav Academy purchase, skipping");
        return jsonResponse({ received: true });
      }

      const stripeSubscriptionId = session.subscription as string | null;

      // Paiement unique prépayé (3/6 mois) : pas d'abonnement Stripe → on fixe une date
      // d'expiration que le cron revoke-expired-wavacademy utilisera pour retirer l'accès.
      // 1 mois récurrent : stripe_subscription_id renseigné → access_expires_at reste null
      // (la fin d'accès est pilotée par customer.subscription.deleted).
      let accessExpiresAt: string | null = null;
      if (!stripeSubscriptionId && accessMonths) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + accessMonths);
        accessExpiresAt = exp.toISOString();
      }

      console.log(`WavAcademy checkout completed: plan=${plan}, months=${accessMonths ?? "n/a"}, recurring=${!!stripeSubscriptionId}, email=${email}, consent=${consentId ?? "n/a"}`);

      const { data: subRow, error: insertError } = await supabase
        .from("wavacademy_subscriptions")
        .insert({
          stripe_session_id: session.id,
          stripe_subscription_id: stripeSubscriptionId,
          email,
          discord_user_id: null,
          discord_role_env: discordRoleEnv,
          plan_type: plan,
          access_months: accessMonths,
          access_expires_at: accessExpiresAt,
          status: "active",
          discord_role_granted: false,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting wavacademy_subscription:", insertError);
        await safeNotifyError("WavAcademy Webhook", `Échec insert DB • plan=${plan} • ${email}`);
      }

      let claimToken: string | null = null;
      if (subRow?.id) {
        const { data: claimRow, error: claimErr } = await supabase
          .from("wavacademy_claims")
          .insert({
            subscription_id: subRow.id,
            email,
            plan_type: plan,
            discord_role_env: discordRoleEnv,
          })
          .select("token")
          .single();

        if (claimErr) {
          console.error("Error creating wavacademy_claim:", claimErr);
          await safeNotifyError("WavAcademy Webhook", `Échec création claim • ${email} • ${claimErr.message}`);
        } else {
          claimToken = claimRow.token as string;
        }
      }

      if (claimToken) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          await fetch(`${supabaseUrl}/functions/v1/send-claim-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ email, token: claimToken, plan_type: plan }),
          });
        } catch (mailErr) {
          console.error("Failed to invoke send-claim-email:", mailErr);
          await safeNotifyError("WavAcademy Webhook", `Échec envoi email claim • ${email}`);
        }
      }

      await safeNotifySuccess("WavAcademy", `Nouveau membre • ${plan} • ${email} • claim envoyé`);

      return jsonResponse({ received: true });
    }

    // ── customer.subscription.deleted (WavAcademy cancellation) ─────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      // Find the matching wavacademy_subscriptions row by Stripe subscription id.
      // This works regardless of whether the original checkout went through the
      // legacy Edge Function (with metadata.type) or a Stripe Payment Link.
      const { data: subRow } = await supabase
        .from("wavacademy_subscriptions")
        .select("discord_user_id, discord_role_env")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (subRow) {
        console.log(`WavAcademy subscription cancelled: ${subscription.id}`);

        await supabase
          .from("wavacademy_subscriptions")
          .update({ status: "cancelled", discord_role_granted: false })
          .eq("stripe_subscription_id", subscription.id);

        if (subRow.discord_user_id && subRow.discord_role_env) {
          await assignDiscordRole(subRow.discord_user_id, subRow.discord_role_env, "revoke");
        }

        await safeNotifySuccess("WavAcademy", `Résiliation abonnement • ${subscription.id}`);
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    await safeNotifyError("Stripe Webhook", getErrorMessage(error));
    return jsonResponse({ received: true, processing_error: true });
  }
});
