import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function formatNumber(n: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n * 100) / 100);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#C4A34A";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { html += "</ul>"; inList = false; }
      continue;
    }

    // Bold
    const processed = escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    if (trimmed.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h4 style="font-family:'Playfair Display',serif;font-size:15px;font-weight:700;margin:18px 0 8px;color:#0F0F0F;">${processed.slice(5)}</h4>`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;margin:22px 0 10px;color:#C4A34A;">${processed.slice(4)}</h3>`;
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin:24px 0 12px;color:#0F0F0F;">${processed.slice(3)}</h2>`;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) { html += `<ul style="margin:6px 0;padding-left:20px;color:#737373;">`; inList = true; }
      html += `<li style="margin:3px 0;font-size:13px;line-height:1.6;">${processed.slice(2)}</li>`;
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) { html += `<ul style="margin:6px 0;padding-left:20px;color:#737373;list-style:decimal;">`; inList = true; }
      html += `<li style="margin:3px 0;font-size:13px;line-height:1.6;">${processed.replace(/^\d+\.\s+/, "")}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p style="margin:6px 0;font-size:13px;line-height:1.7;color:#737373;">${processed}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function scoreBar(label: string, score: number, detail?: string): string {
  const color = getScoreColor(score);
  return `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:13px;font-weight:600;color:#0F0F0F;">${escapeHtml(label)}</span>
        <span style="font-size:13px;font-weight:700;color:${color};">${score}/100 · ${getScoreLabel(score)}</span>
      </div>
      <div style="background:#e5e5e5;border-radius:6px;height:8px;overflow:hidden;">
        <div style="width:${score}%;height:100%;background:${color};border-radius:6px;transition:width 0.3s;"></div>
      </div>
      ${detail ? `<p style="font-size:11px;color:#737373;margin-top:3px;">${escapeHtml(detail)}</p>` : ""}
    </div>`;
}

function metricCard(label: string, value: string | number, sub?: string): string {
  return `
    <div style="background:#FAFAF5;border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;text-align:center;">
      <div style="font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${escapeHtml(label)}</div>
      <div style="font-size:20px;font-weight:700;color:#0F0F0F;">${typeof value === "number" ? formatNumber(value) : escapeHtml(String(value))}</div>
      ${sub ? `<div style="font-size:11px;color:#737373;margin-top:2px;">${escapeHtml(sub)}</div>` : ""}
    </div>`;
}

function sectionTitle(icon: string, title: string): string {
  return `<h2 style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#0F0F0F;margin:32px 0 14px;padding-bottom:8px;border-bottom:2px solid #C4A34A;display:flex;align-items:center;gap:8px;">
    <span style="font-size:18px;">${icon}</span> ${escapeHtml(title)}
  </h2>`;
}

function generateReport(username: string, data: any): string {
  const account = data?.account || {};
  const persona = data?.persona || {};
  const healthScore = data?.health_score || account?.health_score || {};
  const pubPattern = persona?.style_contenu?.publication_pattern || {};
  const breakdown = pubPattern?.regularity_details?.tiktok_breakdown || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const healthComponents = healthScore?.components || {};
  const componentKeys = Object.keys(healthComponents);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Analyse TikTok — @${escapeHtml(username)} — FredWav</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#0F0F0F; max-width:800px; margin:0 auto; padding:40px 32px; line-height:1.5; }
  /* Prevent page breaks inside sections */
  .section-block { break-inside:avoid; page-break-inside:avoid; }
  h2, h3, h4 { break-after:avoid; page-break-after:avoid; }
  ul, ol { break-inside:avoid; page-break-inside:avoid; }
  .print-btn { position:fixed; bottom:24px; right:24px; background:#C4A34A; color:#fff; border:none; padding:14px 28px; border-radius:10px; font-family:'Inter',sans-serif; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.15); z-index:9999; display:flex; align-items:center; gap:8px; transition:transform 0.2s; }
  .print-btn:hover { transform:scale(1.05); }
  @media print {
    body { padding:20px; }
    @page { margin:15mm; size:A4; }
    .no-print { display:none !important; }
    .section-block { break-inside:avoid; page-break-inside:avoid; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;border-bottom:2px solid #C4A34A;margin-bottom:28px;">
  <div>
    <h1 style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#0F0F0F;">FredWav</h1>
    <p style="font-size:13px;color:#C4A34A;font-weight:600;letter-spacing:0.5px;">Analyse TikTok Express</p>
  </div>
  <div style="text-align:right;">
    <p style="font-size:12px;color:#737373;">${escapeHtml(dateStr)}</p>
    <p style="font-size:14px;font-weight:600;color:#0F0F0F;">@${escapeHtml(username)}</p>
  </div>
</div>

<!-- PROFILE -->
<div class="section-block" style="display:flex;align-items:center;gap:18px;background:#FAFAF5;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:8px;">
  ${account.avatar_url ? `<img src="${escapeHtml(account.avatar_url)}" alt="Avatar" style="width:72px;height:72px;border-radius:50%;border:3px solid #C4A34A;object-fit:cover;">` : `<div style="width:72px;height:72px;border-radius:50%;background:#e5e5e5;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#737373;">${(username[0] || "?").toUpperCase()}</div>`}
  <div>
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;font-weight:700;">${escapeHtml(account.display_name || username)}</span>
      ${account.verified ? `<span style="color:#C4A34A;font-size:16px;">✓</span>` : ""}
    </div>
    <p style="font-size:13px;color:#737373;">@${escapeHtml(username)}</p>
    ${account.bio ? `<p style="font-size:12px;color:#737373;margin-top:4px;max-width:500px;">${escapeHtml(account.bio)}</p>` : ""}
    ${account.detected_niche ? `<span style="display:inline-block;margin-top:6px;background:#C4A34A;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;">${escapeHtml(account.detected_niche)}</span>` : ""}
  </div>
</div>

<!-- HEALTH SCORE -->
${healthScore?.total_score != null ? `
${sectionTitle("💊", "Score de Santé")}
<div class="section-block" style="display:flex;align-items:center;gap:20px;background:#FAFAF5;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
  <div style="position:relative;width:90px;height:90px;">
    <svg viewBox="0 0 36 36" style="width:90px;height:90px;transform:rotate(-90deg);">
      <circle cx="18" cy="18" r="15.91" fill="none" stroke="#e5e5e5" stroke-width="3"/>
      <circle cx="18" cy="18" r="15.91" fill="none" stroke="${getScoreColor(healthScore.total_score)}" stroke-width="3" stroke-dasharray="${healthScore.total_score} ${100 - healthScore.total_score}" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <span style="font-size:22px;font-weight:800;color:${getScoreColor(healthScore.total_score)};">${healthScore.total_score}</span>
      <span style="font-size:9px;color:#737373;">/100</span>
    </div>
  </div>
  <div style="flex:1;">
    <p style="font-size:15px;font-weight:700;color:${getScoreColor(healthScore.total_score)};">${getScoreLabel(healthScore.total_score)}</p>
    ${healthScore.overall_status ? `<p style="font-size:12px;color:#737373;margin-top:4px;">${escapeHtml(healthScore.overall_status)}</p>` : ""}
  </div>
