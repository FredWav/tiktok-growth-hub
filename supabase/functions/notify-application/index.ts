import nodemailer from "npm:nodemailer@6.9.16";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL") ?? "";
const WAVSTATS_URL = "https://wavstats.com";
const ANALYSE_EXPRESS_URL = "https://fredwav.com/analyse-express";
const CALL_BOOKING_URL = "https://calendar.app.google/UZC5UY38shFuSqmy6";
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
  total_15_a_100: "100 € maximum au total",
  total_100_a_300: "Plus de 100 € à 300 € au total",
  total_300_a_900: "300 € à 900 € au total",
  total_900_plus: "900 € et + au total",
};
const BUSINESS_STAGE_LABELS: Record<string, string> = {
  debut: "Je commence à publier",
  irregulier: "Je publie, mais je manque de régularité",
  stagnation: "Je publie régulièrement, mais mes résultats stagnent",
  visibilite_sans_revenus: "J'ai de la visibilité, mais elle génère peu de revenus",
  activite_a_accelerer: "Mon activité génère déjà des revenus et je veux accélérer",
};
const PRIMARY_GOAL_LABELS: Record<string, string> = {
  comprendre_contenus: "Comprendre quels contenus fonctionnent et pourquoi",
  gagner_visibilite: "Développer ma visibilité et mon audience",
  attirer_clients: "Attirer davantage de prospects ou de clients",
  mieux_vendre: "Mieux transformer mon audience en revenus",
  structurer_strategie: "Structurer un lancement ou une stratégie plus ambitieuse",
};
const WORK_MODE_LABELS: Record<string, string> = {
  outils_autonomes: "Des outils et des données pour décider entièrement seul",
  plan_ponctuel: "Construire un plan clair avec Fred, puis l'appliquer seul",
  suivi_collectif: "Avancer avec des retours réguliers en collectif",
  suivi_individuel: "Être accompagné personnellement pendant la mise en œuvre",
  a_definir: "Je ne sais pas encore ce qui serait le plus utile",
  autonome: "Des données claires pour décider et appliquer seul",
  regard_strategique: "Un regard stratégique humain pour décider avec moi",
};
const OFFER_LABELS: Record<string, string> = {
  wavstats: "WavStats",
  express: "Analyse Express",
  academy: "Wav Academy",
  sprint: "Sprint stratégique",
  one_shot: "Sprint stratégique",
  premium: "Wav Premium",
};

type QualificationRoute = "wavstats" | "express" | "call";
type RecommendedOffer = "wavstats" | "express" | "academy" | "sprint" | "premium";
type QualificationResult = { route: QualificationRoute; offer: RecommendedOffer; score: number };

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
  form_version?: unknown;
  account_url?: unknown;
  business_stage?: unknown;
  primary_goal?: unknown;
  main_blocker?: unknown;
  work_mode?: unknown;
  qualification_route?: unknown;
  recommended_offer?: unknown;
  qualification_score?: unknown;
};

