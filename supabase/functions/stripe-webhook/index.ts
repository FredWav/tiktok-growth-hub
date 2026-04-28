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

      // ── Wav Academy subscription ─────────────────────────────────────────
      if (metadata?.type?.startsWith("wavacademy_")) {
        const plan = metadata.plan as string;
        const discordRoleEnv = metadata.discord_role_env;
        const email = metadata.email || (session.customer_details?.email ?? null);
        const stripeSubscriptionId = session.subscription as string | null;

        console.log(`WavAcademy checkout completed: plan=${plan}, email=${email}`);

        // Store in wavacademy_subscriptions (Discord user id will be filled at claim time)
        const { data: subRow, error: insertError } = await supabase
          .from("wavacademy_subscriptions")
          .insert({
            stripe_session_id: session.id,
            stripe_subscription_id: stripeSubscriptionId,
            email,
            discord_user_id: null,
            discord_role_env: discordRoleEnv || null,
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

        // Create a single-use claim token (7-day expiry)
        let claimToken: string | null = null;
        if (subRow?.id && email && discordRoleEnv) {
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

        // Send activation email with claim link
        if (claimToken && email) {
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

      // Unknown checkout session type — just acknowledge
      console.log("Not a known checkout session type, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── customer.subscription.deleted (WavAcademy cancellation) ─────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subMeta = subscription.metadata;

      if (subMeta?.type?.startsWith("wavacademy_")) {
        const discordRoleEnv = subMeta.discord_role_env;

        console.log(`WavAcademy subscription cancelled: ${subscription.id}`);

        // Look up the actual Discord user id (filled in at claim time, not in metadata)
        const { data: subRow } = await supabase
          .from("wavacademy_subscriptions")
          .select("discord_user_id, discord_role_env")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        // Update DB
        await supabase
          .from("wavacademy_subscriptions")
          .update({ status: "cancelled", discord_role_granted: false })
          .eq("stripe_subscription_id", subscription.id);

        // Revoke Discord role
        const userId = subRow?.discord_user_id;
        const roleEnv = subRow?.discord_role_env || discordRoleEnv;
        if (userId && roleEnv) {
          await assignDiscordRole(userId, roleEnv, "revoke");
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
