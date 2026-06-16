import nodemailer from "npm:nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL") ?? "";

const ALLOWED_ORIGINS = new Set([
  "https://fredwav.com",
  "https://www.fredwav.com",
  "https://fredwav.lovable.app",
]);

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254;
}
function clamp(s: unknown, max: number): string {
  return (typeof s === "string" ? s : "").slice(0, max);
}

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

  // Basic anti-abuse: require a known browser Origin so the function isn't a generic email relay.
  const origin = req.headers.get("origin") ?? "";
  if (origin && !ALLOWED_ORIGINS.has(origin) && !origin.endsWith(".lovable.app")) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json();
    const first_name = clamp(raw.first_name, 80);
    const last_name = clamp(raw.last_name, 80);
    const email = clamp(raw.email, 254).trim();
    const tiktok_username = clamp(raw.tiktok_username, 80);
    const profil = clamp(raw.profil, 200);
    const motivation = clamp(raw.motivation, 200);
    const accompagnement_type = clamp(raw.accompagnement_type, 200);
    const accompagnement_critere = clamp(raw.accompagnement_critere, 200);
    const goals = clamp(raw.goals, 2000);
    const budget = clamp(raw.budget, 80);
    const origin_source = clamp(raw.origin_source, 200);
    const follower_since = clamp(raw.follower_since, 80);
    const conversion_trigger = clamp(raw.conversion_trigger, 1000);
    const posthog_id = clamp(raw.posthog_id, 200);

    if (!first_name || !last_name || !email || !profil || !motivation || !accompagnement_type || !goals) {
      await notifyError("Demande de contact", "Champs obligatoires manquants");
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Discord webhook ──
    const payload = {
      content: "<@967099537439227965> <@826133033069051954>📋 **Nouvelle demande de contact !**",
      embeds: [{
        title: `${first_name} ${last_name}`,
        color: 0xc8a97e,
        fields: [
          { name: "📧 Email", value: email, inline: true },
          { name: "🎵 TikTok", value: tiktok_username || "-", inline: true },
          { name: "💰 Budget", value: budget || "-", inline: true },
          { name: "👤 Profil", value: profil || "-" },
          { name: "🎯 Attente", value: motivation || "-" },
          { name: "🤝 Accompagnement", value: accompagnement_type || "-" },
          { name: "⭐ Ce qui compte", value: accompagnement_critere || "-" },
          { name: "📝 Ce qui l'amène", value: (goals || "-").slice(0, 1024) },
          { name: "🔥 Contenu déclencheur", value: (conversion_trigger || "-").slice(0, 1024) },
          { name: "📍 Source", value: origin_source || "-", inline: true },
          { name: "⏳ Follower depuis", value: follower_since || "-", inline: true },
          { name: "📊 PostHog", value: posthog_id ? `[Voir](https://us.posthog.com/person/${posthog_id})` : "-", inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    };

    if (DISCORD_WEBHOOK_URL) {
      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Discord webhook error:", res.status, text);
        await notifyError("Demande de contact Discord", `Webhook échoué (${res.status}) • ${first_name} ${last_name}`);
      } else {
        console.log(`Discord notification sent for ${first_name} ${last_name}`);
      }
    } else {
      console.warn("DISCORD_WEBHOOK_URL not configured");
    }

    // ── 2. SMTP email to admin ──
    try {
      const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
      if (SMTP_PASSWORD) {
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
              📋 Nouvelle demande de contact
            </h1>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 160px;">Nom</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(first_name)} ${escapeHtml(last_name)}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td><td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">TikTok</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(tiktok_username || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Profil</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(profil || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Attente</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(motivation || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Accompagnement</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(accompagnement_type || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Ce qui compte</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(accompagnement_critere || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Budget</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(budget || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Ce qui l'amène</td><td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(goals || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Source</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(origin_source || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Follower depuis</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(follower_since || "-")}</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Contenu déclencheur</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(conversion_trigger || "-")}</td></tr>
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
          subject: `📋 Nouvelle demande de contact - ${first_name} ${last_name}`.trim(),
          html: adminHtml,
        });
        console.log("Admin email sent for", first_name, last_name);

        // Email to candidate
        const candidateHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
              Merci pour ta demande, ${escapeHtml(first_name)} !
            </h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Ta demande de contact a bien été reçue. Je prends le temps de la lire en détail.
            </p>
            <div style="background-color: #faf7f2; border-left: 4px solid #c8a97e; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
                <strong>Prochaine étape&nbsp;:</strong> je te recontacte personnellement par email sous <strong>48h (jours ouvrés)</strong> à cette adresse.
              </p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              En attendant, pense à vérifier tes spams au cas où ma réponse atterrirait là-bas. Si tu as des questions entre-temps, tu peux répondre directement à cet email.
            </p>
            <p style="color: #555; font-size: 16px; margin-top: 24px;">
              À très vite,<br/>
              <strong>Fred Wav</strong>
            </p>
          </div>`;

        await transporter.sendMail({
          from: "noreply@fredwav.com",
          replyTo: "fredwavcm@gmail.com",
          to: email,
          subject: `${first_name}, ta demande est bien reçue !`,
          html: candidateHtml,
        });
        console.log("Candidate email sent to", email);
      } else {
        console.warn("SMTP_PASSWORD not configured, skipping emails");
      }
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      await notifyError("Demande de contact Email", `Exception • ${first_name} ${last_name}`);
    }

    await notifySuccess("Demande de contact", `${first_name} ${last_name} • ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    await notifyError("Demande de contact", `Erreur: ${error.message}`);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
