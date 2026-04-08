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

      // ── Wav Club subscription ─────────────────────────────────────────
      if (metadata?.type?.startsWith("wavclub_")) {
        const plan = metadata.plan as string;
        const discordUserId = metadata.discord_user_id;
        const discordRoleEnv = metadata.discord_role_env;
        const email = metadata.email;
        const stripeSubscriptionId = session.subscription as string | null;

        console.log(`WavClub checkout completed: plan=${plan}, email=${email}, discord=${discordUserId}`);

        // Store in wavclub_subscriptions
        const { error: insertError } = await supabase
          .from("wavclub_subscriptions")
          .insert({
            stripe_session_id: session.id,
            stripe_subscription_id: stripeSubscriptionId,
            email,
            discord_user_id: discordUserId || null,
            discord_role_env: discordRoleEnv || null,
            plan_type: plan,
            status: "active",
            discord_role_granted: false,
          });

        if (insertError) {
          console.error("Error inserting wavclub_subscription:", insertError);
          await notifyError("WavClub Webhook", `Échec insert DB • plan=${plan} • ${email}`);
          // Don't throw — still try to assign Discord role
        }

        // Assign Discord role
        if (discordUserId && discordRoleEnv) {
          await assignDiscordRole(discordUserId, discordRoleEnv, "grant");

          // Mark discord_role_granted = true
          await supabase
            .from("wavclub_subscriptions")
            .update({ discord_role_granted: true })
            .eq("stripe_session_id", session.id);
        }

        await notifySuccess("WavClub", `Nouveau membre • ${plan} • ${email}`);

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Legacy VIP subscription ───────────────────────────────────────
      if (!metadata?.user_id || !metadata?.duration_months) {
        console.log("Not a known checkout session type, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = metadata.user_id;
      const durationMonths = parseInt(metadata.duration_months);
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const { error: subError } = await supabase
        .from("vip_subscriptions")
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          duration_months: durationMonths,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
        });

      if (subError) {
        console.error("Error creating vip_subscription:", subError);
        await notifyError("Stripe VIP", `Échec insert DB • user ${userId} • ${durationMonths} mois`);
        throw subError;
      }

      await notifySuccess("Stripe VIP", `Abonnement créé • ${durationMonths} mois • user ${userId}`);
      console.log(`VIP subscription created for user ${userId}, ${durationMonths} months`);
    }

    // ── customer.subscription.deleted (WavClub cancellation) ─────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subMeta = subscription.metadata;

      if (subMeta?.type?.startsWith("wavclub_")) {
        const discordUserId = subMeta.discord_user_id;
        const discordRoleEnv = subMeta.discord_role_env;

        console.log(`WavClub subscription cancelled: ${subscription.id}`);

        // Update DB
        await supabase
          .from("wavclub_subscriptions")
          .update({ status: "cancelled", discord_role_granted: false })
          .eq("stripe_subscription_id", subscription.id);

        // Revoke Discord role
        if (discordUserId && discordRoleEnv) {
          await assignDiscordRole(discordUserId, discordRoleEnv, "revoke");
        }

        await notifySuccess("WavClub", `Résiliation abonnement • ${subscription.id}`);
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
