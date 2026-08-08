import nodemailer from "npm:nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL") ?? "";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateLimitStore = new Map<string, number[]>();
const PREMIUM_BUDGET_CODES = new Set([
  "total_no_budget",
  "total_15_a_100",
  "total_100_a_300",
  "total_300_a_900",
  "total_900_plus",
]);
const PREMIUM_BUDGET_LABELS: Record<string, string> = {
  total_no_budget: "Pas de budget total",
  total_15_a_100: "15 € à 100 € au total",
  total_100_a_300: "100 € à 300 € au total",
  total_300_a_900: "300 € à 900 € au total",
  total_900_plus: "900 € et + au total",
};

type ApplicationPayload = {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  tiktok_username?: unknown;
  instagram_username?: unknown;
  youtube_url?: unknown;
  facebook_url?: unknown;
  other_social_url?: unknown;
  profil?: unknown;
  objectives?: unknown;
  goals?: unknown;
  success_30_days?: unknown;
  why_now?: unknown;
  help_topics?: unknown;
  availability?: unknown;
  budget?: unknown;
  origin_source?: unknown;
  follower_since?: unknown;
  conversion_trigger?: unknown;
  posthog_id?: unknown;
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateLimitStore.set(ip, recent);
  if (rateLimitStore.size > 5000) {
    for (const [key, times] of rateLimitStore) {
      const kept = times.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
      if (kept.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, kept);
    }
  }
  return true;
}

function cleanText(value: unknown, max: number, required = false): string | null {
  if (typeof value !== "string") return required ? null : null;
  const cleaned = value.trim().slice(0, max);
  return cleaned || null;
}

function cleanList(value: unknown, maxItems = 12, maxLength = 180): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function discordValue(value: string | null | undefined): string {
  return (value?.trim() || "-")
    .split("")
    .map((character) => "\\`*_{}[]()#+-.!|>~".includes(character) ? `\\${character}` : character)
    .join("")
    .slice(0, 1024);
}

