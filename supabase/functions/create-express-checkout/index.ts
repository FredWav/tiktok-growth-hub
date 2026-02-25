import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string" || username.trim().length < 2) {
      throw new Error("Nom d'utilisateur TikTok invalide");
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://fredwav.lovable.app";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1T4jiMPXtjut80rmEJgrHCDJ",
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        tiktok_username: cleanUsername,
        type: "analyse_express",
      },
      success_url: `${origin}/analyse-express/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/analyse-express`,
      payment_method_types: ["card", "klarna", "paypal"],
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
