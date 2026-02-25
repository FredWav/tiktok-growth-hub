import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, username } = await req.json();
    if (!session_id || !username) throw new Error("session_id et username requis");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Paiement non confirmé");
    }

    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const pdfRes = await fetch(`${API_BASE}/accounts/${encodeURIComponent(username)}/pdf`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      console.error("PDF error:", errText);
      throw new Error(`Erreur lors de la génération du PDF: ${pdfRes.status}`);
    }

    const htmlContent = await pdfRes.text();

    return new Response(JSON.stringify({ html: htmlContent }), {
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
