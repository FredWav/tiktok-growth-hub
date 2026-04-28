import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    // ── checkout.session.completed ────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      // Plan → Discord role env mapping (used when consent record drives the flow)
      const ROLE_ENV_BY_PLAN: Record<string, string> = {
        acces: "DISCORD_VIP1_ROLE_ID",
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

      if (metadata?.type?.startsWith("wavacademy_")) {
        plan = (metadata.plan as string) ?? null;
        discordRoleEnv = (metadata.discord_role_env as string) ?? null;
        email = (metadata.email as string) || session.customer_details?.email || null;
      } else if (session.client_reference_id) {
        const { data: consent } = await supabase
          .from("wavacademy_consents")
          .select("id, email, plan_type, consent_cgv, consent_renonciation")
          .eq("id", session.client_reference_id)
          .maybeSingle();

        if (consent && consent.consent_cgv && consent.consent_renonciation) {
          consentId = consent.id;
          plan = consent.plan_type;
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
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripeSubscriptionId = session.subscription as string | null;
      console.log(`WavAcademy checkout completed: plan=${plan}, email=${email}, consent=${consentId ?? "n/a"}`);

      const { data: subRow, error: insertError } = await supabase
        .from("wavacademy_subscriptions")
        .insert({
          stripe_session_id: session.id,
          stripe_subscription_id: stripeSubscriptionId,
          email,
          discord_user_id: null,
          discord_role_env: discordRoleEnv,
          plan_type: plan,
          status: "active",
          discord_role_granted: false,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting wavacademy_subscription:", insertError);
        await notifyError("WavAcademy Webhook", `Échec insert DB • plan=${plan} • ${email}`);
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
          await notifyError("WavAcademy Webhook", `Échec création claim • ${email} • ${claimErr.message}`);
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
          await notifyError("WavAcademy Webhook", `Échec envoi email claim • ${email}`);
        }
      }

      await notifySuccess("WavAcademy", `Nouveau membre • ${plan} • ${email} • claim envoyé`);

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

        await notifySuccess("WavAcademy", `Résiliation abonnement • ${subscription.id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    await notifyError("Stripe Webhook", `${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
