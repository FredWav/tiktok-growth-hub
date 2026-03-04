import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

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
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id manquant");

    const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      await notifyError("Analyse Express", `Paiement non confirmé • session ${session_id}`);
      throw new Error("Paiement non confirmé");
    }

    const username = session.metadata?.tiktok_username;
    if (!username) throw new Error("Username TikTok introuvable dans la session");

    const existingJobId = session.metadata?.job_id;
    if (existingJobId) {
      console.log(`Returning existing job_id ${existingJobId} for session ${session_id}`);
      return new Response(JSON.stringify({ username, job_id: existingJobId, status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const analyzeRes = await fetch(`${API_BASE}/accounts/${encodeURIComponent(username)}/analyze`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      console.error("Analyze error:", errText);
      await notifyError("Analyse Express", `API erreur ${analyzeRes.status} • @${username}`);
      throw new Error(`Erreur lors du lancement de l'analyse: ${analyzeRes.status}`);
    }

    const analyzeData = await analyzeRes.json();
    const jobId = analyzeData.job_id;

    if (!jobId) {
      console.error("No job_id in response:", analyzeData);
      throw new Error("job_id non retourné par l'API");
    }

    try {
      await stripe.checkout.sessions.update(session_id, {
        metadata: { ...session.metadata, job_id: jobId },
      });
    } catch (updateErr) {
      console.warn("Failed to update Stripe session metadata with job_id:", updateErr);
    }

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );
      const customerEmail = session.metadata?.email || session.customer_email || null;
      await supabase.from("express_analyses").insert({
        stripe_session_id: session_id,
        tiktok_username: username,
        job_id: jobId,
        status: "processing",
        email: customerEmail,
      });
    } catch (dbErr) {
      console.warn("Failed to insert express_analyses record:", dbErr);
    }

    await notifySuccess("Analyse Express", `Lancée • @${username} • job ${jobId}`);

    return new Response(JSON.stringify({ username, job_id: jobId, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    await notifyError("Analyse Express", `${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
