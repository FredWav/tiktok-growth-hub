import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tiktok_username, analysis_id } = await req.json();
    if (!tiktok_username || !analysis_id) {
      throw new Error("tiktok_username et analysis_id requis");
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

    // Check admin role using service role client
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

    // Call WavSocialScan API to re-trigger analysis
    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const analyzeRes = await fetch(
      `${API_BASE}/accounts/${encodeURIComponent(tiktok_username)}/analyze`,
      {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      console.error("Analyze error:", errText);
      throw new Error(`Erreur lors du lancement de l'analyse: ${analyzeRes.status}`);
    }

    const analyzeData = await analyzeRes.json();
    const jobId = analyzeData.job_id;
    if (!jobId) throw new Error("job_id non retourné par l'API");

    // Update the express_analyses record
    const { error: updateError } = await supabaseAdmin
      .from("express_analyses")
      .update({
        status: "processing",
        job_id: jobId,
        error_message: null,
        result_data: null,
        health_score: null,
        completed_at: null,
      })
      .eq("id", analysis_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error("Erreur lors de la mise à jour en base");
    }

    return new Response(
      JSON.stringify({ job_id: jobId, status: "processing" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