function qualify(businessStage: string, primaryGoal: string, workMode: string, budget: string): QualificationResult {
  const normalizedWorkMode = workMode === "autonome"
    ? "outils_autonomes"
    : workMode === "regard_strategique"
      ? "plan_ponctuel"
      : workMode;
  const situationScores: Record<string, number> = {
    debut: 0,
    irregulier: 0,
    stagnation: 1,
    visibilite_sans_revenus: 2,
    activite_a_accelerer: 2,
  };
  const goalScores: Record<string, number> = {
    comprendre_contenus: 0,
    gagner_visibilite: 0,
    attirer_clients: 2,
    mieux_vendre: 2,
    structurer_strategie: 2,
  };
  const workModeScores: Record<string, number> = {
    outils_autonomes: 0,
    suivi_collectif: 1,
    plan_ponctuel: 2,
    suivi_individuel: 3,
    a_definir: 1,
  };
  const budgetScores: Record<string, number> = {
    total_no_budget: 0,
    total_15_a_100: 0,
    total_100_a_300: 1,
    total_300_a_900: 2,
    total_900_plus: 2,
  };
  const score =
    (situationScores[businessStage] ?? 0) +
    (goalScores[primaryGoal] ?? 0) +
    (workModeScores[normalizedWorkMode] ?? 0) +
    (budgetScores[budget] ?? 0);
  const canInvestInHumanHelp = !["total_no_budget", "total_15_a_100"].includes(budget);
  const hasPremiumBudget = budget === "total_900_plus";
  const hasCommercialNeed =
    ["stagnation", "visibilite_sans_revenus", "activite_a_accelerer"].includes(businessStage) &&
    ["attirer_clients", "mieux_vendre", "structurer_strategie"].includes(primaryGoal);

  if (!canInvestInHumanHelp) {
    return budget === "total_no_budget"
      ? { score, route: "wavstats", offer: "wavstats" }
      : { score, route: "express", offer: "express" };
  }
  if (normalizedWorkMode === "outils_autonomes") {
    return { score, route: "wavstats", offer: "wavstats" };
  }
  if (normalizedWorkMode === "plan_ponctuel") {
    return { score, route: "call", offer: "sprint" };
  }
  if (normalizedWorkMode === "suivi_collectif") {
    return { score, route: "call", offer: "academy" };
  }
  if (normalizedWorkMode === "suivi_individuel") {
    return hasPremiumBudget
      ? { score, route: "call", offer: "premium" }
      : { score, route: "call", offer: "academy" };
  }
  if (budget === "total_100_a_300") {
    return { score, route: "call", offer: "academy" };
  }
  if (hasCommercialNeed) {
    return { score, route: "call", offer: "sprint" };
  }
  return { score, route: "call", offer: "academy" };
}

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
    const formVersion = cleanText(raw.form_version, 50);
    const accountUrl = cleanText(raw.account_url, 500);
    const businessStage = cleanText(raw.business_stage, 100);
    const primaryGoal = cleanText(raw.primary_goal, 100);
    const mainBlocker = cleanText(raw.main_blocker, 2000);
    const workMode = cleanText(raw.work_mode, 100);
    const isOrientationV2 = formVersion === "orientation_v2";

    const hasNetwork = Boolean(tiktok || instagram || youtube || facebook || otherNetwork);
    const legacyPayloadValid = Boolean(
      profile && blocker && success30Days && whyNow && availability && hasNetwork && objectives.length > 0 && helpTopics.length > 0,
    );
    const orientationPayloadValid = Boolean(
      accountUrl &&
      businessStage && BUSINESS_STAGE_LABELS[businessStage] &&
      primaryGoal && PRIMARY_GOAL_LABELS[primaryGoal] &&
      mainBlocker && mainBlocker.length >= 20 &&
      workMode && WORK_MODE_LABELS[workMode],
    );
    if (
      !firstName || !lastName || !email || !budget || !PREMIUM_BUDGET_CODES.has(budget) ||
      (isOrientationV2 ? !orientationPayloadValid : !legacyPayloadValid)
    ) {
      await notifyError("Demande d'accompagnement", "Champs de qualification obligatoires manquants");
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

    const networks = isOrientationV2
      ? [`Compte principal : ${accountUrl}`]
      : [
          tiktok && `TikTok : ${tiktok}`,
          instagram && `Instagram : ${instagram}`,
          youtube && `YouTube : ${youtube}`,
          facebook && `Facebook : ${facebook}`,
          otherNetwork && `Autre : ${otherNetwork}`,
        ].filter((value): value is string => Boolean(value));
    const budgetLabel = PREMIUM_BUDGET_LABELS[budget] ?? budget;
    const qualification = isOrientationV2
      ? qualify(businessStage!, primaryGoal!, workMode!, budget)
      : null;
    const qualificationRouteLabel = qualification?.route === "call"
      ? "Appel stratégique"
      : qualification?.route === "express"
        ? "Analyse Express"
        : "WavStats";
    const recommendedOfferLabel = qualification ? OFFER_LABELS[qualification.offer] : "";
    const discordQualificationFields = isOrientationV2
      ? [
          { name: "🧭 Orientation", value: discordValue(qualificationRouteLabel), inline: true },
          { name: "💡 Offre pressentie", value: discordValue(recommendedOfferLabel), inline: true },
          { name: "🔢 Score", value: discordValue(String(qualification?.score ?? 0)), inline: true },
          { name: "📍 Situation", value: discordValue(BUSINESS_STAGE_LABELS[businessStage!] ?? businessStage) },
          { name: "🎯 Objectif prioritaire", value: discordValue(PRIMARY_GOAL_LABELS[primaryGoal!] ?? primaryGoal) },
          { name: "🧱 Blocage principal", value: discordValue(mainBlocker) },
          { name: "🤝 Manière d'avancer", value: discordValue(WORK_MODE_LABELS[workMode!] ?? workMode) },
        ]
      : [
          { name: "👤 Profil", value: discordValue(profile) },
          { name: "🎯 Objectifs", value: discordValue(objectives.join("\n")) },
          { name: "🧱 Blocage principal", value: discordValue(blocker) },
          { name: "📅 Résultat attendu à 30 jours", value: discordValue(success30Days) },
          { name: "⏱️ Pourquoi maintenant", value: discordValue(whyNow) },
          { name: "🤝 Aides recherchées", value: discordValue(helpTopics.join("\n")) },
          { name: "🕒 Disponibilité", value: discordValue(availability) },
        ];
    const adminQualificationRows = isOrientationV2
      ? [
          tableRow("Orientation", qualificationRouteLabel),
          tableRow("Offre pressentie", recommendedOfferLabel),
          tableRow("Score", String(qualification?.score ?? 0)),
          tableRow("Situation", BUSINESS_STAGE_LABELS[businessStage!] ?? businessStage),
          tableRow("Objectif prioritaire", PRIMARY_GOAL_LABELS[primaryGoal!] ?? primaryGoal),
          tableRow("Blocage principal", mainBlocker),
          tableRow("Manière d'avancer", WORK_MODE_LABELS[workMode!] ?? workMode),
        ].join("")
      : [
          tableRow("Profil", profile),
          tableRow("Objectifs", objectives.join("\n")),
          tableRow("Blocage principal", blocker),
          tableRow("Résultat attendu à 30 jours", success30Days),
          tableRow("Pourquoi maintenant", whyNow),
          tableRow("Aides recherchées", helpTopics.join("\n")),
          tableRow("Disponibilité", availability),
        ].join("");

    if (DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        content: isOrientationV2
          ? `<@967099537439227965> <@826133033069051954> 📋 **Nouvelle qualification - ${discordValue(recommendedOfferLabel)} !**`
          : "<@967099537439227965> <@826133033069051954> 📋 **Nouvelle demande d'accompagnement !**",
        allowed_mentions: { users: ["967099537439227965", "826133033069051954"] },
        embeds: [{
          title: discordValue(`${firstName} ${lastName}`),
          color: 0xc8a97e,
          fields: [
            { name: "📧 Email", value: discordValue(email), inline: true },
            { name: "💰 Budget total", value: discordValue(budgetLabel), inline: true },
            { name: "🌐 Réseaux", value: discordValue(networks.join("\n")) },
            ...discordQualificationFields,
            { name: "📍 Source", value: discordValue(originSource), inline: true },
            ...(!isOrientationV2 ? [
              { name: "⌛ Suit Fred depuis", value: discordValue(followerSince), inline: true },
              { name: "🔥 Déclencheur", value: discordValue(conversionTrigger) },
            ] : []),
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
        await notifyError("Demande d'accompagnement Discord", `Webhook échoué (${discordResponse.status}) • ${firstName} ${lastName}`);
      }
    }

    try {
      const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
      if (smtpPassword) {
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px">
            <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Nouvelle demande d'accompagnement</h1>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
              ${tableRow("Nom", `${firstName} ${lastName}`)}
              ${tableRow("Email", email)}
              ${tableRow("Réseaux", networks.join("\n"))}
              ${adminQualificationRows}
              ${tableRow("Budget total", budgetLabel)}
              ${tableRow("Source", originSource)}
              ${!isOrientationV2 ? tableRow("Suit Fred depuis", followerSince) : ""}
              ${!isOrientationV2 ? tableRow("Contenu ou expérience déclencheur", conversionTrigger) : ""}
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
          subject: isOrientationV2
            ? `[${qualification?.route === "call" ? "APPEL" : "AUTOMATIQUE"} - ${recommendedOfferLabel.toUpperCase()}] ${firstName} ${lastName}`
            : `Nouvelle demande d'accompagnement - ${firstName} ${lastName}`,
          html: adminHtml,
        });

        const orientationHtml = qualification?.route === "call" ? `
          <p style="color:#555;font-size:16px;line-height:1.6">Ton objectif, ton niveau de maturité et ton besoin justifient un échange stratégique.</p>
          <div style="background:#faf7f2;border-left:4px solid #c8a97e;padding:20px;margin:24px 0;border-radius:8px">
            <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 18px"><strong>Prochaine étape :</strong> réserve ton appel stratégique.</p>
            <a href="${CALL_BOOKING_URL}" style="display:inline-block;background:#9b7510;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Choisir mon créneau</a>
          </div>` : qualification?.route === "express" ? `
          <p style="color:#555;font-size:16px;line-height:1.6">L'Analyse Express est la prochaine étape la plus adaptée à ta situation. Elle est entièrement automatique et ne comprend pas d'analyse humaine réalisée par Fred.</p>
          <div style="background:#faf7f2;border-left:4px solid #c8a97e;padding:20px;margin:24px 0;border-radius:8px">
            <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 8px"><strong>Analyse Express - 11,90 €</strong></p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 18px">Un audit TikTok automatique et ponctuel avec un rapport et des priorités d'action.</p>
            <a href="${ANALYSE_EXPRESS_URL}" style="display:inline-block;background:#9b7510;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Lancer mon Analyse Express</a>
          </div>` : `
          <p style="color:#555;font-size:16px;line-height:1.6">WavStats est la prochaine étape la plus adaptée à ta situation. C'est un outil autonome qui ne comprend pas d'analyse humaine réalisée par Fred.</p>
          <div style="background:#faf7f2;border-left:4px solid #c8a97e;padding:20px;margin:24px 0;border-radius:8px">
            <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 8px"><strong>WavStats</strong></p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 18px">Analyse tes contenus et suis ce qui fonctionne dans la durée.</p>
            <a href="${WAVSTATS_URL}" style="display:inline-block;background:#9b7510;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Découvrir WavStats</a>
          </div>`;
        const candidateHtml = isOrientationV2 ? `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Ta prochaine étape, ${escapeHtml(firstName)}</h1>
            ${orientationHtml}
            <p style="color:#555;font-size:16px;margin-top:24px">À très vite,<br><strong>Fred Wav</strong></p>
          </div>` : `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Merci pour ta demande, ${escapeHtml(firstName)} !</h1>
            <p style="color:#555;font-size:16px;line-height:1.6">Ta demande a bien été reçue. Je vais regarder ta situation et la forme d'aide qui serait réellement pertinente.</p>
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
          subject: isOrientationV2 ? `${firstName}, voici ta prochaine étape` : `${firstName}, ta demande est bien reçue`,
          html: candidateHtml,
        });
      }
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      await notifyError("Demande d'accompagnement Email", `Exception • ${firstName} ${lastName}`);
    }

    await notifySuccess(
      "Demande d'accompagnement",
      `${firstName} ${lastName} • ${email}${qualification ? ` • ${qualification.route} (${qualification.score})` : ""}`,
    );
    return new Response(JSON.stringify({ success: true, route: qualification?.route, score: qualification?.score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    await notifyError("Demande d'accompagnement", `Erreur: ${message}`);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
