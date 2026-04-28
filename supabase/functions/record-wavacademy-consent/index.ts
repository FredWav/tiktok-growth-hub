import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe Payment Link URLs — public, fine to ship in code.
// If you ever rotate them, just edit here.
const PAYMENT_LINKS: Record<string, string> = {
  acces: "https://buy.stripe.com/dRm6oG9da4uZbLk2HecMM0w",
  live: "https://buy.stripe.com/bJe14m2OMd1v3eO2HecMM0x",
};

const CGV_VERSION = "v1"; // bump if /cgv text materially changes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { plan, email, consent_cgv, consent_renonciation } = body ?? {};

    if (!plan || !(plan in PAYMENT_LINKS)) {
      return new Response(
        JSON.stringify({ error: "Plan invalide (acces ou live attendu)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (consent_cgv !== true || consent_renonciation !== true) {
      return new Response(
        JSON.stringify({ error: "Les deux consentements sont obligatoires" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capture proof-of-consent context
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from("wavacademy_consents")
      .insert({
        email: email.trim().toLowerCase(),
        plan_type: plan,
        consent_cgv: true,
        consent_renonciation: true,
        cgv_version: CGV_VERSION,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to insert wavacademy_consent:", error);
      await notifyError("Record Consent", `DB insert failed • ${email} • ${error?.message ?? "no row"}`);
      return new Response(
        JSON.stringify({ error: "Erreur d'enregistrement, réessaie" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const consentId = data.id as string;
    const baseUrl = PAYMENT_LINKS[plan];
    const params = new URLSearchParams({
      client_reference_id: consentId,
      prefilled_email: email.trim(),
    });
    const paymentUrl = `${baseUrl}?${params.toString()}`;

    return new Response(
      JSON.stringify({ consent_id: consentId, payment_url: paymentUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("record-wavacademy-consent error:", error);
    await notifyError("Record Consent", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
