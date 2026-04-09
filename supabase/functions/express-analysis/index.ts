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

/**
 * Fire-and-forget call to mailerlite-subscribe.
 * Updates express_analyses.newsletter_subscribed on success.
 */
async function subscribeToNewsletter(
  supabase: ReturnType<typeof createClient>,
  analysisId: string | null,
  email: string,
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resp = await fetch(`${supabaseUrl}/functions/v1/mailerlite-subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email }),
    });
    const result = await resp.json();
    if (!resp.ok) {
      console.error(`Newsletter subscription failed for ${email}:`, result);
      return;
    }
    console.log(`Newsletter subscription OK for ${email}`);
    if (analysisId) {
      await supabase
        .from("express_analyses")
        .update({ newsletter_subscribed: true })
        .eq("id", analysisId);
    }
  } catch (err) {
    console.error("subscribeToNewsletter error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  let username: string | undefined;
  let customerEmail: string | null = null;
  let wantsNewsletter = false;
  let analysisId: string | null = null;
  let session_id: string | undefined;

  try {
    const body = await req.json();
    session_id = body.session_id;
    if (!session_id) throw new Error("session_id manquant");

    const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      await notifyError("Analyse Express", `Paiement non confirmé • session ${session_id}`);
      throw new Error("Paiement non confirmé");
    }

    username = session.metadata?.tiktok_username;
    if (!username) throw new Error("Username TikTok introuvable dans la session");

    customerEmail = session.metadata?.email || session.customer_email || null;
    wantsNewsletter = session.metadata?.subscribe_newsletter === "true";

    const existingJobId = session.metadata?.job_id;
    if (existingJobId) {
      console.log(`Returning existing job_id ${existingJobId} for session ${session_id}`);
      return new Response(JSON.stringify({ username, job_id: existingJobId, status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── 1. Insert express_analyses row EARLY (status=pending) ──
    // This guarantees the email + username are saved even if the API call below fails,
    // so the admin can manually retry the analysis or contact the customer.
    try {
      const { data: insertData, error: insertError } = await supabase
        .from("express_analyses")
        .insert({
          stripe_session_id: session_id,
          tiktok_username: username,
          status: "pending",
          email: customerEmail,
          newsletter_requested: wantsNewsletter,
        })
        .select("id")
        .single();

      if (insertError) {
        // Could be a duplicate (idempotent retry) — try to fetch existing row
        console.warn("Insert failed, attempting to find existing row:", insertError.message);
        const { data: existing } = await supabase
          .from("express_analyses")
          .select("id")
          .eq("stripe_session_id", session_id)
          .maybeSingle();
        analysisId = existing?.id ?? null;
      } else {
        analysisId = insertData.id;
      }
    } catch (dbErr) {
      console.warn("Failed to insert express_analyses record (early):", dbErr);
    }

    // ── 2. Trigger newsletter subscription right away (don't wait for analysis) ──
    if (wantsNewsletter && customerEmail) {
      // fire-and-forget — runs in parallel with the API call
      subscribeToNewsletter(supabase, analysisId, customerEmail).catch((err) =>
        console.error("Newsletter background error:", err)
      );
    }

    // ── 3. Call WavSocialScan API ──
    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const analyzeRes = await fetch(`${API_BASE}/accounts/${encodeURIComponent(username)}/analyze`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      console.error("Analyze error:", errText);
      // Mark analysis as failed in DB but don't lose the row
      if (analysisId) {
        await supabase
          .from("express_analyses")
          .update({
            status: "failed",
            error_message: `API erreur ${analyzeRes.status}: ${errText.slice(0, 500)}`,
          })
          .eq("id", analysisId);
      }
      await notifyError("Analyse Express", `API erreur ${analyzeRes.status} • @${username} • ${customerEmail || "email manquant"}`);
      throw new Error(`Erreur lors du lancement de l'analyse: ${analyzeRes.status}`);
    }

    const analyzeData = await analyzeRes.json();
    const jobId = analyzeData.job_id;

    if (!jobId) {
      console.error("No job_id in response:", analyzeData);
      if (analysisId) {
        await supabase
          .from("express_analyses")
          .update({ status: "failed", error_message: "job_id non retourné par l'API" })
          .eq("id", analysisId);
      }
      throw new Error("job_id non retourné par l'API");
    }

    try {
      await stripe.checkout.sessions.update(session_id, {
        metadata: { ...session.metadata, job_id: jobId },
      });
    } catch (updateErr) {
      console.warn("Failed to update Stripe session metadata with job_id:", updateErr);
    }

    // ── 4. Update DB row with job_id + status=processing ──
    if (analysisId) {
      await supabase
        .from("express_analyses")
        .update({ job_id: jobId, status: "processing" })
        .eq("id", analysisId);
    }

    await notifySuccess("Analyse Express", `Lancée • @${username} • job ${jobId}${customerEmail ? " • " + customerEmail : ""}`);

    return new Response(JSON.stringify({ username, job_id: jobId, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    await notifyError("Analyse Express", `${error.message}${customerEmail ? " • " + customerEmail : ""}${username ? " • @" + username : ""}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
