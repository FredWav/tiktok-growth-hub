import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import nodemailer from "https://esm.sh/nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

const TIMEOUT_MINUTES = 30;

async function notifyDiscordMissingAI(username: string, sessionId: string) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "⚠️ Analyse IA manquante (reconcile)",
          color: 0xff9800,
          fields: [
            { name: "Username", value: `@${username}`, inline: true },
            { name: "Session ID", value: sessionId, inline: false },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (err) {
    console.warn("Discord notification failed:", err);
  }
}

async function sendResultEmail(email: string, username: string, sessionId: string) {
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
  if (!SMTP_PASSWORD || !email) return;
  try {
    const reportUrl = `https://fredwav.com/analyse-express/result?session_id=${sessionId}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#f5f0e8">
      <h1 style="color:#c8a97e">Ton Analyse Express est prête</h1>
      <p>L'analyse de <strong style="color:#c8a97e">@${username}</strong> est terminée.</p>
      <p style="text-align:center;padding:20px 0">
        <a href="${reportUrl}" style="background:#c8a97e;color:#0a0a0a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Voir mon rapport</a>
      </p>
      <p style="color:#999;font-size:12px">Lien direct : ${reportUrl}</p>
    </div>`;
    const transporter = nodemailer.createTransport({
      host: "ssl0.ovh.net", port: 465, secure: true,
      auth: { user: "noreply@fredwav.com", pass: SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: "FredWav <noreply@fredwav.com>",
      to: email,
      subject: `📊 Ton Analyse Express @${username} est prête !`,
      html,
    });
  } catch (err) {
    console.error("sendResultEmail failed:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  );
  const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = { checked: 0, completed: 0, failed: 0, timed_out: 0, still_processing: 0, errors: 0 };

  try {
    // Fetch all processing analyses
    const { data: stuck, error } = await supabase
      .from("express_analyses")
      .select("id, job_id, tiktok_username, stripe_session_id, email, created_at")
      .eq("status", "processing")
      .order("created_at", { ascending: true });

    if (error) throw error;

    summary.checked = stuck?.length || 0;
    const now = Date.now();
    const timeoutMs = TIMEOUT_MINUTES * 60 * 1000;

    for (const row of stuck || []) {
      try {
        const ageMs = now - new Date(row.created_at).getTime();

        // No job_id: timeout immediately if old enough
        if (!row.job_id) {
          if (ageMs > timeoutMs) {
            await supabase.from("express_analyses").update({
              status: "failed",
              error_message: `Timeout (${TIMEOUT_MINUTES}min) - aucun job_id`,
              completed_at: new Date().toISOString(),
            }).eq("id", row.id);
            summary.timed_out++;
          } else {
            summary.still_processing++;
          }
          continue;
        }

        // Poll job status from API
        const jobRes = await fetch(`${API_BASE}/jobs/${encodeURIComponent(row.job_id)}`, {
          headers: { "X-API-Key": apiKey },
        });

        if (!jobRes.ok) {
          if (ageMs > timeoutMs) {
            await supabase.from("express_analyses").update({
              status: "failed",
              error_message: `Timeout (${TIMEOUT_MINUTES}min) - API ${jobRes.status}`,
              completed_at: new Date().toISOString(),
            }).eq("id", row.id);
            summary.timed_out++;
          } else {
            summary.still_processing++;
          }
          continue;
        }

        const job = await jobRes.json();

        if (job.status === "completed" && job.result) {
          const aiInsights = job.result?.account?.ai_insights;
          const missingAi = !aiInsights || (typeof aiInsights === "string" && aiInsights.trim() === "");
          const hs = job.result?.health_score ?? job.result?.account?.health_score;
          const healthScore = typeof hs === "object" && hs !== null ? hs.total : typeof hs === "number" ? hs : null;

          await supabase.from("express_analyses").update({
            status: "complete",
            health_score: typeof healthScore === "number" ? healthScore : null,
            result_data: job.result,
            completed_at: new Date().toISOString(),
            ...(missingAi ? { error_message: "Analyse IA (ai_insights) absente du résultat" } : {}),
          }).eq("id", row.id);

          if (missingAi) {
            await notifyDiscordMissingAI(row.tiktok_username, row.stripe_session_id);
            await notifyError("Reconcile", `AI manquants @${row.tiktok_username}`);
          } else {
            await notifySuccess("Reconcile OK", `@${row.tiktok_username} • ${healthScore ?? "N/A"}`);
          }

          if (row.email) {
            await sendResultEmail(row.email, row.tiktok_username, row.stripe_session_id);
          }
          summary.completed++;
        } else if (job.status === "failed") {
          await supabase.from("express_analyses").update({
            status: "failed",
            error_message: job.error || "L'analyse a échoué",
            completed_at: new Date().toISOString(),
          }).eq("id", row.id);
          await notifyError("Reconcile failed", `@${row.tiktok_username} • ${job.error || "?"}`);
          summary.failed++;
        } else {
          // Still processing
          if (ageMs > timeoutMs) {
            await supabase.from("express_analyses").update({
              status: "failed",
              error_message: `Timeout (${TIMEOUT_MINUTES}min) - job toujours ${job.status}`,
              completed_at: new Date().toISOString(),
            }).eq("id", row.id);
            await notifyError("Reconcile timeout", `@${row.tiktok_username}`);
            summary.timed_out++;
          } else {
            summary.still_processing++;
          }
        }
      } catch (e) {
        console.error(`Error processing ${row.id}:`, e);
        summary.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    await notifyError("Reconcile fatal", e.message);
    return new Response(JSON.stringify({ error: e.message, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});