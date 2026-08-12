import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://wavstats.com/api/v1";

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
      body: JSON.stringify({ email, source: "analyse_express" }),
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
  let ownsLaunch = false;

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
    if (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
      throw new Error("Exécution des paiements test désactivée");
    }

    // ── 1. Résoudre la ligne express_analyses ──
    // Soit déjà liée à cette session Stripe (retry), soit via client_reference_id
    // posé par create-express-checkout sur le Payment Link.
    type ExpressAnalysisRow = {
      id: string;
      tiktok_username: string;
      email: string | null;
      newsletter_requested: boolean | null;
      job_id: string | null;
    };
    let row: ExpressAnalysisRow | null = null;
    {
      const { data: bySession } = await supabase
        .from("express_analyses")
        .select("id, tiktok_username, email, newsletter_requested, job_id")
        .eq("stripe_session_id", session_id)
        .maybeSingle();
      row = (bySession as ExpressAnalysisRow | null) ?? null;
    }
    if (!row && session.client_reference_id) {
      const { data: byRef } = await supabase
        .from("express_analyses")
        .select("id, tiktok_username, email, newsletter_requested, job_id")
        .eq("id", session.client_reference_id)
        .maybeSingle();
      row = (byRef as ExpressAnalysisRow | null) ?? null;
      if (row) {
        // Lie définitivement la session Stripe à cette ligne d'intention.
        await supabase
          .from("express_analyses")
          .update({ stripe_session_id: session_id })
          .eq("id", row.id);
      }
    }
    if (!row) throw new Error("Intention d'analyse introuvable pour cette session");

    analysisId = row.id;
    username = row.tiktok_username;
    customerEmail = row.email || session.customer_details?.email || null;
    wantsNewsletter = row.newsletter_requested === true;

    // Idempotence: si on a déjà lancé l'analyse, on retourne le job_id existant.
    if (row.job_id) {
      console.log(`Returning existing job_id ${row.job_id} for session ${session_id}`);
      return new Response(JSON.stringify({ username, job_id: row.job_id, status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: consent, error: consentError } = await supabase
      .from("express_purchase_consents")
      .select("checkout_mode")
      .eq("express_analysis_id", analysisId)
      .maybeSingle();
    if (consentError) throw new Error(`Lecture du mode de paiement impossible : ${consentError.message}`);
    if (consent && ((consent.checkout_mode === "live") !== session.livemode)) {
      throw new Error("Incohérence entre le mode Stripe et le registre de consentement");
    }

    // Verrou idempotent : completed et async_payment_succeeded peuvent arriver
    // presque simultanément. Un seul appel lance WavStats ; les autres constatent
    // l'état de démarrage. Un verrou interrompu redevient récupérable après 10 min.
    const launchAt = new Date().toISOString();
    const staleBefore = new Date(Date.now() - 10 * 60 * 1_000).toISOString();
    let { data: launchLock, error: launchLockError } = await supabase
      .from("express_analyses")
      .update({ status: "starting", launch_started_at: launchAt, error_message: null })
      .eq("id", analysisId)
      .is("job_id", null)
      .in("status", ["pending", "awaiting_payment", "failed"])
      .select("id")
      .maybeSingle();

    if (!launchLock && !launchLockError) {
      const staleLock = await supabase
        .from("express_analyses")
        .update({ status: "starting", launch_started_at: launchAt, error_message: null })
        .eq("id", analysisId)
        .is("job_id", null)
        .eq("status", "starting")
        .lt("launch_started_at", staleBefore)
        .select("id")
        .maybeSingle();
      launchLock = staleLock.data;
      launchLockError = staleLock.error;
    }

    if (launchLockError) throw new Error(`Verrou de lancement impossible : ${launchLockError.message}`);
    if (!launchLock) {
      return new Response(JSON.stringify({ username, status: "starting" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 202,
      });
    }
    ownsLaunch = true;

    // ── 2. Inscription volontaire à la séquence Express ──
    if (wantsNewsletter && customerEmail) {
      // Une Edge Function peut être interrompue dès sa réponse : on attend
      // donc cet appel afin que le groupe Express ne dépende pas du retour navigateur.
      await subscribeToNewsletter(supabase, analysisId, customerEmail);
    }

    // ── 3. Call WavStats API ──
    // Repli sur l'ancien nom de secret tant que WAVSTATS_API_KEY n'existe pas côté dashboard.
    const apiKey = Deno.env.get("WAVSTATS_API_KEY") ?? Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavStats non configurée");

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
            launch_started_at: null,
            error_message: `API erreur ${analyzeRes.status}: ${errText.slice(0, 500)}`,
          })
          .eq("id", analysisId);
      }
      await notifyError("Analyse Express", `API erreur ${analyzeRes.status} • @${username} • ${customerEmail || "email manquant"}`);
      throw new Error(`Erreur lors du lancement de l'analyse: ${analyzeRes.status}`);
    }

    const analyzeData = await analyzeRes.json();
    const jobId = analyzeData.jobId ?? analyzeData.job_id;

    if (!jobId) {
      console.error("No job_id in response:", analyzeData);
      if (analysisId) {
        await supabase
          .from("express_analyses")
          .update({ status: "failed", launch_started_at: null, error_message: "job_id non retourné par l'API" })
          .eq("id", analysisId);
      }
      throw new Error("job_id non retourné par l'API");
    }

    // ── 4. Update DB row with job_id + status=processing ──
    if (analysisId) {
      await supabase
        .from("express_analyses")
        .update({ job_id: jobId, status: "processing", launch_started_at: null })
        .eq("id", analysisId);
    }

    await notifySuccess("Analyse Express", `Lancée • @${username} • job ${jobId}${customerEmail ? " • " + customerEmail : ""}`);

    return new Response(JSON.stringify({ username, job_id: jobId, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (ownsLaunch && analysisId) {
      await supabase
        .from("express_analyses")
        .update({
          status: "failed",
          launch_started_at: null,
          error_message: error instanceof Error ? error.message.slice(0, 1_000) : String(error).slice(0, 1_000),
        })
        .eq("id", analysisId)
        .is("job_id", null);
    }
    await notifyError("Analyse Express", `${error.message}${customerEmail ? " • " + customerEmail : ""}${username ? " • @" + username : ""}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
