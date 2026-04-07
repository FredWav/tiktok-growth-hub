import nodemailer from "npm:nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { first_name, last_name, email, tiktok_username, current_level, blockers, goals, budget, origin_source, follower_since, conversion_trigger, posthog_id } =
      await req.json();

    if (!first_name || !last_name || !email) {
      await notifyError("Candidature", "Champs obligatoires manquants");
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Discord webhook ──
    const payload = {
      content: "<@967099537439227965> <@826133033069051954>📋 **Nouvelle candidature Wav Premium !**",
      embeds: [{
        title: `${first_name} ${last_name}`,
        color: 0xc8a97e,
        fields: [
          { name: "📧 Email", value: email, inline: true },
          { name: "🎵 TikTok", value: tiktok_username || "-", inline: true },
          { name: "📊 Niveau", value: current_level || "-", inline: true },
          { name: "💰 Budget", value: budget || "-", inline: true },
          { name: "📍 Source", value: origin_source || "-", inline: true },
          { name: "⏳ Follower depuis", value: follower_since || "-", inline: true },
          { name: "🔥 Déclencheur", value: conversion_trigger || "-", inline: true },
          { name: "📊 PostHog", value: posthog_id ? `[Voir](https://us.posthog.com/person/${posthog_id})` : "-", inline: true },
          { name: "🚧 Blockers", value: (blockers || "-").slice(0, 1024) },
          { name: "🎯 Objectifs", value: (goals || "-").slice(0, 1024) },
        ],
        timestamp: new Date().toISOString(),
      }],
    };

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Discord webhook error:", res.status, text);
      await notifyError("Candidature Discord", `Webhook échoué (${res.status}) • ${first_name} ${last_name}`);
    } else {
      console.log(`Discord notification sent for ${first_name} ${last_name}`);
    }

    // ── 2. SMTP email to admin ──
    try {
      const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
      if (SMTP_PASSWORD) {
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
              📋 Nouvelle candidature Wav Premium
            </h1>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 160px;">Nom</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(first_name)} ${escapeHtml(last_name)}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td><td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">TikTok</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(tiktok_username || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Niveau</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(current_level || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Budget</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(budget || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Blocages</td><td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(blockers || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Objectifs</td><td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(goals || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Source</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(origin_source || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Follower depuis</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(follower_since || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Déclencheur</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(conversion_trigger || "-")}</td></tr>
            </table>
          </div>`;

        const transporter = nodemailer.createTransport({
          host: "ssl0.ovh.net", port: 465, secure: true,
          auth: { user: "noreply@fredwav.com", pass: SMTP_PASSWORD },
        });

        // Email to admin
        await transporter.sendMail({
          from: "noreply@fredwav.com",
          to: "fredwavcm@gmail.com",
          subject: `📋 Nouvelle candidature Wav Premium - ${first_name} ${last_name}`.trim(),
          html: adminHtml,
        });
        console.log("Admin email sent for", first_name, last_name);

        // Email to candidate
        const candidateHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
              Merci pour ta candidature, ${escapeHtml(first_name)} !
            </h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Ta candidature au <strong>Wav Premium</strong> a bien été reçue.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              La prochaine étape : <strong>réserve ton appel de qualification</strong> pour qu'on échange sur ta situation et qu'on valide ensemble si l'accompagnement est adapté à tes objectifs.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://calendly.com/fredwavcm/wav-premium" style="display: inline-block; background-color: #c8a97e; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Réserver mon appel de qualification
              </a>
            </div>
            <p style="color: #888; font-size: 14px; line-height: 1.5;">
              Si tu as des questions d'ici là, réponds directement à cet email ou contacte-moi sur <a href="https://www.tiktok.com/@fredwav" style="color: #c8a97e;">TikTok</a>.
            </p>
            <p style="color: #555; font-size: 16px; margin-top: 20px;">
              À très vite,<br/>
              <strong>Fred Wav</strong>
            </p>
          </div>`;

        await transporter.sendMail({
          from: "noreply@fredwav.com",
          replyTo: "fredwavcm@gmail.com",
          to: email,
          subject: `${first_name}, ta candidature Wav Premium est bien reçue !`,
          html: candidateHtml,
        });
        console.log("Candidate email sent to", email);
      } else {
        console.warn("SMTP_PASSWORD not configured, skipping emails");
      }
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      await notifyError("Candidature Email", `Exception • ${first_name} ${last_name}`);
    }

    await notifySuccess("Candidature", `${first_name} ${last_name} • ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    await notifyError("Candidature", `Erreur: ${error.message}`);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
