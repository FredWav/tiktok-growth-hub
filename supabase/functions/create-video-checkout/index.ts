import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { INVALID_VIDEO_URL_MESSAGE, parseTikTokVideoUrl } from "../_shared/tiktok-video-url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Versions conservées avec la preuve d'acceptation. À modifier à chaque changement matériel.
const CGV_VERSION = "2026-10-01";
const IMMEDIATE_DELIVERY_NOTICE_VERSION = "2026-10-01";
const CGV_ACCEPTED_TEXT = "J'ai lu et j'accepte les Conditions Générales de Vente.";
const IMMEDIATE_DELIVERY_ACCEPTED_TEXT = "Je demande expressément l'exécution immédiate de l'Analyse Vidéo avant la fin du délai de 14 jours et je reconnais perdre mon droit de rétractation lorsque la prestation est pleinement exécutée et le rapport mis à disposition.";

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`fredwav-consent-fingerprint-v1|${ipAddress}|${userAgent}`));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lien court (vm.tiktok.com, /t/…) -> lien complet, en suivant au plus 3 redirections. */
async function resolveShortLink(url: string) {
  let current = url;
  for (let hop = 0; hop < 3; hop++) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FredWav/1.0)" },
      signal: AbortSignal.timeout(5_000),
    });
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (!location) break;
    current = new URL(location, current).toString();
    const parsed = parseTikTokVideoUrl(current);
    if (parsed.kind !== "short") return parsed;
  }
  return parseTikTokVideoUrl(current);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    const { tiktokUrl, email, consent_cgv, consent_immediate_delivery, mode } = (await req.json()) ?? {};
    const checkoutMode = mode === "test" ? "test" : "live";
    const paymentLink = Deno.env.get(checkoutMode === "test" ? "STRIPE_VIDEO_PAYMENT_LINK_TEST" : "STRIPE_VIDEO_PAYMENT_LINK_LIVE") || "";
    if (!paymentLink) return jsonResponse({ error: "Paiement momentanément indisponible." }, 503);

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return jsonResponse({ error: "Adresse e-mail invalide" }, 400);
    }
    if (consent_cgv !== true || consent_immediate_delivery !== true) {
      return jsonResponse({ error: "L'acceptation des CGV et la demande d'exécution immédiate sont obligatoires" }, 400);
    }

    let video = parseTikTokVideoUrl(tiktokUrl);
    if (video.kind === "short") {
      try {
        video = await resolveShortLink(video.url);
      } catch (err) {
        console.warn("[video-analysis] short link resolution failed", err instanceof Error ? err.message : err);
        video = { kind: "invalid", reason: "" };
      }
      if (video.kind !== "video") {
        return jsonResponse({
          error: "Ce lien court n'a pas pu être vérifié. Ouvre la vidéo dans ton navigateur et colle le lien complet (…tiktok.com/@compte/video/…).",
          code: "short_link_unresolved",
        }, 400);
      }
    }
    if (video.kind !== "video") {
      return jsonResponse({ error: video.reason || INVALID_VIDEO_URL_MESSAGE, code: "invalid_tiktok_video_url" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Configuration Supabase manquante");
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Même vidéo, même adresse, déjà payée dans les 24 h : on évite un second paiement.
    const paidSince = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
    const { data: recentPaid, error: recentPaidError } = await supabase.from("video_analyses")
      .select("id").eq("email", cleanEmail).eq("video_id", video.videoId).eq("checkout_mode", checkoutMode)
      .gte("paid_at", paidSince).limit(1).maybeSingle();
    if (recentPaidError) throw new Error(`Vérification du paiement précédent impossible : ${recentPaidError.message}`);
    if (recentPaid) {
      return jsonResponse({
        error: "Cette vidéo a déjà été analysée pour cette adresse au cours des dernières 24 heures. Ton rapport t'a été envoyé par e-mail : vérifie aussi tes spams.",
        code: "duplicate_paid_analysis",
      }, 409);
    }

    const params = (id: string) => new URLSearchParams({ client_reference_id: id, prefilled_email: cleanEmail }).toString();

    // Double clic / retour arrière : on réutilise l'intention non payée des 15 dernières minutes.
    const reusableSince = new Date(Date.now() - 15 * 60 * 1_000).toISOString();
    const { data: reusable } = await supabase.from("video_analyses")
      .select("id").eq("email", cleanEmail).eq("video_id", video.videoId).eq("checkout_mode", checkoutMode)
      .eq("status", "awaiting_payment").is("stripe_session_id", null).gte("created_at", reusableSince)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (reusable) return jsonResponse({ url: `${paymentLink}?${params(reusable.id)}`, reused: true });

    const rateLimitSince = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
    const { count: recentEmailCount } = await supabase.from("video_analyses")
      .select("id", { count: "exact", head: true }).eq("email", cleanEmail).gte("created_at", rateLimitSince);
    if ((recentEmailCount ?? 0) >= 10) return jsonResponse({ error: "Trop de tentatives récentes. Réessaie plus tard." }, 429);

    const fingerprint = await getTechnicalFingerprint(req, Deno.env.get("CONSENT_FINGERPRINT_KEY") || serviceRoleKey);
    if (fingerprint) {
      const { count } = await supabase.from("video_analyses")
        .select("id", { count: "exact", head: true }).eq("technical_fingerprint_hash", fingerprint).gte("created_at", rateLimitSince);
      if ((count ?? 0) >= 20) return jsonResponse({ error: "Trop de tentatives récentes. Réessaie plus tard." }, 429);
    }

    const { data: order, error: orderError } = await supabase.from("video_analyses").insert({
      email: cleanEmail,
      tiktok_url: video.url,
      video_id: video.videoId,
      status: "awaiting_payment",
      checkout_mode: checkoutMode,
      cgv_version: CGV_VERSION,
      immediate_delivery_notice_version: IMMEDIATE_DELIVERY_NOTICE_VERSION,
      cgv_accepted_text: CGV_ACCEPTED_TEXT,
      immediate_delivery_accepted_text: IMMEDIATE_DELIVERY_ACCEPTED_TEXT,
      accepted_at: new Date().toISOString(),
      technical_fingerprint_hash: fingerprint,
    }).select("id").single();
    if (orderError || !order) throw new Error(`Impossible d'enregistrer la commande : ${orderError?.message ?? "inconnu"}`);

    console.log(`[video-analysis] order=${order.id} status=awaiting_payment mode=${checkoutMode} checkout created`);
    return jsonResponse({ url: `${paymentLink}?${params(order.id)}` });
  } catch (error) {
    console.error("[video-analysis] create-video-checkout error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Une erreur est survenue. Réessaie dans un instant." }, 500);
  }
});
