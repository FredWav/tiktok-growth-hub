import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, job_id } = await req.json();
    if (!session_id) throw new Error("session_id manquant");
    if (!job_id) throw new Error("job_id manquant");

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

    // Poll job status
    const jobRes = await fetch(`${API_BASE}/jobs/${encodeURIComponent(job_id)}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error("Job status check error:", errText);
      return new Response(JSON.stringify({ status: "processing", username, progress: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const job = await jobRes.json();
    const supabase = getSupabase();

    if (job.status === "completed" && job.result) {
      // Update DB record to complete
      try {
        const healthScore = job.result?.health_score ?? job.result?.score ?? null;
        await supabase.from("express_analyses").update({
          status: "complete",
          health_score: typeof healthScore === "number" ? healthScore : null,
          completed_at: new Date().toISOString(),
        }).eq("job_id", job_id);
      } catch (dbErr) {
        console.warn("Failed to update express_analyses:", dbErr);
      }

      return new Response(JSON.stringify({ status: "complete", data: job.result, username }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (job.status === "failed") {
      // Update DB record to failed
      try {
        await supabase.from("express_analyses").update({
          status: "failed",
          error_message: job.error || "L'analyse a échoué",
          completed_at: new Date().toISOString(),
        }).eq("job_id", job_id);
      } catch (dbErr) {
        console.warn("Failed to update express_analyses:", dbErr);
      }

      return new Response(JSON.stringify({
        status: "failed",
        error: job.error || "L'analyse a échoué",
        username,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Still processing
    return new Response(JSON.stringify({
      status: "processing",
      progress: job.progress || 0,
      current_step: job.current_step || null,
      username,
    }), {
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
