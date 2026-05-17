// Admin-only: generate a single-use Wav Premium checkout invitation.
//
// Called from /admin/applications detail view after the admin has
// validated a candidature. Returns a URL like
//   https://fredwav.com/checkout/wav-premium?token=<token>
// which the admin then sends to the customer manually (WhatsApp / email).
//
// Auth: requires the caller's Supabase JWT to belong to a profile with
// role='admin'. Anyone else gets 403.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestPayload {
  application_id?: string | null;
  amount_cents?: number;
  expires_in_days?: number;
  prefill_email?: string;
  prefill_first_name?: string;
  prefill_last_name?: string;
}

const DEFAULT_EXPIRY_DAYS = 14;
const TOKEN_BYTES = 32;

function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  // URL-safe base64
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Validate caller is an admin via their JWT.
    const authHeader = req.headers.get("authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client bound to the user JWT, so RLS applies + auth.uid() works.
    const userClient = createClient(supabaseUrl, jwt, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client to bypass RLS for admin lookup + insert.
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as RequestPayload;

    const amount = Number.isFinite(body.amount_cents) ? Math.trunc(body.amount_cents as number) : 0;
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "amount_cents requis (> 0)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresInDays = Math.max(1, Math.min(60, body.expires_in_days ?? DEFAULT_EXPIRY_DAYS));
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString();

    // If linked to an application, pre-fill identity from it.
    let prefillEmail = body.prefill_email?.trim() || null;
    let prefillFirst = body.prefill_first_name?.trim() || null;
    let prefillLast = body.prefill_last_name?.trim() || null;

    if (body.application_id) {
      const { data: app } = await admin
        .from("wav_premium_applications")
        .select("email, first_name, last_name")
        .eq("id", body.application_id)
        .maybeSingle();
      if (app) {
        prefillEmail ??= app.email ?? null;
        prefillFirst ??= app.first_name ?? null;
        prefillLast ??= app.last_name ?? null;
      }
    }

    // Generate a unique token (retry on the very unlikely collision).
    let token = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      token = generateToken();
      const { data: existing } = await admin
        .from("wav_premium_invitations")
        .select("id")
        .eq("token", token)
        .maybeSingle();
      if (!existing) break;
      token = "";
    }
    if (!token) {
      return new Response(JSON.stringify({ error: "Impossible de générer un token unique" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insertErr } = await admin
      .from("wav_premium_invitations")
      .insert({
        token,
        application_id: body.application_id ?? null,
        amount_cents: amount,
        currency: "EUR",
        prefill_email: prefillEmail,
        prefill_first_name: prefillFirst,
        prefill_last_name: prefillLast,
        created_by: userData.user.id,
        expires_at: expiresAt,
      })
      .select("id, token, expires_at")
      .single();

    if (insertErr || !inserted) {
      console.error("[create-wav-premium-invitation] insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: `Échec création invitation: ${insertErr?.message ?? "inconnu"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: inserted.id,
        token: inserted.token,
        expires_at: inserted.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[create-wav-premium-invitation] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