</div>
${componentKeys.length > 0 ? `<div class="section-block" style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:18px;margin-bottom:8px;">
  ${componentKeys.map(k => {
    const c = healthComponents[k];
    return scoreBar(c.label || k, c.score || 0, c.status || "");
  }).join("")}
</div>` : ""}
${healthScore.priority_actions?.length ? `<div style="background:#FAFAF5;border:1px solid #e5e5e5;border-radius:10px;padding:14px 18px;margin-bottom:8px;">
  <p style="font-size:13px;font-weight:600;margin-bottom:6px;">Actions prioritaires</p>
  <ul style="padding-left:18px;margin:0;">
    ${healthScore.priority_actions.map((a: string) => `<li style="font-size:12px;color:#737373;margin:3px 0;">${escapeHtml(a)}</li>`).join("")}
  </ul>
</div>` : ""}
` : ""}

<!-- METRICS -->
${sectionTitle("📈", "Métriques Clés")}
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
  ${metricCard("Abonnés", account.followers_count)}
  ${metricCard("Likes total", account.total_likes)}
  ${metricCard("Vidéos", account.video_count)}
  ${metricCard("Engagement", account.engagement_rate != null ? `${(account.engagement_rate * 100).toFixed(2)}%` : "—")}
</div>

${(account.avg_views != null || account.avg_likes != null) ? `
<p style="font-size:13px;font-weight:600;margin:14px 0 8px;color:#737373;">Moyennes par vidéo</p>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;">
  ${metricCard("Vues", account.avg_views)}
  ${metricCard("Likes", account.avg_likes)}
  ${metricCard("Commentaires", account.avg_comments)}
  ${metricCard("Saves", account.avg_saves)}
  ${metricCard("Partages", account.avg_shares)}
</div>` : ""}

${(account.median_views != null || account.median_likes != null) ? `
<p style="font-size:13px;font-weight:600;margin:14px 0 8px;color:#737373;">Médianes par vidéo</p>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px;">
  ${metricCard("Vues", account.median_views)}
  ${metricCard("Likes", account.median_likes)}
  ${metricCard("Commentaires", account.median_comments)}
  ${metricCard("Saves", account.median_saves)}
  ${metricCard("Partages", account.median_shares)}
</div>` : ""}

<!-- HASHTAGS -->
${account.top_hashtags?.length ? `
${sectionTitle("#", "Top Hashtags")}
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
  ${account.top_hashtags.map((h: any) => {
    const tag = typeof h === "string" ? h : h.tag || h.name;
    const count = typeof h === "object" ? h.count : null;
    return `<span style="display:inline-block;background:#0F0F0F;color:#C4A34A;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;">#${escapeHtml(tag)}${count ? ` <span style="color:#737373;font-weight:400;">(${count})</span>` : ""}</span>`;
  }).join("")}