function tableRow(label: string, value: string | null | undefined): string {
  return `<tr><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;color:#555;width:180px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:12px;border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(value || "-")}</td></tr>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Trop de demandes. Réessaie dans quelques minutes." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json() as ApplicationPayload;
    const firstName = cleanText(raw.first_name, 100, true);
    const lastName = cleanText(raw.last_name, 100, true);
    const email = cleanText(raw.email, 254, true);
    const tiktok = cleanText(raw.tiktok_username, 100);
    const instagram = cleanText(raw.instagram_username, 100);
    const youtube = cleanText(raw.youtube_url, 500);
    const facebook = cleanText(raw.facebook_url, 500);
    const otherNetwork = cleanText(raw.other_social_url, 500);
    const profile = cleanText(raw.profil, 600, true);
    const objectives = cleanList(raw.objectives);
    const blocker = cleanText(raw.goals, 3000, true);
    const success30Days = cleanText(raw.success_30_days, 3000, true);
    const whyNow = cleanText(raw.why_now, 3000, true);
    const helpTopics = cleanList(raw.help_topics);
    const availability = cleanText(raw.availability, 300, true);
    const budget = cleanText(raw.budget, 100, true);
    const originSource = cleanText(raw.origin_source, 500);
    const followerSince = cleanText(raw.follower_since, 100);
    const conversionTrigger = cleanText(raw.conversion_trigger, 500);
    const posthogId = cleanText(raw.posthog_id, 200);

    const hasNetwork = Boolean(tiktok || instagram || youtube || facebook || otherNetwork);
    if (!firstName || !lastName || !email || !profile || !blocker || !success30Days || !whyNow || !availability || !budget || !PREMIUM_BUDGET_CODES.has(budget) || !hasNetwork || objectives.length === 0 || helpTopics.length === 0) {
      await notifyError("Demande Wav Premium", "Champs de qualification obligatoires manquants");
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const networks = [
      tiktok && `TikTok : ${tiktok}`,
      instagram && `Instagram : ${instagram}`,
      youtube && `YouTube : ${youtube}`,
      facebook && `Facebook : ${facebook}`,
      otherNetwork && `Autre : ${otherNetwork}`,
    ].filter((value): value is string => Boolean(value));
    const budgetLabel = PREMIUM_BUDGET_LABELS[budget] ?? budget;

    if (DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        content: "<@967099537439227965> <@826133033069051954> 📋 **Nouvelle demande Wav Premium !**",
        allowed_mentions: { users: ["967099537439227965", "826133033069051954"] },
        embeds: [{
          title: discordValue(`${firstName} ${lastName}`),
          color: 0xc8a97e,
          fields: [
            { name: "📧 Email", value: discordValue(email), inline: true },
            { name: "💰 Budget total", value: discordValue(budgetLabel), inline: true },
            { name: "🌐 Réseaux", value: discordValue(networks.join("\n")) },
            { name: "👤 Profil", value: discordValue(profile) },
            { name: "🎯 Objectifs", value: discordValue(objectives.join("\n")) },
            { name: "🧱 Blocage principal", value: discordValue(blocker) },
            { name: "📅 Résultat attendu à 30 jours", value: discordValue(success30Days) },
            { name: "⏱️ Pourquoi maintenant", value: discordValue(whyNow) },
            { name: "🤝 Aides recherchées", value: discordValue(helpTopics.join("\n")) },
            { name: "🕒 Disponibilité", value: discordValue(availability) },
            { name: "📍 Source", value: discordValue(originSource), inline: true },
            { name: "⌛ Suit Fred depuis", value: discordValue(followerSince), inline: true },
            { name: "🔥 Déclencheur", value: discordValue(conversionTrigger) },
            { name: "📊 PostHog", value: posthogId ? `[Voir](https://us.posthog.com/person/${encodeURIComponent(posthogId)})` : "-", inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      };

      const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });
      if (!discordResponse.ok) {
        console.error("Discord webhook error:", discordResponse.status, await discordResponse.text());
        await notifyError("Demande Wav Premium Discord", `Webhook échoué (${discordResponse.status}) • ${firstName} ${lastName}`);
      }
    }

    try {
      const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
      if (smtpPassword) {
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px">
            <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Nouvelle demande Wav Premium</h1>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
              ${tableRow("Nom", `${firstName} ${lastName}`)}
              ${tableRow("Email", email)}
              ${tableRow("Réseaux", networks.join("\n"))}
              ${tableRow("Profil", profile)}
              ${tableRow("Objectifs", objectives.join("\n"))}
              ${tableRow("Blocage principal", blocker)}
              ${tableRow("Résultat attendu à 30 jours", success30Days)}
              ${tableRow("Pourquoi maintenant", whyNow)}
              ${tableRow("Aides recherchées", helpTopics.join("\n"))}
              ${tableRow("Disponibilité", availability)}
              ${tableRow("Budget total", budgetLabel)}
              ${tableRow("Source", originSource)}
              ${tableRow("Suit Fred depuis", followerSince)}
              ${tableRow("Contenu ou expérience déclencheur", conversionTrigger)}
            </table>
          </div>`;

        const transporter = nodemailer.createTransport({
          host: "ssl0.ovh.net",
          port: 465,
          secure: true,
          auth: { user: "noreply@fredwav.com", pass: smtpPassword },
        });

        await transporter.sendMail({
          from: "noreply@fredwav.com",
          to: "fredwavcm@gmail.com",
          subject: `Nouvelle demande Wav Premium - ${firstName} ${lastName}`,
          html: adminHtml,
        });

        const candidateHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Merci pour ta demande, ${escapeHtml(firstName)} !</h1>
            <p style="color:#555;font-size:16px;line-height:1.6">Ta demande Wav Premium a bien été reçue. Je prends le temps de la lire en détail.</p>
            <div style="background:#faf7f2;border-left:4px solid #c8a97e;padding:20px;margin:24px 0;border-radius:8px">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0"><strong>Prochaine étape :</strong> je te recontacte personnellement par email sous <strong>48 h ouvrées</strong>.</p>
            </div>
            <p style="color:#555;font-size:16px;line-height:1.6">Pense à vérifier tes spams. Tu peux aussi répondre directement à cet email si tu veux ajouter un élément.</p>
            <p style="color:#555;font-size:16px;margin-top:24px">À très vite,<br><strong>Fred Wav</strong></p>
          </div>`;

        await transporter.sendMail({
          from: "noreply@fredwav.com",
          replyTo: "fredwavcm@gmail.com",
          to: email,
          subject: `${firstName}, ta demande Wav Premium est bien reçue`,
          html: candidateHtml,
        });
      }
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      await notifyError("Demande Wav Premium Email", `Exception • ${firstName} ${lastName}`);
    }

    await notifySuccess("Demande Wav Premium", `${firstName} ${lastName} • ${email}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    await notifyError("Demande Wav Premium", `Erreur: ${message}`);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
