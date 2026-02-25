/**
 * Génère le HTML complet du rapport PDF avec CSS intégré — Style FredWav (crème/or/noir).
 * v2 — Design premium, anti-coupure renforcé. Typographie inchangée.
 */

import { PDFDataFormat, BestTime } from "./pdf-data-mapper";

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) {
      result.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      result.push("</ol>");
      inOl = false;
    }
  }

  function inlineFormat(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.match(/^### (.+)/)) {
      closeLists();
      result.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.match(/^## (.+)/)) {
      closeLists();
      result.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.match(/^[-*] (.+)/)) {
      if (inOl) {
        result.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        result.push("<ul>");
        inUl = true;
      }
      result.push(`<li>${inlineFormat(line.replace(/^[-*] /, ""))}</li>`);
    } else if (line.match(/^\d+\. (.+)/)) {
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        result.push("<ol>");
        inOl = true;
      }
      result.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ""))}</li>`);
    } else if (line.trim() === "") {
      closeLists();
    } else {
      closeLists();
      result.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeLists();
  return result.join("\n");
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const REGULARITY_LABELS: Record<string, string> = {
  no_gaps_72h: "Pas de pause > 72h",
  weekly_volume: "Volume hebdo",
  day_consistency: "Régularité des jours",
  hour_consistency: "Régularité horaire",
  uniform_distribution: "Distribution uniforme",
};

function getBarColor(score: number): string {
  if (score >= 25) return "#22C55E";
  if (score >= 10) return "#EAB308";
  return "#EF4444";
}

function generateBestTimesHTML(bestTimes: BestTime[]): string {
  if (!bestTimes?.length) return "";
  const top5 = bestTimes.slice(0, 5);
  const maxViews = Math.max(...top5.map((t) => t.avg_views));

  return `
    <div class="section best-times-section avoid-break">
      <h2 class="section-title">🕐 Meilleurs Créneaux de Publication</h2>
      <div class="best-times-list">
        ${top5
          .map((t, i) => {
            const pct = maxViews > 0 ? (t.avg_views / maxViews) * 100 : 0;
            const medals = ["🥇", "🥈", "🥉", `#4`, `#5`];
            return `
          <div class="best-time-item avoid-break">
            <div class="best-time-rank">${i < 3 ? medals[i] : medals[i]}</div>
            <div class="best-time-info">
              <div class="best-time-label">${DAY_NAMES[t.day] || "Jour " + t.day} à ${String(t.hour).padStart(2, "0")}h00</div>
              <div class="best-time-bar-bg">
                <div class="best-time-bar" style="width: ${pct}%"></div>
              </div>
            </div>
            <div class="best-time-value">${formatNumber(t.avg_views)} vues</div>
          </div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function generateRegularityHTML(breakdown: Record<string, { score: number; details: string }>): string {
  if (!breakdown) return "";
  const total = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  return `
    <div class="section regularity-section avoid-break">
      <h2 class="section-title">
        📊 Régularité Détaillée
        <span class="score-badge-pill">${total}<span class="score-badge-max">/100</span></span>
      </h2>
      <div class="regularity-list">
        ${Object.entries(breakdown)
          .map(([key, item]) => {
            const pct = Math.min((item.score / 30) * 100, 100);
            return `
          <div class="regularity-item avoid-break">
            <div class="regularity-header">
              <span class="regularity-label">${REGULARITY_LABELS[key] || key}</span>
              <span class="regularity-score">${item.score}<span class="score-max">/30</span></span>
            </div>
            <div class="regularity-bar-bg">
              <div class="regularity-bar" style="width: ${pct}%; background: ${getBarColor(item.score)}"></div>
            </div>
            <div class="regularity-details">${item.details}</div>
          </div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function generatePersonaHTML(persona: { niche_principale?: string; forces?: string[]; faiblesses?: string[] }): string {
  if (!persona) return "";
  return `
    <div class="section persona-section avoid-break">
      <h2 class="section-title">🎯 Persona Identifié</h2>
      ${
        persona.niche_principale
          ? `
        <div class="persona-niche-badge">${persona.niche_principale}</div>
      `
          : ""
      }
      <div class="persona-columns">
        ${
          persona.forces?.length
            ? `
          <div class="persona-block forces-block">
            <div class="persona-block-header">
              <h4>✦ Forces</h4>
            </div>
            <ul>${persona.forces
              .map(
                (f) => `
              <li><span class="check">✓</span><span>${f}</span></li>`,
              )
              .join("")}
            </ul>
          </div>
        `
            : ""
        }
        ${
          persona.faiblesses?.length
            ? `
          <div class="persona-block weaknesses-block">
            <div class="persona-block-header">
              <h4>▲ Points d'amélioration</h4>
            </div>
            <ul>${persona.faiblesses
              .map(
                (f) => `
              <li><span class="warn">!</span><span>${f}</span></li>`,
              )
              .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

export function generateCompletePDFHTML(pdfData: PDFDataFormat, rawInsights: string, recentVideos: any[] = []): string {
  const topVideos = recentVideos.slice(0, 5);
  const topHashtags = pdfData.top_hashtags || [];
  const dateStr = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* ── RESET ── */
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1A1A1A;
          line-height: 1.6;
          background: #F5EFE4;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── PAGE ── */
        .pdf-page {
          background: #FBF6EE;
          padding: 44px 48px;
          margin: 0 auto;
          max-width: 210mm;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .content-wrapper { flex: 1; }

        /* ── ANTI-COUPURE GLOBAL ── */
        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* ── TOP BAR ── */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          margin-bottom: 30px;
          border-bottom: 2px solid #C49A3C;
          position: relative;
        }
        /* Accent sous le logo */
        .top-bar::after {
          content: '';
          position: absolute;
          bottom: -5px; left: 0;
          width: 56px; height: 3px;
          background: #C49A3C;
          border-radius: 0 0 2px 2px;
        }
        .top-bar-brand {
          font-size: 24px;
          font-weight: 700;
          color: #C49A3C;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .top-bar-brand-icon { font-size: 18px; }
        .top-bar-right { text-align: right; }
        .top-bar-right .subtitle { font-size: 14px; color: #A67C2E; font-weight: 600; }
        .top-bar-right .meta { font-size: 12px; color: #6B7280; margin-top: 2px; }

        /* ── PROFILE ── */
        .profile {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
          padding: 22px 24px;
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        /* Barre latérale dorée */
        .profile::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: linear-gradient(180deg, #C49A3C 0%, #A67C2E 100%);
        }
        .profile-avatar {
          width: 90px; height: 90px;
          border-radius: 50%;
          border: 3px solid #C49A3C;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(196,154,60,0.20);
        }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { flex: 1; padding-top: 2px; }
        .profile-name { font-size: 22px; font-weight: 700; color: #1A1A1A; margin-bottom: 2px; }
        .profile-handle { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .profile-username { font-size: 14px; color: #A67C2E; }
        .profile-verified {
          background: #C49A3C;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .profile-bio { font-size: 13px; color: #6B7280; line-height: 1.5; white-space: pre-wrap; }

        /* ── SECTIONS ── */
        .section { margin-bottom: 28px; }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #C49A3C;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── SCORE BADGE ── */
        .score-badge-pill {
          margin-left: auto;
          background: linear-gradient(135deg, #C49A3C, #A67C2E);
          color: white;
          font-size: 13px;
          font-weight: 700;
          padding: 2px 12px;
          border-radius: 20px;
          text-transform: none;
          letter-spacing: 0;
        }
        .score-badge-max { font-size: 11px; opacity: 0.75; }
        .score-max { color: #BDB5A6; }

        /* ── STATS GRID 4 ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        /* Trait doré bas de carte */
        .stat-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 25%; right: 25%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C49A3C, transparent);
        }
        .stat-value { font-size: 20px; font-weight: 700; color: #C49A3C; margin-bottom: 4px; }
        .stat-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── STATS GRID 5 ── */
        .stats-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .stats-grid-5 .stat-card { padding: 12px; }
        .stats-grid-5 .stat-value { font-size: 16px; }

        /* ── SUB TITLE ── */
        .sub-title {
          font-size: 13px;
          font-weight: 600;
          color: #A67C2E;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sub-title::before {
          content: '';
          display: inline-block;
          width: 14px; height: 2px;
          background: #C49A3C;
          border-radius: 1px;
          flex-shrink: 0;
        }

        /* ── HASHTAGS ── */
        .hashtags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .hashtag-badge {
          background: #FFFFFF;
          color: #A67C2E;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1.5px solid #C49A3C;
        }

        /* ── BEST TIMES ── */
        .best-times-list { display: flex; flex-direction: column; gap: 8px; }
        .best-time-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 8px;
          padding: 12px 16px;
        }
        .best-time-item:first-child { border-color: #C49A3C; }
        .best-time-rank { font-size: 18px; min-width: 30px; text-align: center; }
        .best-time-info { flex: 1; }
        .best-time-label { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
        .best-time-bar-bg {
          background: #F0EBE1;
          border-radius: 4px; height: 8px; overflow: hidden;
        }
        .best-time-bar {
          background: linear-gradient(90deg, #C49A3C, #E8B84B);
          height: 100%; border-radius: 4px;
        }
        .best-time-value { font-size: 13px; font-weight: 700; color: #C49A3C; min-width: 80px; text-align: right; }

        /* ── REGULARITY ── */
        .regularity-list { display: flex; flex-direction: column; gap: 12px; }
        .regularity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .regularity-label { font-size: 13px; font-weight: 500; color: #1A1A1A; }
        .regularity-score { font-size: 13px; font-weight: 600; color: #1A1A1A; }
        .regularity-bar-bg {
          background: #F0EBE1;
          border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 4px;
        }
        .regularity-bar { height: 100%; border-radius: 4px; }
        .regularity-details { font-size: 11px; color: #6B7280; }

        /* ── PERSONA ── */
        .persona-section {
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .persona-section .section-title { margin-top: 0; }
        .persona-niche-badge {
          display: inline-block;
          background: linear-gradient(135deg, #C49A3C, #A67C2E);
          color: white;
          font-size: 13px;
          font-weight: 600;
          padding: 5px 16px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .persona-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .persona-block {
          background: #FDFAF5;
          border: 1px solid #EDE8DF;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .persona-block-header { margin-bottom: 10px; }
        .persona-block h4 { font-size: 13px; font-weight: 600; color: #A67C2E; }
        .persona-block ul { list-style: none; padding: 0; }
        .persona-block li {
          font-size: 13px; color: #6B7280;
          margin-bottom: 5px;
          display: flex; gap: 8px; line-height: 1.45;
        }
        .persona-block .check { color: #22C55E; font-weight: 700; flex-shrink: 0; }
        .persona-block .warn { color: #EAB308; font-weight: 700; flex-shrink: 0; }

        /* ── TOP VIDEOS ── */
        .video-item {
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 8px;
        }
        .video-item:last-child { margin-bottom: 0; }
        .video-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }
        .video-index {
          font-size: 11px;
          font-weight: 700;
          color: #C49A3C;
          background: #FBF6EE;
          border: 1px solid #E5E1D8;
          border-radius: 6px;
          padding: 3px 8px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .video-title { font-size: 13px; font-weight: 600; color: #1A1A1A; line-height: 1.4; }
        .video-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          padding-top: 10px;
          border-top: 1px solid #F0EBE1;
        }
        .video-stat-label {
          font-size: 10px; color: #6B7280;
          text-transform: uppercase; font-weight: 500;
          letter-spacing: 0.5px; margin-bottom: 2px;
        }
        .video-stat-value { color: #C49A3C; font-weight: 700; font-size: 13px; }

        /* ── AI INSIGHTS ── */
        .insights-section {
          background: #FFFFFF;
          border: 1px solid #E5E1D8;
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 40px;
        }
        .insights-content { font-size: 13px; color: #374151; line-height: 1.7; }
        .insights-content h2 {
          font-size: 16px; font-weight: 700; color: #1A1A1A;
          margin: 22px 0 10px 0;
          padding: 8px 14px;
          background: #FBF6EE;
          border-left: 3px solid #C49A3C;
          border-radius: 0 6px 6px 0;
          page-break-inside: avoid; break-inside: avoid;
          page-break-after: avoid; break-after: avoid;
        }
        .insights-content h3 {
          font-size: 14px; font-weight: 600; color: #A67C2E;
          margin: 14px 0 6px 0;
          page-break-inside: avoid; break-inside: avoid;
          page-break-after: avoid; break-after: avoid;
        }
        .insights-content strong { font-weight: 700; color: #1A1A1A; }
        .insights-content ul, .insights-content ol { padding-left: 20px; margin: 8px 0; }
        .insights-content li {
          margin-bottom: 4px;
          page-break-inside: avoid; break-inside: avoid;
        }
        .insights-content p {
          margin-bottom: 8px;
          page-break-inside: avoid; break-inside: avoid;
        }

        /* ── FOOTER ── */
        .footer {
          margin-top: auto;
          padding-top: 24px;
          padding-bottom: 16px;
          border-top: 2px solid #C49A3C;
          text-align: center;
          font-size: 11px;
          color: #6B7280;
        }
        .footer-brand { font-weight: 700; color: #C49A3C; font-size: 14px; margin-bottom: 4px; }

        /* ── PRINT ── */
        @media print {
          body { margin: 0; padding: 0; }
          .pdf-page { box-shadow: none; margin: 0; max-width: 100%; min-height: 100%; }
        }
        @page { margin: 0; size: A4; }

        /* Blocs entiers à ne pas couper */
        .stat-card, .stats-grid, .stats-grid-5,
        .profile, .best-time-item, .video-item,
        .regularity-item, .persona-section, .persona-block,
        .top-bar, .section, .insights-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        /* Un titre ne doit jamais rester seul en bas de page */
        .section-title, .sub-title,
        .insights-content h2, .insights-content h3 {
          page-break-after: avoid;
          break-after: avoid;
        }
        /* Les paragraphes et items ne se coupent pas */
        .insights-content p,
        .insights-content li {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="pdf-page">
        <div class="content-wrapper">

          <!-- TOP BAR -->
          <div class="top-bar avoid-break">
            <div class="top-bar-brand">
              <span class="top-bar-brand-icon">⚡</span>FredWav
            </div>
            <div class="top-bar-right">
              <div class="subtitle">Analyse TikTok Express</div>
              <div class="meta">${dateStr} • @${pdfData.username}</div>
            </div>
          </div>

          <!-- PROFILE -->
          <div class="profile avoid-break">
            ${
              pdfData.avatar_url
                ? `
              <div class="profile-avatar">
                <img src="${pdfData.avatar_url}" alt="Avatar" crossorigin="anonymous">
              </div>
            `
                : ""
            }
            <div class="profile-info">
              <div class="profile-name">${pdfData.display_name || pdfData.username}</div>
              <div class="profile-handle">
                <span class="profile-username">@${pdfData.username}</span>
                ${pdfData.verified ? `<span class="profile-verified">✓ Vérifié</span>` : ""}
              </div>
              ${pdfData.bio ? `<div class="profile-bio">${pdfData.bio}</div>` : ""}
            </div>
          </div>

          <!-- KEY METRICS -->
          <div class="section avoid-break">
            <h2 class="section-title">📊 Métriques Clés</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.follower_count)}</div>
                <div class="stat-label">Abonnés</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.total_likes || pdfData.like_count)}</div>
                <div class="stat-label">Likes totaux</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.video_count)}</div>
                <div class="stat-label">Vidéos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${(pdfData.engagement_rate || 0).toFixed(2)}%</div>
                <div class="stat-label">Engagement</div>
              </div>
            </div>

            <div class="sub-title">Moyennes par vidéo</div>
            <div class="stats-grid-5">
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.avg_views)}</div>
                <div class="stat-label">Vues</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.avg_likes)}</div>
                <div class="stat-label">Likes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.avg_comments)}</div>
                <div class="stat-label">Commentaires</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.avg_saves)}</div>
                <div class="stat-label">Sauvegardes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.avg_shares)}</div>
                <div class="stat-label">Partages</div>
              </div>
            </div>

            <div class="sub-title">Médianes par vidéo</div>
            <div class="stats-grid-5">
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.median_views)}</div>
                <div class="stat-label">Vues</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.median_likes)}</div>
                <div class="stat-label">Likes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.median_comments)}</div>
                <div class="stat-label">Commentaires</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.median_saves)}</div>
                <div class="stat-label">Sauvegardes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.stats.median_shares)}</div>
                <div class="stat-label">Partages</div>
              </div>
            </div>
          </div>

          <!-- HASHTAGS -->
          ${
            topHashtags.length > 0
              ? `
          <div class="section avoid-break">
            <h2 class="section-title">#️⃣ Top Hashtags</h2>
            <div class="hashtags-wrap">
              ${topHashtags
                .slice(0, 10)
                .map((tag) => `<span class="hashtag-badge">${tag.startsWith("#") ? tag : "#" + tag}</span>`)
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- BEST TIMES -->
          ${generateBestTimesHTML(pdfData.best_times || [])}

          <!-- REGULARITY -->
          ${pdfData.regularity_breakdown ? generateRegularityHTML(pdfData.regularity_breakdown) : ""}

          <!-- PERSONA -->
          ${pdfData.persona ? generatePersonaHTML(pdfData.persona) : ""}

          <!-- TOP VIDEOS -->
          ${
            topVideos.length > 0
              ? `
          <div class="section">
            <h2 class="section-title">🎥 Top vidéos récentes</h2>
            ${topVideos
              .map(
                (video, i) => `
              <div class="video-item avoid-break">
                <div class="video-header">
                  <span class="video-index">#${i + 1}</span>
                  <span class="video-title">${video.title || video.description || "Vidéo"}</span>
                </div>
                <div class="video-stats">
                  <div>
                    <div class="video-stat-label">Vues</div>
                    <div class="video-stat-value">${formatNumber(video.view_count)}</div>
                  </div>
                  <div>
                    <div class="video-stat-label">Likes</div>
                    <div class="video-stat-value">${formatNumber(video.like_count)}</div>
                  </div>
                  <div>
                    <div class="video-stat-label">Commentaires</div>
                    <div class="video-stat-value">${formatNumber(video.comment_count)}</div>
                  </div>
                  <div>
                    <div class="video-stat-label">Partages</div>
                    <div class="video-stat-value">${formatNumber(video.share_count)}</div>
                  </div>
                  <div>
                    <div class="video-stat-label">Sauvegardes</div>
                    <div class="video-stat-value">${formatNumber(video.save_count)}</div>
                  </div>
                  <div>
                    <div class="video-stat-label">Engagement</div>
                    <div class="video-stat-value">${(video.engagement_rate || 0).toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

          <!-- AI INSIGHTS -->
          ${
            rawInsights
              ? `
          <div class="insights-section avoid-break">
            <h2 class="section-title">📝 Analyse détaillée & insights IA</h2>
            <div class="insights-content">${markdownToHtml(rawInsights)}</div>
          </div>
          `
              : ""
          }

        </div>

        <!-- FOOTER -->
        <div class="footer avoid-break">
          <div class="footer-brand">⚡ FredWav</div>
          <p>Analyse TikTok Express — Rapport généré le ${dateStr}</p>
          <p><a href="https://fredwav.com" target="_blank">fredwav.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
