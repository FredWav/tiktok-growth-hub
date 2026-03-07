import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import nodemailer from "npm:nodemailer@6.9.16";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";
import { upsertProspect } from "../_shared/upsert-prospect.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway";
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

async function notifyDiscordMissingAI(username: string, sessionId: string) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "⚠️ Analyse IA manquante",
            color: 0xff9800,
            fields: [
              { name: "Username TikTok", value: `@${username}`, inline: true },
              { name: "Session ID", value: sessionId, inline: false },
            ],
            description:
              "L'analyse express est terminée mais les insights IA (ai_insights) sont absents. Action requise.",
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.warn("Discord notification failed:", err);
  }
}

function getSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
}

async function sendResultEmail(email: string, username: string, sessionId: string) {
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
  if (!SMTP_PASSWORD || !email) return;

  try {
    const reportUrl = `https://fredwav.com/analyse-express/result?session_id=${sessionId}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f5f0e8;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c8a97e;">
          <h1 style="color: #c8a97e; margin: 0; font-size: 24px;">Ton Analyse Express est prête 🎉</h1>
        </div>
        <div style="padding: 30px 0;">
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.6;">
            Salut ! L'analyse de ton compte <strong style="color: #c8a97e;">@${username}</strong> est terminée.
          </p>
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.6;">
            Clique sur le bouton ci-dessous pour consulter ton rapport complet et télécharger ton PDF.
          </p>
          <div style="text-align: center; padding: 30px 0;">
            <a href="${reportUrl}" style="background: #c8a97e; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Voir mon rapport
            </a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            Si le bouton ne fonctionne pas, copie ce lien : <a href="${reportUrl}" style="color: #c8a97e;">${reportUrl}</a>
          </p>
        </div>
        <div style="border-top: 1px solid #333; padding-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px;">FredWav - Coaching TikTok</p>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: "ssl0.ovh.net",
      port: 465,
      secure: true,
      auth: { user: "noreply@fredwav.com", pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: "FredWav <noreply@fredwav.com>",
      to: email,
      subject: `📊 Ton Analyse Express @${username} est prête !`,
      html: htmlBody,
    });

    console.log(`Result email sent to ${email} for @${username}`);
  } catch (err) {
    console.error("Failed to send result email:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, job_id } = await req.json();
    if (!session_id) throw new Error("session_id manquant");
    if (!job_id) throw new Error("job_id manquant");

    const stripe = new Stripe(getStripeSecretKey(), { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") throw new Error("Paiement non confirmé");

    const username = session.metadata?.tiktok_username;
    if (!username) throw new Error("Username TikTok introuvable dans la session");

    const apiKey = Deno.env.get("WAV_SOCIAL_SCAN_API_KEY");
    if (!apiKey) throw new Error("Clé API WavSocialScan non configurée");

    const jobRes = await fetch(`${API_BASE}/jobs/${encodeURIComponent(job_id)}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error("Job status check error:", errText);
      return new Response(JSON.stringify({ status: "processing", username, progress: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const job = await jobRes.json();
    const supabase = getSupabase();

    console.log(job);

    if (job.status === "completed" && job.result) {
      const aiInsights = job.result?.account?.ai_insights;
      const missingAiInsights = !aiInsights || (typeof aiInsights === "string" && aiInsights.trim() === "");

      // Get email from express_analyses record
      let customerEmail: string | null = null;
      try {
        const { data: analysisRow } = await supabase
          .from("express_analyses")
          .select("email")
          .eq("job_id", job_id)
          .maybeSingle();
        customerEmail = analysisRow?.email || null;
      } catch (e) {
        console.warn("Failed to fetch email from express_analyses:", e);
      }

      try {
        const hs = job.result?.health_score ?? job.result?.account?.health_score;
        const healthScore = typeof hs === "object" && hs !== null ? hs.total : typeof hs === "number" ? hs : null;
        await supabase
          .from("express_analyses")
          .update({
            status: "complete",
            health_score: typeof healthScore === "number" ? healthScore : null,
            result_data: job.result,
            completed_at: new Date().toISOString(),
            ...(missingAiInsights ? { error_message: "Analyse IA (ai_insights) absente du résultat" } : {}),
          })
          .eq("job_id", job_id);
      } catch (dbErr) {
        console.warn("Failed to update express_analyses:", dbErr);
      }

      if (missingAiInsights) {
        await notifyDiscordMissingAI(username, session_id);
        await notifyError("Analyse Status", `AI insights manquants • @${username}`);
      } else {
        await notifySuccess("Analyse Terminée", `@${username} • score ${job.result?.health_score ?? "N/A"}`);
      }

      // Send result email
      if (customerEmail) {
        await sendResultEmail(customerEmail, username, session_id);
      }

      // Upsert prospect in CRM
      if (customerEmail) {
        try {
          await upsertProspect({
            email: customerEmail,
            tiktok: username,
            offer: "one_shot",
            origin_source: "analyse_express",
          });
        } catch (e) {
          console.warn("Failed to upsert prospect:", e);
        }
      }

      return new Response(
        JSON.stringify({
          status: "complete",
          data: job.result,
          username,
          missing_ai_insights: missingAiInsights,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    if (job.status === "failed") {
      try {
        await supabase
          .from("express_analyses")
          .update({
            status: "failed",
            error_message: job.error || "L'analyse a échoué",
            completed_at: new Date().toISOString(),
          })
          .eq("job_id", job_id);
      } catch (dbErr) {
        console.warn("Failed to update express_analyses:", dbErr);
      }

      await notifyError("Analyse Échouée", `@${username} • ${job.error || "Erreur inconnue"}`);

      return new Response(
        JSON.stringify({
          status: "failed",
          error: job.error || "L'analyse a échoué",
          username,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        status: "processing",
        progress: job.progress || 0,
        current_step: job.current_step || null,
        username,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    await notifyError("Analyse Status", `${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
