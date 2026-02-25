import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id manquant");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Paiement non confirmé");
    }

    const username = session.metadata?.tiktok_username;
    if (!username) throw new Error("Username TikTok introuvable dans la session");

    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    // Trigger analysis
    const analyzeRes = await fetch(`${API_BASE}/accounts/${encodeURIComponent(username)}/analyze`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      console.error("Analyze error:", errText);
      throw new Error(`Erreur lors du lancement de l'analyse: ${analyzeRes.status}`);
    }

    // Poll for results (max 90s, every 5s)
    let data = null;
    for (let i = 0; i < 18; i++) {
      await sleep(5000);

      const getRes = await fetch(`${API_BASE}/accounts/${encodeURIComponent(username)}`, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (getRes.ok) {
        const result = await getRes.json();
        if (result && result.health_score?.total !== undefined && result.health_score?.total !== null) {
          data = result;
          break;
        }
      }
    }

    if (!data) {
      throw new Error("L'analyse n'est pas encore prête. Réessayez dans quelques instants.");
    }

    return new Response(JSON.stringify({ data, username }), {
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
