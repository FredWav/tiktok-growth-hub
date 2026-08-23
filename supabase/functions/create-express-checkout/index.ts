import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { normalizeTikTokUsername } from "../_shared/tiktok-username.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Liens Stripe séparés : la preview doit fournir le lien sandbox par secret.
const LIVE_PAYMENT_LINK = Deno.env.get("STRIPE_EXPRESS_PAYMENT_LINK_LIVE") ||
  "https://buy.stripe.com/bJe3cu4WU4uZ8z81DacMM0y";
// Versions conservées avec la preuve d'acceptation. À modifier à chaque changement matériel.
const CGV_VERSION = "2026-08-11";
const IMMEDIATE_DELIVERY_NOTICE_VERSION = "2026-08-11";
const CGV_ACCEPTED_TEXT = "J'ai lu et j'accepte les Conditions Générales de Vente.";
const IMMEDIATE_DELIVERY_ACCEPTED_TEXT = "Je demande expressément l'exécution immédiate de l'Analyse Express avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.";

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
    encoder.encode(`fredwav-consent-fingerprint-v1|${ipAddress}|${userAgent}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const body = await req.json();
    const {
      username,
      email,
      subscribeToNewsletter,
      consent_cgv,
      consent_immediate_delivery,
      mode,
    } = body ?? {};
    const checkoutMode = mode === "test" ? "test" : "live";
    const paymentLink = checkoutMode === "test"
      ? Deno.env.get("STRIPE_EXPRESS_PAYMENT_LINK_TEST") || ""
      : LIVE_PAYMENT_LINK;
    if (!paymentLink) {
      return jsonResponse({ error: "Lien de paiement test non configuré" }, 503);
    }

    // Le pseudo est ramené à sa forme canonique TikTok (minuscules) avant toute
    // validation, tout stockage et tout appel WavStats.
    const cleanUsername = normalizeTikTokUsername(username);
    if (cleanUsername.length < 2) {
      return jsonResponse({ error: "Nom d'utilisateur TikTok invalide" }, 400);
    }

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return jsonResponse({ error: "Adresse email invalide" }, 400);
    }

    if (consent_cgv !== true || consent_immediate_delivery !== true) {
      return jsonResponse(
        { error: "L'acceptation des CGV et la demande d'exécution immédiate sont obligatoires" },
        400,
      );
    }

    const wantsNewsletter = subscribeToNewsletter === true || subscribeToNewsletter === "true";
    const acceptedAt = new Date().toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuration Supabase manquante");
    }
    const fingerprintKey = Deno.env.get("CONSENT_FINGERPRINT_KEY") || serviceRoleKey;
    const technicalFingerprintHash = await getTechnicalFingerprint(req, fingerprintKey);

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } },
    );

    const reusableSince = new Date(Date.now() - 15 * 60 * 1_000).toISOString();
    const { data: reusableConsent } = await supabase
      .from("express_purchase_consents")
      .select("id, express_analysis_id")
      .eq("email", cleanEmail)
      .eq("tiktok_username", cleanUsername)
      .eq("checkout_mode", checkoutMode)
      .is("stripe_session_id", null)
      .gte("accepted_at", reusableSince)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusableConsent) {
      if (wantsNewsletter) {
        await supabase
          .from("express_analyses")
          .update({ newsletter_requested: true })
          .eq("id", reusableConsent.express_analysis_id);
      }
      const params = new URLSearchParams({
        client_reference_id: reusableConsent.express_analysis_id,
        prefilled_email: cleanEmail,
      });
      return jsonResponse({
        url: `${paymentLink}?${params.toString()}`,
        consent_id: reusableConsent.id,
        reused: true,
      });
    }

    const rateLimitSince = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
    const { count: recentEmailCount } = await supabase
      .from("express_purchase_consents")
      .select("id", { count: "exact", head: true })
      .eq("email", cleanEmail)
      .gte("accepted_at", rateLimitSince);
    if ((recentEmailCount ?? 0) >= 5) {
      return jsonResponse({ error: "Trop de tentatives récentes. Réessayez plus tard." }, 429);
    }

    if (technicalFingerprintHash) {
      const { count: recentFingerprintCount } = await supabase
        .from("express_purchase_consents")
        .select("id", { count: "exact", head: true })
        .eq("technical_fingerprint_hash", technicalFingerprintHash)
        .gte("accepted_at", rateLimitSince);
      if ((recentFingerprintCount ?? 0) >= 10) {
        return jsonResponse({ error: "Trop de tentatives récentes. Réessayez plus tard." }, 429);
      }
    }

    // L'identifiant de cette intention devient le client_reference_id Stripe.
    const { data: analysis, error: analysisError } = await supabase
      .from("express_analyses")
      .insert({
        tiktok_username: cleanUsername,
        email: cleanEmail,
        newsletter_requested: wantsNewsletter,
        status: "awaiting_payment",
      })
      .select("id")
      .single();

    if (analysisError || !analysis) {
      throw new Error(`Impossible d'enregistrer l'intention : ${analysisError?.message ?? "inconnu"}`);
    }

    // Journal de preuve séparé : texte accepté, horodatage serveur et contexte technique.
    const { data: consent, error: consentError } = await supabase
      .from("express_purchase_consents")
      .insert({
        express_analysis_id: analysis.id,
        email: cleanEmail,
        tiktok_username: cleanUsername,
        consent_cgv: true,
        consent_immediate_delivery: true,
        cgv_version: CGV_VERSION,
        immediate_delivery_notice_version: IMMEDIATE_DELIVERY_NOTICE_VERSION,
        cgv_accepted_text: CGV_ACCEPTED_TEXT,
        immediate_delivery_accepted_text: IMMEDIATE_DELIVERY_ACCEPTED_TEXT,
        checkout_mode: checkoutMode,
        accepted_at: acceptedAt,
        technical_fingerprint_hash: technicalFingerprintHash,
      })
      .select("id")
      .single();

    if (consentError || !consent) {
      // Évite de conserver une intention inutilisable si la preuve obligatoire échoue.
      await supabase.from("express_analyses").delete().eq("id", analysis.id);
      throw new Error(`Impossible d'enregistrer les consentements : ${consentError?.message ?? "inconnu"}`);
    }

    const params = new URLSearchParams({
      client_reference_id: analysis.id,
      prefilled_email: cleanEmail,
    });

    return jsonResponse({
      url: `${paymentLink}?${params.toString()}`,
      consent_id: consent.id,
    });
  } catch (error) {
    console.error("create-express-checkout error:", error);
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
});
