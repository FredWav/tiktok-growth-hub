import {
  db,
  deliverMail,
  email,
  enqueue,
  fingerprint,
  headers,
  json,
  OWNER_EMAIL,
  text,
  uuid,
} from "../_shared/commerce.ts";
import { notifyDiscordEmbed } from "../_shared/discord.ts";
const FORM_VERSION = "orientation_v3";
const BUDGETS = new Set(["no_budget", "under_399", "399_748", "749_1989", "1990_plus"]);
const STAGES = new Set([
  "debut",
  "irregulier",
  "stagnation",
  "visibilite_sans_revenus",
  "activite_a_accelerer",
]);
const GOALS = new Set([
  "comprendre_contenus",
  "gagner_visibilite",
  "attirer_clients",
  "mieux_vendre",
  "structurer_strategie",
]);
const WORK_MODES = new Set([
  "outils_autonomes",
  "plan_ponctuel",
  "suivi_collectif",
  "suivi_individuel",
  "a_definir",
]);

const labels: Record<string, string> = {
  debut: "Lancement de l’activité ou du compte",
  irregulier: "Publication irrégulière, sans méthode",
  stagnation: "Publication régulière, résultats en stagnation",
  visibilite_sans_revenus: "Visibilité avec peu de clients",
  activite_a_accelerer: "Activité existante à accélérer",
  comprendre_contenus: "Comprendre les contenus qui fonctionnent",
  gagner_visibilite: "Développer la visibilité et l’audience",
  attirer_clients: "Attirer davantage de prospects ou de clients",
  mieux_vendre: "Transformer l’audience en revenus",
  structurer_strategie: "Structurer un lancement ou une stratégie",
  outils_autonomes: "Avancer seul avec des données et des outils",
  plan_ponctuel: "Construire un plan avec Fred puis l’appliquer seul",
  suivi_collectif: "Avancer dans un cadre collectif",
  suivi_individuel: "Être accompagné individuellement",
  a_definir: "Définir le bon format avec Fred",
  no_budget: "Pas de budget",
  under_399: "1 - 398 €",
  "399_748": "399 - 998 €",
  "749_1989": "998 - 1 499 €",
  "1990_plus": "Plus de 1 499 €",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const body = await req.json();
    if (body.website) return json({ error: "Demande non acceptée" }, 400);
    const requestId = uuid(body.request_id);
    const firstName = text(body.first_name, 1, 100);
    const lastName = text(body.last_name, 1, 100);
    const cleanEmail = email(body.email);
    const accountUrl = text(body.account_url, 2, 500);
    const businessStage = text(body.business_stage, 1, 100);
    const primaryGoal = text(body.primary_goal, 1, 100);
    const mainBlocker = text(body.main_blocker, 20, 2000);
    const workMode = text(body.work_mode, 1, 100);
    const budget = text(body.budget, 1, 100);
    const originSource = typeof body.origin_source === "string"
      ? text(body.origin_source, 0, 500)
      : "";
    const followerSince = typeof body.follower_since === "string"
      ? text(body.follower_since, 0, 100)
      : "";
    const conversionTrigger = typeof body.conversion_trigger === "string"
      ? text(body.conversion_trigger, 0, 500)
      : "";
    const posthogId = typeof body.posthog_id === "string"
      ? text(body.posthog_id, 0, 200)
      : "";
    if (
      body.form_version !== FORM_VERSION || !STAGES.has(businessStage) ||
      !GOALS.has(primaryGoal) ||
      !WORK_MODES.has(workMode) || !BUDGETS.has(budget)
    ) {
      return json({
        error: "Certaines réponses ne sont plus valides. Recharge la page.",
      }, 422);
    }

    const client = db();
    const existing = await client.from("wav_premium_applications").select(
      "id",
    )
      .eq("orientation_request_id", requestId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      return json({
        id: existing.data.id,
        notification: "queued",
      });
    }

    const visitorFingerprint = await fingerprint(req);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [byEmail, byVisitor] = await Promise.all([
      client.from("wav_premium_applications").select("id", {
        count: "exact",
        head: true,
      }).eq("email", cleanEmail).gte("created_at", since),
      client.from("wav_premium_applications").select("id", {
        count: "exact",
        head: true,
      }).eq("orientation_fingerprint", visitorFingerprint).gte(
        "created_at",
        since,
      ),
    ]);
    if (byEmail.error || byVisitor.error) {
      throw byEmail.error || byVisitor.error;
    }
    if ((byEmail.count ?? 0) >= 5 || (byVisitor.count ?? 0) >= 10) {
      return json({ error: "Trop de demandes. Réessaie dans une heure." }, 429);
    }

    const { data: saved, error: insertError } = await client.from(
      "wav_premium_applications",
    ).insert({
      first_name: firstName,
      last_name: lastName,
      email: cleanEmail,
      goals: mainBlocker,
      profil: labels[businessStage],
      budget,
      origin_source: originSource || null,
      follower_since: followerSince || null,
      conversion_trigger: conversionTrigger || null,
      posthog_id: posthogId || null,
      form_version: FORM_VERSION,
      account_url: accountUrl,
      business_stage: businessStage,
      primary_goal: primaryGoal,
      main_blocker: mainBlocker,
      work_mode: workMode,
      orientation_request_id: requestId,
      orientation_fingerprint: visitorFingerprint,
    }).select("id").single();
    if (insertError || !saved) {
      const retry = await client.from("wav_premium_applications").select(
        "id",
      )
        .eq("orientation_request_id", requestId).maybeSingle();
      if (!retry.data) {
        throw insertError || new Error("Demande non enregistrée");
      }
      return json({
        id: retry.data.id,
        notification: "queued",
      });
    }

    const esc = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const row = (label: string, value: string) =>
      `<tr><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;color:#555;width:180px;vertical-align:top">${label}</td><td style="padding:12px;border-bottom:1px solid #eee;white-space:pre-wrap">${value}</td></tr>`;
    const link = (url: string) =>
      /^https?:\/\//i.test(url)
        ? `<a href="${esc(url)}" style="color:#b0273a">${esc(url)}</a>`
        : esc(url);
    const posthogUrl = posthogId
      ? `https://us.posthog.com/person/${encodeURIComponent(posthogId)}`
      : "";
    const adminHtml =
      `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px">
        <h1 style="color:#333;border-bottom:2px solid #c8a97e;padding-bottom:10px">Nouvelle demande de contact</h1>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          ${row("Nom", `${esc(firstName)} ${esc(lastName)}`)}
          ${row("Email", `<a href="mailto:${esc(cleanEmail)}" style="color:#b0273a">${esc(cleanEmail)}</a>`)}
          ${row("Compte principal", link(accountUrl))}
          ${row("Situation", esc(labels[businessStage]))}
          ${row("Objectif", esc(labels[primaryGoal]))}
          ${row("Besoin", esc(labels[workMode]))}
          ${row("Budget", esc(labels[budget]))}
          ${row("Blocage", esc(mainBlocker))}
          ${originSource ? row("Source", esc(originSource)) : ""}
          ${followerSince ? row("Suit Fred depuis", esc(followerSince)) : ""}
          ${conversionTrigger ? row("Déclencheur", esc(conversionTrigger)) : ""}
          ${posthogUrl ? row("PostHog", link(posthogUrl)) : ""}
        </table>
      </div>`;

    await enqueue(
      client,
      `orientation:${saved.id}:owner`,
      OWNER_EMAIL,
      `Nouvelle demande de contact · ${firstName} ${lastName}`,
      adminHtml,
    );
    await notifyDiscordEmbed(
      "📋 **Nouvelle demande de contact !**",
      `${firstName} ${lastName}`,
      [
        { name: "📧 Email", value: cleanEmail, inline: true },
        { name: "💰 Budget total", value: labels[budget], inline: true },
        { name: "🌐 Compte principal", value: accountUrl },
        { name: "👤 Situation", value: labels[businessStage] },
        { name: "🎯 Objectif", value: labels[primaryGoal] },
        { name: "🤝 Besoin", value: labels[workMode] },
        { name: "🧱 Blocage principal", value: mainBlocker },
        { name: "📍 Source", value: originSource, inline: true },
        { name: "⌛ Suit Fred depuis", value: followerSince, inline: true },
        { name: "🔥 Déclencheur", value: conversionTrigger },
        { name: "📊 PostHog", value: posthogUrl ? `[Voir](${posthogUrl})` : "" },
      ],
    );
    try {
      await deliverMail(client);
    } catch (mailError) {
      // La demande est enregistrée et le mail reste en file : le cron le renverra.
      console.error("Envoi immédiat du mail de contact impossible:", mailError);
    }

    return json({
      id: saved.id,
      notification: "queued",
    });
  } catch (error) {
    console.error(error);
    return json({
      error:
        "La demande n’a pas pu être confirmée. Réessaie ; tes réponses restent affichées.",
    }, 400);
  }
});
