import nodemailer from "npm:nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Débutant — teste encore son positionnement",
  intermediate: "Intermédiaire — publie mais stagne",
  advanced: "Avancé — fait des vues mais ne convertit pas",
  "0-5k": "0-5k abonnés",
  "5k-50k": "5k-50k abonnés",
  "50k+": "50k+ abonnés",
};

const OBJECTIVE_LABELS: Record<string, string> = {
  visibility: "Débloquer la visibilité",
  strategy: "Structurer une stratégie de contenu",
  monetize: "Transformer l'audience en revenus",
  "Visibilité": "Gagner en visibilité",
  "Audience": "Développer mon audience",
  "Monétiser": "Monétiser mon compte",
  "Vendre": "Vendre un produit ou service",
};

const BUDGET_LABELS: Record<string, string> = {
  none: "Pas de budget",
  low: "Moins de 200 €",
  mid: "200 € – 500 €",
  high: "500 € – 1000 € ou plus",
  express: "Analyse Express",
  "0": "0 €",
  "1-200": "1-200 €",
  "200-500": "200-500 €",
  "500+": "500 € +",
};

const OFFER_LABELS: Record<string, string> = {
  discord: "Discord (gratuit)",
  one_shot: "One Shot",
  vip: "VIP",
  wav_premium: "Wav Premium",
  express: "Analyse Express",
  one_shot_plus_premium: "One Shot + Premium",
  premium: "Premium",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { first_name, last_name, email, tiktok, level, objective, blocker, budget, temps, recommended_offer } =
      await req.json();

    if (!first_name) {
      await notifyError("Diagnostic", "Champs obligatoires manquants (first_name)");
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Discord webhook ──
    try {
      const fields = [
        { name: "🎵 TikTok", value: tiktok || "—", inline: true },
        { name: "📊 Niveau", value: LEVEL_LABELS[level] || level || "—", inline: false },
        { name: "🎯 Objectif", value: OBJECTIVE_LABELS[objective] || objective || "—", inline: false },
        { name: "🚧 Blocage", value: (blocker || "—").slice(0, 1024), inline: false },
        { name: "💰 Budget", value: BUDGET_LABELS[budget] || budget || "—", inline: true },
        { name: "⏱️ Temps/semaine", value: temps || "—", inline: true },
        { name: "🏷️ Offre recommandée", value: OFFER_LABELS[recommended_offer] || recommended_offer || "—", inline: true },
      ];
      if (email) {
        fields.unshift({ name: "📧 Email", value: email, inline: true });
      }

      const payload = {
        content: "<@967099537439227965> <@826133033069051954> 🩺 **Nouveau diagnostic complété !**",
        embeds: [{
          title: `${first_name} ${last_name || ""}`.trim(),
          color: 0xc8a97e,
          fields,
          timestamp: new Date().toISOString(),
        }],
      };

      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Discord webhook error:", res.status, await res.text());
        await notifyError("Diagnostic Discord", `Webhook échoué (${res.status}) • ${first_name}`);
      } else {
        console.log("Discord notification sent for", first_name);
      }
    } catch (discordErr) {
      console.error("Discord webhook failed:", discordErr);
      await notifyError("Diagnostic Discord", `Exception • ${first_name}`);
    }

    // ── 2. SMTP email (only if email available) ──
    if (email) {
      try {
        const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
        if (SMTP_PASSWORD) {
          const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
                🩺 Nouveau diagnostic complété
              </h1>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 160px;">Nom</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(first_name)} ${escapeHtml(last_name || "")}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td><td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">TikTok</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(tiktok || "—")}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Niveau</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(LEVEL_LABELS[level] || level || "—")}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Objectif</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(OBJECTIVE_LABELS[objective] || objective || "—")}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Blocage</td><td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(blocker || "—")}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Budget</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(BUDGET_LABELS[budget] || budget || "—")}</td></tr>
                <tr style="background: #f9f6f1;"><td style="padding: 12px; font-weight: bold; color: #c8a97e;">Offre recommandée</td><td style="padding: 12px; font-weight: bold; color: #c8a97e;">${escapeHtml(OFFER_LABELS[recommended_offer] || recommended_offer || "—")}</td></tr>
              </table>
            </div>`;

          const transporter = nodemailer.createTransport({
            host: "ssl0.ovh.net", port: 465, secure: true,
            auth: { user: "noreply@fredwav.com", pass: SMTP_PASSWORD },
          });

          await transporter.sendMail({
            from: "noreply@fredwav.com",
            to: "fredwavcm@gmail.com",
            subject: `🩺 Nouveau diagnostic — ${first_name} ${last_name || ""}`.trim(),
            html: htmlBody,
          });
          console.log("Email sent for", first_name);
        } else {
          console.warn("SMTP_PASSWORD not configured, skipping email");
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        await notifyError("Diagnostic Email", `Exception • ${first_name}`);
      }
    }

    await notifySuccess("Diagnostic", `${first_name} ${last_name || ""} • ${email || "pas d'email"} • ${OFFER_LABELS[recommended_offer] || recommended_offer}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    await notifyError("Diagnostic", `Erreur globale: ${error.message}`);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
