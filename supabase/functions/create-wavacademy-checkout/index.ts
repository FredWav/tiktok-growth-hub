import Stripe from "https://esm.sh/stripe@18.5.0";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Plan metadata:
 *   acces  → 39€/mois  → Discord role @vip1  → env: STRIPE_PRICE_WAVACADEMY_ACCES
 *   live   → 97€/mois  → Discord role @vip2  → env: STRIPE_PRICE_WAVACADEMY_LIVE
 */
const PLAN_CONFIG = {
  acces: {
    envKey: "STRIPE_PRICE_WAVACADEMY_ACCES",
    label: "Wav Academy · Accès",
    discordRoleEnv: "DISCORD_VIP1_ROLE_ID",
  },
  live: {
    envKey: "STRIPE_PRICE_WAVACADEMY_LIVE",
    label: "Wav Academy · Live",
    discordRoleEnv: "DISCORD_VIP2_ROLE_ID",
  },
} as const;

type Plan = keyof typeof PLAN_CONFIG;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, email, consent_cgv, consent_renonciation, consent_timestamp } = await req.json();

    if (!plan || !(plan in PLAN_CONFIG)) {
      return new Response(
        JSON.stringify({ error: "Plan invalide. Valeurs acceptées : acces, live" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (consent_cgv !== true || consent_renonciation !== true) {
      return new Response(
        JSON.stringify({ error: "Les consentements CGV et renonciation au droit de rétractation sont obligatoires" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const consentIso = typeof consent_timestamp === "string" ? consent_timestamp : new Date().toISOString();

    const config = PLAN_CONFIG[plan as Plan];
    const priceId = Deno.env.get(config.envKey);

    if (!priceId) {
      console.error(`Missing env var: ${config.envKey}`);
      await notifyError("WavAcademy Checkout", `Price ID manquant pour le plan ${plan} (env: ${config.envKey})`);
      return new Response(
        JSON.stringify({ error: "Ce plan n'est pas encore disponible. Contacte-nous." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://fredwav.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email.trim(),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        type: `wavacademy_${plan}`,
        plan,
        discord_role_env: config.discordRoleEnv,
        email: email.trim(),
        consent_cgv: "true",
        consent_renonciation: "true",
        consent_timestamp: consentIso,
      },
      subscription_data: {
        metadata: {
          type: `wavacademy_${plan}`,
          plan,
          discord_role_env: config.discordRoleEnv,
          consent_cgv: "true",
          consent_renonciation: "true",
          consent_timestamp: consentIso,
        },
      },
      success_url: `${origin}/wavacademy?success=true`,
      cancel_url: `${origin}/wavacademy`,
      allow_promotion_codes: true,
    });

    console.log(`WavAcademy checkout session created: ${session.id} for plan=${plan} email=${email}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WavAcademy checkout error:", error);
    await notifyError("WavAcademy Checkout", `Erreur: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
