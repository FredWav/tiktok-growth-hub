import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStripePricesForMode, getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";
import { normalizeTikTokUsername } from "../_shared/tiktok-username.ts";
import { checkoutMismatch } from "../_shared/checkout-validation.ts";
import { launchExpressJob } from "../_shared/express-launch.ts";
import { pollExpress, type ExpressRow } from "../_shared/express-finalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};



function getExpectedExpressPriceId(livemode: boolean): string {
  const mode = livemode ? "live" : "test";
  return Deno.env.get(livemode ? "STRIPE_EXPRESS_PRICE_ID_LIVE" : "STRIPE_EXPRESS_PRICE_ID_TEST") ||
    getStripePricesForMode(mode).analyse_express;
}

/**
 * Bounded newsletter call after the analysis job has been saved.
 * Updates express_analyses.newsletter_subscribed on success.
 */
async function subscribeToNewsletter(
  supabase: SupabaseClient,
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
      signal: AbortSignal.timeout(10_000),
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
    if (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
      throw new Error("Exécution des paiements test désactivée");
    }
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
    const expectedPrice = getExpectedExpressPriceId(session.livemode);
    const mismatch = checkoutMismatch(session, items.data, expectedPrice, 1990);
    if (mismatch) throw new Error(mismatch);

    // ── 1. Résoudre la ligne express_analyses ──
    // Soit déjà liée à cette session Stripe (retry), soit via client_reference_id
    // posé par create-express-checkout sur le Payment Link.
    type ExpressAnalysisRow = ExpressRow & { newsletter_requested: boolean | null };
    let row: ExpressAnalysisRow | null = null;
    {
      const { data: bySession } = await supabase
        .from("express_analyses")
        .select("*")
        .eq("stripe_session_id", session_id)
        .maybeSingle();
      row = (bySession as ExpressAnalysisRow | null) ?? null;
    }
    if (!row && session.client_reference_id) {
      const { data: byRef } = await supabase
        .from("express_analyses")
        .select("*")
        .eq("id", session.client_reference_id)
        .maybeSingle();
      row = (byRef as ExpressAnalysisRow | null) ?? null;
      if (row) {
        // Lie définitivement la session Stripe à cette ligne d'intention.
        const { data: linked, error: linkError } = await supabase
          .from("express_analyses")
          .update({ stripe_session_id: session_id })
          .eq("id", row.id).or(`stripe_session_id.is.null,stripe_session_id.eq.${session_id}`).select("id").maybeSingle();
        if (linkError || !linked) throw new Error("Cette intention est déjà rattachée à un autre paiement");
      }
    }
    if (!row) throw new Error("Intention d'analyse introuvable pour cette session");

    analysisId = row.id;
    // Filet pour les lignes créées avant la normalisation à l'inscription : WavStats
    // fait une correspondance exacte sur l'identifiant TikTok, qui est en minuscules.
    username = normalizeTikTokUsername(row.tiktok_username);
    if (!username) throw new Error("Nom d'utilisateur TikTok invalide sur l'intention d'analyse");
    customerEmail = row.email || session.customer_details?.email || null;
    wantsNewsletter = row.newsletter_requested === true;

    // Idempotence: si on a déjà lancé l'analyse, on retourne le job_id existant.
    if (row.job_id || ["failed", "refunded", "complete", "completed"].includes(row.status)) {
      console.log(`Returning existing job_id ${row.job_id} for session ${session_id}`);
      return new Response(JSON.stringify({ ...await pollExpress(row, supabase), job_id: row.job_id }), {
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

    // One launch only: an interrupted remote call has an unknown outcome.
    // Do not create a second paid job automatically; the support outbox handles recovery.
    const apiKey = Deno.env.get("WAVSTATS_API_KEY") || Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavStats non configurée");
    const launchAt = new Date().toISOString();
    const { data: launchLock, error: launchLockError } = await supabase
      .from("express_analyses")
      .update({ status: "starting", launch_started_at: launchAt, processing_started_at: launchAt, updated_at: launchAt, email: customerEmail, error_message: null })
      .eq("id", analysisId)
      .is("job_id", null)
      .in("status", ["pending", "awaiting_payment"])
      .select("*")
      .maybeSingle();

    if (launchLockError) throw new Error(`Verrou de lancement impossible : ${launchLockError.message}`);
    if (!launchLock) {
      const { data: current, error: readError } = await supabase.from("express_analyses")
        .select("*").eq("id", analysisId).single();
      if (readError || !current) throw new Error("Lecture du traitement impossible");
      return new Response(JSON.stringify(await pollExpress(current as ExpressRow, supabase)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }
    const saved = await launchExpressJob(supabase, launchLock as ExpressRow, apiKey);
    const jobId = saved.job_id;
    // Newsletter latency can no longer strand an analysis before its partner launch.
    if (wantsNewsletter && customerEmail) await subscribeToNewsletter(supabase, analysisId, customerEmail);

    await notifySuccess("Analyse Express", `Lancée • @${username} • job ${jobId}${customerEmail ? " • " + customerEmail : ""}`);

    return new Response(JSON.stringify({ username, job_id: jobId, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await notifyError("Analyse Express", `${message}${customerEmail ? " • " + customerEmail : ""}${username ? " • @" + username : ""}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
