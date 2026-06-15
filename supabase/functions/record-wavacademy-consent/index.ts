import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe Payment Link URLs par formule — public, fine to ship in code.
// Les 3 formules sont des paiements uniques prépayés : 3m = 299€, 6m = 499€, 12m = 899€.
// TODO (Fred) : coller les 3 Payment Links LIVE créés dans Stripe (paiement unique, sans
// échelonnement — sinon le bouton ne paie pas).
const PAYMENT_LINKS: Record<string, string> = {
  "3m": "https://buy.stripe.com/fZu8wObli9Pjg1A5TqcMM0C", // paiement unique 299€ (Fondation, 3 mois)
  "6m": "https://buy.stripe.com/7sYeVccpm1iNbLkchOcMM0D", // paiement unique 499€ (Accélération, 6 mois)
  "12m": "https://buy.stripe.com/4gMfZgahe5z3cPogy4cMM0E", // paiement unique 899€ (Maîtrise, 12 mois)
};

// Liens Stripe en mode TEST (sandbox) — utilisés uniquement quand mode==='test' (déclencheur ?test=1).
// Invisibles pour les vrais visiteurs. Non utilisés : aucun lien sandbox n'a été créé (les liens
// live sont en place). Le flux ?test=1 ne paie donc pas tant que ces placeholders restent.
const TEST_PAYMENT_LINKS: Record<string, string> = {
  "3m": "TODO_STRIPE_TEST_LINK_3M_299",
  "6m": "TODO_STRIPE_TEST_LINK_6M_499",
  "12m": "TODO_STRIPE_TEST_LINK_12M_899",
};

// Durée d'accès (en mois) par formule — capturée au consentement pour le calcul d'expiration.
const ACCESS_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };

const CGV_VERSION = "v5"; // bump if /cgv text materially changes
const CGV_VERSION_TEST = "TEST"; // marqueur pour les consentements de test (exclus de l'export légal)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { term, email, consent_cgv, consent_renonciation } = body ?? {};

    // Mode test (sandbox) : déclenché uniquement par le front via ?test=1. Les vrais visiteurs
    // n'envoient jamais mode==='test' → ils gardent les liens live.
    const isTest = body?.mode === "test";
    const links = isTest ? TEST_PAYMENT_LINKS : PAYMENT_LINKS;

    if (!term || !(term in links)) {
      return new Response(
        JSON.stringify({ error: "Formule invalide (3m, 6m ou 12m attendu)" }),
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
        plan_type: "live", // accès identique pour toutes les formules
        access_months: ACCESS_MONTHS[term],
        consent_cgv: true,
        consent_renonciation: true,
        cgv_version: isTest ? CGV_VERSION_TEST : CGV_VERSION,
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
    const baseUrl = links[term];
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
