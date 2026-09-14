import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { normalizeTikTokUsername } from "../_shared/tiktok-username.ts";
import { launchExpressJob } from "../_shared/express-launch.ts";
import type { ExpressRow } from "../_shared/express-finalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};



serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tiktok_username } = await req.json();
    if (!tiktok_username) {
      throw new Error("tiktok_username requis");
    }

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Accès refusé : admin requis" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forme canonique TikTok (minuscules) : WavStats fait une correspondance
    // exacte sur l'identifiant, une majuscule ferait échouer l'analyse.
    const cleanUsername = normalizeTikTokUsername(tiktok_username);
    if (cleanUsername.length < 2) {
      throw new Error("tiktok_username invalide");
    }

    // Call WavStats API
    // Repli sur l'ancien nom de secret tant que WAVSTATS_API_KEY n'existe pas côté dashboard.
    const apiKey = Deno.env.get("WAVSTATS_API_KEY") ?? Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavStats non configurée");

    // Persist the intent before the partner call so interrupted launches remain visible.
    const launchAt = new Date().toISOString();
    const { data: row, error: insertError } = await supabaseAdmin.from("express_analyses").insert({
      tiktok_username: cleanUsername, stripe_session_id: `manual-${crypto.randomUUID()}`,
      status: "starting", launch_started_at: launchAt, processing_started_at: launchAt,
      // Manual diagnostics have no paid sample contract when that integration is unverified.
      report_version: Deno.env.get("EXPRESS_SAMPLE_CONTRACT_VERIFIED") === "true" ? "sample-v3" : "legacy",
    }).select("*").single();
    if (insertError || !row) throw new Error("Erreur lors de la création en base");
    const saved = await launchExpressJob(supabaseAdmin, row as ExpressRow, apiKey);
    return new Response(JSON.stringify({ job_id: saved.job_id, analysis_id: saved.id, status: saved.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
