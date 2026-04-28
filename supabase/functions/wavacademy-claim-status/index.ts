import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LABELS: Record<string, string> = {
  acces: "Wav Academy · Accès",
  live: "Wav Academy · Live",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return new Response(
        JSON.stringify({ status: "invalid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from("wavacademy_claims")
      .select("token, plan_type, expires_at, claimed_at")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(
        JSON.stringify({ status: "invalid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.claimed_at) {
      return new Response(
        JSON.stringify({ status: "claimed", plan_type: data.plan_type, plan_label: PLAN_LABELS[data.plan_type] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ status: "expired", plan_type: data.plan_type, plan_label: PLAN_LABELS[data.plan_type] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "valid", plan_type: data.plan_type, plan_label: PLAN_LABELS[data.plan_type] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("claim-status error:", error);
    return new Response(
      JSON.stringify({ status: "error", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
