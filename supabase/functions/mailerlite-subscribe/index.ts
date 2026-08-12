import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PUBLIC_CONSENT_VERSION = "newsletter-2026-08-11";
const PUBLIC_CONSENT_TEXT = "J'accepte de recevoir le guide et les conseils de Fred Wav par email. Je peux me désinscrire à tout moment.";
const EXPRESS_CONSENT_VERSION = "analyse-express-newsletter-2026-08-11";
const EXPRESS_CONSENT_TEXT = "Je veux aussi recevoir le guide ULTIME des hooks et tous les conseils de Fred.";

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
    encoder.encode(`fredwav-newsletter-fingerprint-v1|${ipAddress}|${userAgent}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { email, firstName, source, sourcePage, consentAccepted } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanFirstName = typeof firstName === "string" ? firstName.trim().slice(0, 100) : "";
    const requestedSource = source === "analyse_express" ? "analyse_express" : "newsletter";
    const cleanSourcePage = typeof sourcePage === "string" ? sourcePage.trim().slice(0, 100) : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const apiKey = Deno.env.get("MAILERLITE_API_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey || !apiKey) {
      throw new Error("Newsletter service is not configured");
    }

    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const isServiceRoleCall = bearer === serviceRoleKey;
    if (requestedSource === "analyse_express" && !isServiceRoleCall) {
      return jsonResponse({ error: "Forbidden source" }, 403);
    }
    if (!isServiceRoleCall && consentAccepted !== true) {
      return jsonResponse({ error: "Marketing consent is required" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const fingerprintKey = Deno.env.get("CONSENT_FINGERPRINT_KEY") || serviceRoleKey;
    const technicalFingerprintHash = await getTechnicalFingerprint(req, fingerprintKey);

    // Le parcours serveur Analyse Express conserve ses retries. La limite ne
    // vise que le formulaire public, afin de freiner les robots sans stocker l'IP.
    if (!isServiceRoleCall) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
      const { count: emailCount } = await supabase
        .from("newsletter_opt_in_requests")
        .select("id", { count: "exact", head: true })
        .eq("email", cleanEmail)
        .gte("requested_at", oneDayAgo);
      if ((emailCount ?? 0) >= 3) {
        return jsonResponse({ error: "Too many recent attempts" }, 429);
      }
      if (technicalFingerprintHash) {
        const { count: fingerprintCount } = await supabase
          .from("newsletter_opt_in_requests")
          .select("id", { count: "exact", head: true })
          .eq("technical_fingerprint_hash", technicalFingerprintHash)
          .gte("requested_at", oneHourAgo);
        if ((fingerprintCount ?? 0) >= 10) {
          return jsonResponse({ error: "Too many recent attempts" }, 429);
        }
      }
    }

    const { data: evidence, error: evidenceError } = await supabase
      .from("newsletter_opt_in_requests")
      .insert({
        email: cleanEmail,
        first_name: cleanFirstName || null,
        source: requestedSource,
        source_page: cleanSourcePage,
        consent_accepted: true,
        consent_version: requestedSource === "analyse_express"
          ? EXPRESS_CONSENT_VERSION
          : PUBLIC_CONSENT_VERSION,
        consent_text: requestedSource === "analyse_express"
          ? EXPRESS_CONSENT_TEXT
          : PUBLIC_CONSENT_TEXT,
        requested_at: new Date().toISOString(),
        technical_fingerprint_hash: technicalFingerprintHash,
      })
      .select("id")
      .single();
    if (evidenceError || !evidence) {
      throw new Error(`Consent evidence could not be stored: ${evidenceError?.message ?? "unknown"}`);
    }

    const defaultGroupId = Deno.env.get("MAILERLITE_DEFAULT_GROUP_ID") ||
      Deno.env.get("MAILERLITE_GROUP_ID") ||
      "183634214919341095";
    const expressGroupId = Deno.env.get("MAILERLITE_EXPRESS_GROUP_ID");
    const groups = Array.from(new Set([
      defaultGroupId,
      ...(requestedSource === "analyse_express" && expressGroupId ? [expressGroupId] : []),
    ]));

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: cleanEmail,
        fields: { name: cleanFirstName },
        groups,
        // MailerLite documente ce statut pour declencher le DOI via l'API.
        // Le reglage "Double opt-in for API and integrations" doit aussi etre actif.
        status: "unconfirmed",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("MailerLite error:", data);
      await supabase
        .from("newsletter_opt_in_requests")
        .update({
          mailerlite_request_status: "failed",
          mailerlite_request_error: data.message || `HTTP ${res.status}`,
        })
        .eq("id", evidence.id);
      return jsonResponse({ error: data.message || "Subscription failed" }, res.status);
    }

    await supabase
      .from("newsletter_opt_in_requests")
      .update({
        mailerlite_request_status: "submitted",
        mailerlite_subscriber_id: data?.data?.id ?? null,
        mailerlite_status: data?.data?.status ?? "unconfirmed",
      })
      .eq("id", evidence.id);

    return jsonResponse({
      success: true,
      pending_confirmation: true,
      source: requestedSource,
    });
  } catch (err) {
    console.error("mailerlite-subscribe error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
