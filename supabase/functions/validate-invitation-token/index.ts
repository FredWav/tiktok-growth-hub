// Public read-only endpoint to validate a Wav Premium invitation token
// and return the prefill data needed to render /checkout/wav-premium.
//
// Returns:
//   200 { valid: true, prefill: {...}, amount_cents, currency, expires_at }
//   200 { valid: false, reason: 'not_found' | 'expired' | 'used' }
//
// We never 4xx for invalid tokens so the page can show a friendly
// message instead of triggering generic error toasts.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let token = "";
    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { token?: string };
      token = (body.token ?? "").trim();
    } else {
      const url = new URL(req.url);
      token = (url.searchParams.get("token") ?? "").trim();
    }

    if (!token) {
      return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: invitation } = await admin
      .from("wav_premium_invitations")
      .select(
        "id, amount_cents, currency, expires_at, used_at, prefill_email, prefill_first_name, prefill_last_name"
      )
      .eq("token", token)
      .maybeSingle();

    if (!invitation) {
      return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invitation.used_at) {
      return new Response(JSON.stringify({ valid: false, reason: "used" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ valid: false, reason: "expired" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        valid: true,
        amount_cents: invitation.amount_cents,
        currency: invitation.currency,
        expires_at: invitation.expires_at,
        prefill: {
          email: invitation.prefill_email,
          first_name: invitation.prefill_first_name,
          last_name: invitation.prefill_last_name,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[validate-invitation-token] error:", err);
    return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
