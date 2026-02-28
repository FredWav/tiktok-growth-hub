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
    const { job_id, analysis_id } = await req.json();
    if (!job_id || !analysis_id) {
      throw new Error("job_id et analysis_id requis");
    }

    // Verify admin
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
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check job status on WavSocialScan API
    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const jobRes = await fetch(`${API_BASE}/jobs/${encodeURIComponent(job_id)}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error("Job status check error:", errText);
      return new Response(JSON.stringify({ status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = await jobRes.json();

    if (job.status === "completed" && job.result) {
      const aiInsights = job.result?.account?.ai_insights;
      const missingAi = !aiInsights || (typeof aiInsights === "string" && aiInsights.trim() === "");
      const healthScore = job.result?.health_score ?? job.result?.score ?? null;

      await supabaseAdmin.from("express_analyses").update({
        status: "complete",
        health_score: typeof healthScore === "number" ? healthScore : null,
        result_data: job.result,
        completed_at: new Date().toISOString(),
        error_message: missingAi ? "Analyse IA (ai_insights) absente" : null,
      }).eq("id", analysis_id);

      return new Response(JSON.stringify({ status: "complete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status === "failed") {
      await supabaseAdmin.from("express_analyses").update({
        status: "failed",
        error_message: job.error || "L'analyse a échoué",
        completed_at: new Date().toISOString(),
      }).eq("id", analysis_id);

      return new Response(JSON.stringify({ status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      status: "processing",
      progress: job.progress || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