</div>` : ""}

<!-- BEST TIMES -->
${pubPattern.best_times?.length ? `
${sectionTitle("🕐", "Meilleurs Créneaux de Publication")}
${pubPattern.publication_frequency?.weekly_pattern ? `<p style="font-size:12px;color:#737373;margin-bottom:8px;">Fréquence : <strong style="color:#0F0F0F;">${escapeHtml(pubPattern.publication_frequency.weekly_pattern)}</strong></p>` : ""}
${pubPattern.consistency_score != null ? `<p style="font-size:12px;color:#737373;margin-bottom:10px;">Score de régularité : <strong style="color:#0F0F0F;">${pubPattern.consistency_score}/100</strong></p>` : ""}
<div style="margin-bottom:8px;">
  ${pubPattern.best_times.slice(0, 5).map((t: any, i: number) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:${i % 2 === 0 ? "#FAFAF5" : "#fff"};border:1px solid #e5e5e5;border-radius:8px;padding:10px 16px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:16px;font-weight:800;color:#C4A34A;">#${i + 1}</span>
        <span style="font-size:13px;"><strong>${DAYS[t.day] || t.day}</strong> à ${String(t.hour).padStart(2, "0")}h00</span>
      </div>
      <div style="text-align:right;">
        <span style="font-size:14px;font-weight:700;">${formatNumber(t.avg_views)}</span>
        <span style="font-size:11px;color:#737373;"> vues moy.</span>
      </div>
    </div>
  `).join("")}
</div>
${pubPattern.recommendations?.length ? `
<div style="background:#FAFAF5;border:1px solid #e5e5e5;border-radius:10px;padding:14px 18px;margin-bottom:8px;">
  <p style="font-size:13px;font-weight:600;margin-bottom:6px;">Recommandations</p>
  <ul style="padding-left:18px;margin:0;">
    ${pubPattern.recommendations.map((r: string) => `<li style="font-size:12px;color:#737373;margin:3px 0;">${escapeHtml(r)}</li>`).join("")}
  </ul>
</div>` : ""}
` : ""}

<!-- REGULARITY -->
${Object.keys(breakdown).length > 0 ? `
${sectionTitle("📊", "Régularité Détaillée")}
<div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:18px;margin-bottom:8px;">
  ${Object.entries(breakdown).map(([key, val]: [string, any]) => 
    scoreBar(val.label || key, val.score || 0, val.detail || val.status || "")
  ).join("")}
</div>` : ""}

<!-- PERSONA -->
${persona.niche_principale || persona.forces?.length || persona.faiblesses?.length ? `
${sectionTitle("🎯", "Persona Identifié")}
<div style="background:#FAFAF5;border:1px solid #e5e5e5;border-radius:12px;padding:18px;margin-bottom:8px;">
  ${persona.niche_principale ? `<p style="font-size:13px;margin-bottom:10px;"><strong>Niche :</strong> ${escapeHtml(persona.niche_principale)}</p>` : ""}
  ${persona.forces?.length ? `
    <p style="font-size:13px;font-weight:600;margin-bottom:4px;">Forces</p>
    <ul style="padding-left:18px;margin:0 0 10px;">
      ${persona.forces.map((f: string) => `<li style="font-size:12px;color:#737373;margin:2px 0;"><span style="color:#22c55e;font-weight:700;">✓</span> ${escapeHtml(f)}</li>`).join("")}
    </ul>` : ""}
  ${persona.faiblesses?.length ? `
    <p style="font-size:13px;font-weight:600;margin-bottom:4px;">Points d'amélioration</p>
    <ul style="padding-left:18px;margin:0;">
      ${persona.faiblesses.map((f: string) => `<li style="font-size:12px;color:#737373;margin:2px 0;"><span style="color:#f97316;font-weight:700;">!</span> ${escapeHtml(f)}</li>`).join("")}
    </ul>` : ""}
</div>` : ""}

<!-- AI INSIGHTS -->
${account.ai_insights ? `
${sectionTitle("🤖", "Analyse Détaillée (IA)")}
<div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:18px;margin-bottom:8px;">
  ${renderMarkdownToHtml(account.ai_insights)}
</div>` : ""}

<!-- FOOTER -->
<div class="section-block" style="margin-top:40px;padding-top:16px;border-top:2px solid #C4A34A;display:flex;justify-content:space-between;align-items:center;">
  <p style="font-size:11px;color:#737373;">Généré par <strong style="color:#C4A34A;">FredWav</strong> — ${escapeHtml(dateStr)}</p>
  <p style="font-size:11px;color:#737373;">fredwav.lovable.app</p>
</div>

<!-- PRINT BUTTON -->
<button class="print-btn no-print" onclick="window.print()">🖨️ Enregistrer en PDF</button>

<script>window.onload = function() { setTimeout(function() { window.print(); }, 800); };</script>

</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, username, data } = await req.json();
    if (!session_id || !username) throw new Error("session_id et username requis");
    if (!data) throw new Error("Les données d'analyse sont requises");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Paiement non confirmé");
    }

    const htmlContent = generateReport(username, data);

    return new Response(JSON.stringify({ html: htmlContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
