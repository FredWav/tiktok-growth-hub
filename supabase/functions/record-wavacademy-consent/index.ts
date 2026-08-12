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
const PAYMENT_LINKS: Record<string, string> = {
  "3m": Deno.env.get("STRIPE_WAVACADEMY_LIVE_LINK_3M") || "https://buy.stripe.com/fZu8wObli9Pjg1A5TqcMM0C",
  "6m": Deno.env.get("STRIPE_WAVACADEMY_LIVE_LINK_6M") || "https://buy.stripe.com/7sYeVccpm1iNbLkchOcMM0D",
  "12m": Deno.env.get("STRIPE_WAVACADEMY_LIVE_LINK_12M") || "https://buy.stripe.com/4gMfZgahe5z3cPogy4cMM0E",
};

// Liens Stripe en mode TEST (sandbox) — utilisés uniquement quand mode==='test' (déclencheur ?test=1).
const TEST_PAYMENT_LINKS: Record<string, string> = {
  "3m": Deno.env.get("STRIPE_WAVACADEMY_TEST_LINK_3M") || "",
  "6m": Deno.env.get("STRIPE_WAVACADEMY_TEST_LINK_6M") || "",
  "12m": Deno.env.get("STRIPE_WAVACADEMY_TEST_LINK_12M") || "",
};

// Durée d'accès (en mois) par formule — capturée au consentement pour le calcul d'expiration.
const ACCESS_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };

const CGV_VERSION = "2026-08-11"; // bump if /cgv text materially changes
const CGV_VERSION_TEST = "TEST"; // marqueur pour les consentements de test (exclus de l'export légal)
const IMMEDIATE_DELIVERY_NOTICE_VERSION = "2026-08-11";
const CGV_ACCEPTED_TEXT = "J'accepte les Conditions Générales de Vente.";
const IMMEDIATE_DELIVERY_ACCEPTED_TEXT = "Je demande l'exécution immédiate du service et l'accès immédiat au contenu numérique avant l'expiration du délai de rétractation de 14 jours. Je reconnais que pour le contenu numérique, je perds mon droit de rétractation dès l'accès ; pour la partie service, en cas de rétractation, je reste redevable du prix au prorata du service déjà fourni.";

async function getTechnicalFingerprint(req: Request, secret: string): Promise<string | null> {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") || "";
  if (!ipAddress && !userAgent) return null;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`fredwav-academy-consent-v1|${ipAddress}|${userAgent}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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
    if (!links[term]) {
      return new Response(
        JSON.stringify({ error: "Lien Stripe sandbox non configuré pour cette formule" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cleanEmail) || cleanEmail.length > 254) {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuration Supabase manquante");
    }
    const fingerprintKey = Deno.env.get("CONSENT_FINGERPRINT_KEY") || serviceRoleKey;
    const technicalFingerprintHash = await getTechnicalFingerprint(req, fingerprintKey);

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const cgvVersion = isTest ? CGV_VERSION_TEST : CGV_VERSION;
    const accessMonths = ACCESS_MONTHS[term];
    const reusableSince = new Date(Date.now() - 15 * 60 * 1_000).toISOString();
    const { data: reusableConsent, error: reusableConsentError } = await supabase
      .from("wavacademy_consents")
      .select("id")
      .eq("email", cleanEmail)
      .eq("access_months", accessMonths)
      .eq("cgv_version", cgvVersion)
      .is("stripe_session_id", null)
      .gte("accepted_at", reusableSince)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusableConsentError) {
      throw new Error(`Impossible de vérifier une intention existante : ${reusableConsentError.message}`);
    }

    if (reusableConsent) {
      const params = new URLSearchParams({
        client_reference_id: reusableConsent.id,
        prefilled_email: cleanEmail,
      });
      return new Response(
        JSON.stringify({
          consent_id: reusableConsent.id,
          payment_url: `${links[term]}?${params.toString()}`,
          reused: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rateLimitSince = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
    const { count: recentEmailCount, error: emailRateError } = await supabase
      .from("wavacademy_consents")
      .select("id", { count: "exact", head: true })
      .eq("email", cleanEmail)
      .gte("accepted_at", rateLimitSince);
    if (emailRateError) {
      throw new Error(`Contrôle de fréquence impossible : ${emailRateError.message}`);
    }
    if ((recentEmailCount ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives récentes. Réessaie plus tard." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (technicalFingerprintHash) {
      const { count: recentFingerprintCount, error: fingerprintRateError } = await supabase
        .from("wavacademy_consents")
        .select("id", { count: "exact", head: true })
        .eq("technical_fingerprint_hash", technicalFingerprintHash)
        .gte("accepted_at", rateLimitSince);
      if (fingerprintRateError) {
        throw new Error(`Contrôle de fréquence impossible : ${fingerprintRateError.message}`);
      }
      if ((recentFingerprintCount ?? 0) >= 10) {
        return new Response(
          JSON.stringify({ error: "Trop de tentatives récentes. Réessaie plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data, error } = await supabase
      .from("wavacademy_consents")
      .insert({
        email: cleanEmail,
        plan_type: "live", // accès identique pour toutes les formules
        access_months: accessMonths,
        consent_cgv: true,
        consent_renonciation: true,
        cgv_version: cgvVersion,
        accepted_at: new Date().toISOString(),
        cgv_accepted_text: CGV_ACCEPTED_TEXT,
        immediate_delivery_notice_version: IMMEDIATE_DELIVERY_NOTICE_VERSION,
        immediate_delivery_accepted_text: IMMEDIATE_DELIVERY_ACCEPTED_TEXT,
        technical_fingerprint_hash: technicalFingerprintHash,
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
      prefilled_email: cleanEmail,
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
