import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { first_name, last_name, email, tiktok_username, current_level, blockers, goals, current_revenue, revenue_goal, origin_source, follower_since, conversion_trigger, posthog_id } =
      await req.json();

    if (!first_name || !last_name || !email) {
      await notifyError("Candidature", "Champs obligatoires manquants");
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      content: "<@967099537439227965> <@826133033069051954>📋 **Nouvelle candidature Wav Premium !**",
      embeds: [{
        title: `${first_name} ${last_name}`,
        color: 0xc8a97e,
        fields: [
          { name: "📧 Email", value: email, inline: true },
          { name: "🎵 TikTok", value: tiktok_username || "—", inline: true },
          { name: "📊 Niveau", value: current_level || "—", inline: true },
          { name: "💰 CA actuel", value: current_revenue || "—", inline: true },
          { name: "🎯 Objectif CA", value: revenue_goal || "—", inline: true },
          { name: "📍 Source", value: origin_source || "—", inline: true },
          { name: "⏳ Follower depuis", value: follower_since || "—", inline: true },
          { name: "🔥 Déclencheur", value: conversion_trigger || "—", inline: true },
          { name: "📊 PostHog", value: posthog_id ? `[Voir](https://us.posthog.com/person/${posthog_id})` : "—", inline: true },
          { name: "🚧 Blockers", value: (blockers || "—").slice(0, 1024) },
          { name: "🎯 Objectifs", value: (goals || "—").slice(0, 1024) },
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
      throw new Error(`Discord webhook failed: ${res.status}`);
    }

    console.log(`Discord notification sent for ${first_name} ${last_name}`);
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
