/**
 * Generates the full HTML for the TikTok analysis PDF report -- FredWav branding (cream/gold/dark).
 * v4 -- Shadowban status, publication frequency, section icons, improved cover, enhanced executive summary.
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
  day_consistency: "R\u00e9gularit\u00e9 des jours",
  hour_consistency: "R\u00e9gularit\u00e9 horaire",
  uniform_distribution: "Distribution uniforme",
};

function getBarColor(score: number): string {
  if (score >= 25) return "#22C55E";
  if (score >= 10) return "#EAB308";
  return "#EF4444";
}

function getHealthBarColor(score: number): string {
  if (score >= 70) return "#22C55E";
  if (score >= 40) return "#EAB308";
  return "#EF4444";
}

const HEALTH_COMPONENT_LABELS: Record<string, string> = {
  engagement: "Engagement",
  consistency: "R\u00e9gularit\u00e9",
  content_quality: "Qualit\u00e9 du contenu",
  growth_potential: "Potentiel de croissance",
  technical_seo: "SEO technique",
};

function generateDonutSVG(score: number): string {
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  let color = "#22C55E";
  if (pct < 40) color = "#EF4444";
  else if (pct < 70) color = "#EAB308";

  return `
    <svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:0 auto;">
      <circle cx="100" cy="100" r="${radius}" fill="none" stroke="#2A2520" stroke-width="${strokeWidth}"/>
      <circle cx="100" cy="100" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 100 100)"/>
      <text x="100" y="92" text-anchor="middle" fill="#C49A3C" font-family="Georgia, serif" font-size="48" font-weight="700">${pct}</text>
      <text x="100" y="118" text-anchor="middle" fill="#9CA3AF" font-family="Inter, sans-serif" font-size="14">/100</text>
    </svg>`;
}

function generateCoverPage(
  pdfData: PDFDataFormat,
  dateStr: string,
  healthScoreData?: any
): string {
  const overallScore =
    typeof healthScoreData === "object" && healthScoreData !== null
      ? healthScoreData.total ?? healthScoreData.global ?? healthScoreData.score ?? 0
      : typeof healthScoreData === "number"
        ? healthScoreData
        : pdfData.health_score ?? 0;

  return `
    <div class="cover-page">
      <div class="cover-top-accent"></div>
      <div class="cover-content">
        <div class="cover-brand">FredWav</div>
        <div class="cover-subtitle">RAPPORT D'ANALYSE TIKTOK</div>
        <div class="cover-divider"></div>
        <div class="cover-profile">
          ${pdfData.avatar_url
      ? `<div class="cover-avatar"><img src="${pdfData.avatar_url}" alt="Avatar" crossorigin="anonymous"></div>`
      : `<div class="cover-avatar-placeholder"></div>`
    }
          <div class="cover-username">@${pdfData.username}</div>
          ${pdfData.display_name && pdfData.display_name !== pdfData.username
      ? `<div class="cover-display-name">${pdfData.display_name}</div>`
      : ""
    }
        </div>
        ${overallScore > 0 ? `
        <div class="cover-score-section">
          <div class="cover-score-label">Score de Sant\u00e9 du Compte</div>
          ${generateDonutSVG(overallScore)}
        </div>
        ` : ""}
        <div class="cover-features">
          <div class="cover-feature-item">&#10003; Score de sant&eacute; d&eacute;taill&eacute;</div>
          <div class="cover-feature-item">&#10003; M&eacute;triques cl&eacute;s &amp; engagement</div>
          <div class="cover-feature-item">&#10003; Meilleurs cr&eacute;neaux de publication</div>
          <div class="cover-feature-item">&#10003; Analyse IA approfondie</div>
          <div class="cover-feature-item">&#10003; Persona &amp; axes d&apos;am&eacute;lioration</div>
        </div>
        <div class="cover-date">${dateStr}</div>
      </div>
      <div class="cover-footer-line">
        Confidentiel &bull; Pr&eacute;par&eacute; exclusivement pour @${pdfData.username}
      </div>
    </div>`;
}

function generateExecutiveSummary(
  pdfData: PDFDataFormat,
  healthScoreData?: any
): string {
  const overallScore =
    typeof healthScoreData === "object" && healthScoreData !== null
      ? healthScoreData.total ?? healthScoreData.global ?? healthScoreData.score ?? 0
      : typeof healthScoreData === "number"
        ? healthScoreData
        : pdfData.health_score ?? 0;

  let verdict = "Score non disponible";
  let verdictColor = "#9CA3AF";
  if (overallScore >= 80) { verdict = "Excellent — compte tr\u00e8s performant"; verdictColor = "#22C55E"; }
  else if (overallScore >= 60) { verdict = "Bon — marge d'optimisation"; verdictColor = "#84CC16"; }
  else if (overallScore >= 40) { verdict = "Moyen — axes d'am\u00e9lioration significatifs"; verdictColor = "#EAB308"; }
  else if (overallScore > 0) { verdict = "Faible — actions prioritaires requises"; verdictColor = "#EF4444"; }

  const niche = pdfData.persona?.niche_principale || pdfData.niche || null;
  const topForce = pdfData.persona?.forces?.[0] || null;
  const topWeakness = pdfData.persona?.faiblesses?.[0] || null;

  // Build items dynamically — only show what we actually have
  const items: string[] = [];
  if (niche) {
    items.push(`<div class="exec-item"><div class="exec-item-label">Niche d&eacute;tect&eacute;e</div><div class="exec-item-value">${niche}</div></div>`);
  }
  if (topForce) {
    items.push(`<div class="exec-item"><div class="exec-item-label">Force principale</div><div class="exec-item-value exec-force">${topForce}</div></div>`);
  }
  if (topWeakness) {
    items.push(`<div class="exec-item"><div class="exec-item-label">Axe d&apos;am&eacute;lioration</div><div class="exec-item-value exec-weakness">${topWeakness}</div></div>`);
  }
  // Verdict is always shown
  items.push(`<div class="exec-item exec-item-verdict"><div class="exec-item-label">Verdict Sant&eacute;</div><div class="exec-item-value" style="color:${verdictColor}">${overallScore > 0 ? `<span style="font-size:18px;font-weight:800;">${overallScore}/100</span> — ` : ""}${verdict}</div></div>`);

  // Add engagement rate as a bonus metric if available
  if (pdfData.engagement_rate && pdfData.engagement_rate > 0) {
    items.push(`<div class="exec-item"><div class="exec-item-label">Taux d&apos;engagement</div><div class="exec-item-value">${pdfData.engagement_rate.toFixed(2)}%</div></div>`);
  }
  if (pdfData.follower_count && pdfData.follower_count > 0) {
    items.push(`<div class="exec-item"><div class="exec-item-label">Abonn&eacute;s</div><div class="exec-item-value">${formatNumber(pdfData.follower_count)}</div></div>`);
  }

  return `
    <div class="section executive-summary avoid-break">
      <h2 class="section-title">&#9733; R&eacute;sum&eacute; Ex&eacute;cutif</h2>
      <div class="exec-grid">
        ${items.join("\n        ")}
      </div>
    </div>`;
}

function generateHealthScoreDetailHTML(healthScoreData?: any): string {
  if (!healthScoreData || typeof healthScoreData !== "object") return "";

  const components: Record<string, number> = healthScoreData.components || {};
  const priorityActions: string[] = healthScoreData.priority_actions || [];

  const hasComponents = Object.keys(components).length > 0;
  if (!hasComponents && priorityActions.length === 0) return "";

  return `
    <div class="section health-detail-section avoid-break">
      <h2 class="section-title">&#10084; Score de Sant&eacute; - D&eacute;tail</h2>
      ${hasComponents ? `
      <div class="health-components">
        ${Object.entries(components).map(([key, value]) => {
    const score = typeof value === "number" ? value : 0;
    const pct = Math.min(score, 100);
    const color = getHealthBarColor(score);
    const label = HEALTH_COMPONENT_LABELS[key] || key.replace(/_/g, " ");
    return `
          <div class="health-component-row avoid-break">
            <div class="health-component-header">
              <span class="health-component-label">${label}</span>
              <span class="health-component-score" style="color:${color}">${score}<span class="score-max">/100</span></span>
            </div>
            <div class="health-bar-bg">
              <div class="health-bar" style="width:${pct}%;background:${color}"></div>
            </div>
          </div>`;
  }).join("")}
      </div>
      ` : ""}
      ${priorityActions.length > 0 ? `
      <div class="priority-actions">
        <div class="priority-actions-title">Actions prioritaires</div>
        <ul>
          ${priorityActions.map((action: string) => `<li>${action}</li>`).join("")}
        </ul>
      </div>
      ` : ""}
    </div>`;
}

function generateBestTimesHTML(bestTimes: BestTime[]): string {
  if (!bestTimes?.length) return "";
  const top5 = bestTimes.slice(0, 5);
  const maxViews = Math.max(...top5.map((t) => t.avg_views));

  return `
    <div class="section best-times-section avoid-break">
      <h2 class="section-title">&#8987; Meilleurs Cr&eacute;neaux de Publication</h2>
      <div class="best-times-list">
        ${top5
      .map((t, i) => {
        const pct = maxViews > 0 ? (t.avg_views / maxViews) * 100 : 0;
        const medals = ["#1", "#2", "#3", "#4", "#5"];
        return `
          <div class="best-time-item avoid-break">
            <div class="best-time-rank">${medals[i]}</div>
            <div class="best-time-info">
              <div class="best-time-label">${DAY_NAMES[t.day] || "Jour " + t.day} a ${String(t.hour).padStart(2, "0")}h00</div>
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
        &#128260; R&eacute;gularit&eacute; D&eacute;taill&eacute;e
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
      <h2 class="section-title">&#127775; Persona Identifi&eacute;</h2>
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
              <h4>Forces</h4>
            </div>
            <ul>${persona.forces
          .map(
            (f) => `
              <li><span class="check">+</span><span>${f}</span></li>`,
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
              <h4>Points d'am\u00e9lioration</h4>
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

function getShadowbanColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("aucun") || s.includes("non") || s.includes("none") || s.includes("low")) return "#22C55E";
  if (s.includes("mod") || s.includes("medium")) return "#EAB308";
  if (s.includes("probable") || s.includes("confirm") || s.includes("high")) return "#EF4444";
  return "#9CA3AF";
}

function generateShadowbanHTML(pdfData: PDFDataFormat): string {
  if (!pdfData.shadowban_status || pdfData.shadowban_status === "Non analysé") return "";
  const color = getShadowbanColor(pdfData.shadowban_status);
  return `
    <div class="section shadowban-section avoid-break">
      <h2 class="section-title">&#9888; Statut Shadowban</h2>
      <div class="shadowban-card" style="border-left: 4px solid ${color};">
        <div class="shadowban-indicator" style="background:${color};"></div>
        <div class="shadowban-text">
          <div class="shadowban-status" style="color:${color};">${pdfData.shadowban_status}</div>
          <div class="shadowban-hint">Basé sur l'analyse des 30 derniers jours d'activité du compte</div>
        </div>
      </div>
    </div>`;
}

function generatePublicationFrequencyHTML(pdfData: PDFDataFormat): string {
  const freq = pdfData.publication_frequency;
  const consistency = pdfData.consistency_score;
  const recs = pdfData.recommendations;

  if (!freq && consistency === undefined && (!recs || recs.length === 0)) return "";

  const dailyAvg = freq?.daily_avg;
  const weeklyPattern = freq?.weekly_pattern;

  return `
    <div class="section pubfreq-section avoid-break">
      <h2 class="section-title">&#128197; Fréquence de Publication</h2>
      <div class="pubfreq-grid">
        ${dailyAvg !== undefined ? `
        <div class="pubfreq-card">
          <div class="pubfreq-value">${dailyAvg.toFixed(1)}</div>
          <div class="pubfreq-label">Vidéos / jour</div>
        </div>` : ""}
        ${dailyAvg !== undefined ? `
        <div class="pubfreq-card">
          <div class="pubfreq-value">${(dailyAvg * 7).toFixed(1)}</div>
          <div class="pubfreq-label">Vidéos / semaine</div>
        </div>` : ""}
        ${consistency !== undefined ? `
        <div class="pubfreq-card">
          <div class="pubfreq-value" style="color:${consistency >= 70 ? "#22C55E" : consistency >= 40 ? "#EAB308" : "#EF4444"}">${consistency}</div>
          <div class="pubfreq-label">Score consistance</div>
        </div>` : ""}
      </div>
      ${weeklyPattern ? `<div class="pubfreq-pattern">${weeklyPattern}</div>` : ""}
      ${recs && recs.length > 0 ? `
      <div class="pubfreq-recs">
        <div class="pubfreq-recs-title">Recommandations de publication</div>
        <ul>
          ${recs.map(r => `<li>${r}</li>`).join("")}
        </ul>
      </div>` : ""}
    </div>`;
}

function generateCTASection(): string {
  return `
    <div class="section cta-section avoid-break">
      <div class="cta-box">
        <div class="cta-heading">Pr\u00eat \u00e0 transformer ces insights en r\u00e9sultats concrets ?</div>
        <div class="cta-benefits">
          <div class="cta-benefit-item">
            <span class="cta-bullet"></span>
            <span>Strat\u00e9gie de contenu personnalis\u00e9e pour ta niche</span>
          </div>
          <div class="cta-benefit-item">
            <span class="cta-bullet"></span>
            <span>Plan d'action concret pour booster ton engagement</span>
          </div>
          <div class="cta-benefit-item">
            <span class="cta-bullet"></span>
            <span>Accompagnement 1:1 avec un expert TikTok</span>
          </div>
        </div>
        <a class="cta-link-box" href="https://fredwav.com/contact" target="_blank">
          <span class="cta-link-label">Contacter Fred</span>
          <span class="cta-link-arrow">&rarr;</span>
          <span class="cta-link-url">fredwav.com/contact</span>
        </a>
      </div>
      <div class="cta-attribution">
        Analyse r\u00e9alis\u00e9e par FredWav &bull; fredwav.com
      </div>
    </div>`;
}

export function generateCompletePDFHTML(
  pdfData: PDFDataFormat,
  rawInsights: string,
  recentVideos: any[] = [],
  healthScoreData?: any
): string {
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
  counter-reset: page;
}

/* ── COVER PAGE ── */
.cover-page {
  background: linear-gradient(180deg, #111111 0%, #1a1714 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 48px 40px 48px;
  page-break-after: always;
  break-after: page;
  position: relative;
}
.cover-top-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #C49A3C, #E8B84B, #C49A3C);
}
.cover-content {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.cover-brand {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 56px;
  font-weight: 700;
  color: #C49A3C;
  letter-spacing: 2px;
  margin-bottom: 4px;
}
.cover-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.cover-divider {
  width: 60px;
  height: 2px;
  background: #C49A3C;
  margin: 0 auto 24px auto;
}
.cover-profile { margin-bottom: 20px; }
.cover-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #C49A3C;
  overflow: hidden;
  margin: 0 auto 14px auto;
  box-shadow: 0 4px 20px rgba(196,154,60,0.30);
}
.cover-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cover-avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #C49A3C;
  background: #2A2520;
  margin: 0 auto 14px auto;
}
.cover-username {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
}
.cover-display-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9CA3AF;
}
.cover-score-section {
  margin-top: 20px;
  margin-bottom: 8px;
}
.cover-score-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.cover-date {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  margin-top: 8px;
}
.cover-footer-line {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: #4B5563;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #2A2520;
  width: 100%;
}
.cover-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  margin-bottom: 4px;
  align-items: center;
}
.cover-feature-item {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  gap: 6px;
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
  line-height: 1;
}
.top-bar-brand-icon { font-size: 18px; line-height: 1; }
.top-bar-right { text-align: right; }
.top-bar-right .subtitle { font-size: 14px; color: #A67C2E; font-weight: 600; }
.top-bar-right .meta { font-size: 12px; color: #6B7280; margin-top: 2px; }

/* ── EXECUTIVE SUMMARY ── */
.executive-summary {
  background: linear-gradient(135deg, #1a1714, #111111);
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 32px;
}
.executive-summary .section-title {
  margin-top: 0;
  background: none;
  padding: 0;
  margin-bottom: 16px;
  color: #C49A3C;
  font-size: 12px;
  letter-spacing: 2px;
}
.exec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.exec-item {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(196,154,60,0.15);
  border-radius: 10px;
  padding: 14px 16px;
}
.exec-item-label {
  font-size: 9px;
  font-weight: 700;
  color: #C49A3C;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.exec-item-value {
  font-size: 13px;
  font-weight: 500;
  color: #E5E1D8;
  line-height: 1.45;
}
.exec-item-verdict {
  grid-column: 1 / -1;
  border-color: rgba(196,154,60,0.35);
  background: rgba(196,154,60,0.10);
}
.exec-force { color: #22C55E !important; }
.exec-weakness { color: #EAB308 !important; }

/* ── PROFILE ── */
.profile {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px 28px;
  background: #FFFFFF;
  border: 1px solid #E5E1D8;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.profile::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #C49A3C, #E8B84B, #C49A3C);
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
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
.profile-bio { font-size: 13px; color: #6B7280; line-height: 1.5; white-space: pre-wrap; }

/* ── SECTIONS ── */
.section { margin-bottom: 32px; }
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #C49A3C;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 18px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #1a1714, #111111);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1;
  page-break-inside: avoid;
  break-inside: avoid;
  page-break-after: avoid;
  break-after: avoid;
}

/* ── SCORE BADGE ── */
.score-badge-pill {
  margin-left: auto;
  background: #C49A3C;
  color: #111;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  text-transform: none;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
.score-badge-max { font-size: 10px; opacity: 0.7; }
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
  border-radius: 12px;
  padding: 18px 14px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #C49A3C, #E8B84B);
  border-radius: 12px 12px 0 0;
}
.stat-value { font-size: 22px; font-weight: 800; color: #1A1A1A; margin-bottom: 4px; letter-spacing: -0.5px; }
.stat-label { font-size: 10px; color: #A67C2E; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }

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
  line-height: 1;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ── HEALTH SCORE DETAIL ── */
.health-detail-section {
  background: #FFFFFF;
  border: 1px solid #E5E1D8;
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.health-detail-section .section-title { margin-top: 0; background: none; padding: 0; color: #1A1A1A; font-size: 14px; letter-spacing: 0; text-transform: none; border-bottom: 2px solid #C49A3C; padding-bottom: 8px; border-radius: 0; }
.health-components { display: flex; flex-direction: column; gap: 14px; }
.health-component-row { }
.health-component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.health-component-label {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A1A;
}
.health-component-score {
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
.health-bar-bg {
  background: #F0EBE1;
  border-radius: 6px;
  height: 10px;
  overflow: hidden;
}
.health-bar {
  height: 100%;
  border-radius: 6px;
}
.priority-actions {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #EDE8DF;
}
.priority-actions-title {
  font-size: 13px;
  font-weight: 600;
  color: #A67C2E;
  margin-bottom: 10px;
}
.priority-actions ul {
  list-style: none;
  padding: 0;
}
.priority-actions li {
  font-size: 13px;
  color: #374151;
  padding: 6px 0 6px 18px;
  position: relative;
  line-height: 1.5;
}
.priority-actions li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C49A3C;
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.best-time-item:first-child { border-color: #C49A3C; }
.best-time-rank {
  font-size: 13px;
  font-weight: 700;
  color: #C49A3C;
  min-width: 30px;
  text-align: center;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
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
.best-time-value {
  font-size: 13px;
  font-weight: 700;
  color: #C49A3C;
  min-width: 80px;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* ── REGULARITY ── */
.regularity-list { display: flex; flex-direction: column; gap: 12px; }
.regularity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.regularity-label { font-size: 13px; font-weight: 500; color: #1A1A1A; }
.regularity-score {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
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
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.persona-section .section-title { margin-top: 0; background: none; padding: 0; color: #1A1A1A; font-size: 14px; letter-spacing: 0; text-transform: none; border-bottom: 2px solid #C49A3C; padding-bottom: 8px; border-radius: 0; }
.persona-niche-badge {
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #C49A3C, #A67C2E);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 16px;
  line-height: 1;
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
.persona-block h4 {
  font-size: 13px;
  font-weight: 600;
  color: #A67C2E;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}
.persona-block ul { list-style: none; padding: 0; }
.persona-block li {
  font-size: 13px; color: #6B7280;
  margin-bottom: 5px;
  display: flex;
  align-items: flex-start;
  gap: 8px; line-height: 1.45;
}
.persona-block .check {
  color: #22C55E;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1.45;
}
.persona-block .warn {
  color: #EAB308;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1.45;
}

/* ── TOP VIDEOS ── */
.video-item {
  background: #FFFFFF;
  border: 1px solid #E5E1D8;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
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
  display: inline-flex;
  align-items: center;
  line-height: 1;
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
  border-radius: 14px;
  padding: 28px 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.insights-content { font-size: 13px; color: #374151; line-height: 1.7; }
.insights-content h2 {
  font-size: 16px; font-weight: 700; color: #1A1A1A;
  margin: 22px 0 10px 0;
  padding: 8px 14px;
  background: #FBF6EE;
  border-left: 3px solid #C49A3C;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  line-height: 1.2;
  page-break-inside: avoid; break-inside: avoid;
  page-break-after: avoid; break-after: avoid;
}
.insights-content h3 {
  font-size: 14px; font-weight: 600; color: #A67C2E;
  margin: 14px 0 6px 0;
  display: flex;
  align-items: center;
  line-height: 1.2;
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

/* ── CTA SECTION ── */
.cta-section {
  margin-bottom: 28px;
}
.cta-box {
  background: linear-gradient(135deg, #1a1714 0%, #111111 100%);
  border-radius: 12px;
  padding: 28px 32px;
  color: #FFFFFF;
}
.cta-heading {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 700;
  color: #C49A3C;
  margin-bottom: 18px;
  line-height: 1.3;
}
.cta-benefits {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
}
.cta-benefit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #D1D5DB;
  line-height: 1.4;
}
.cta-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C49A3C;
  flex-shrink: 0;
}
.cta-link-box {
  background: rgba(196,154,60,0.12);
  border: 1px solid rgba(196,154,60,0.30);
  border-radius: 8px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  cursor: pointer;
}
.cta-link-label {
  font-size: 14px;
  font-weight: 700;
  color: #C49A3C;
}
.cta-link-arrow {
  font-size: 16px;
  color: #C49A3C;
}
.cta-link-url {
  font-size: 12px;
  color: #9CA3AF;
  margin-left: auto;
}
.cta-attribution {
  text-align: center;
  font-size: 11px;
  color: #6B7280;
  margin-top: 14px;
}

/* ── SHADOWBAN ── */
.shadowban-section { }
.shadowban-card {
  background: #FFFFFF;
  border: 1px solid #E5E1D8;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.shadowban-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
.shadowban-text { flex: 1; }
.shadowban-status {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}
.shadowban-hint {
  font-size: 12px;
  color: #6B7280;
}

/* ── PUBLICATION FREQUENCY ── */
.pubfreq-section { }
.pubfreq-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}
.pubfreq-card {
  flex: 1;
  background: #FFFFFF;
  border: 1px solid #E5E1D8;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.pubfreq-value {
  font-size: 28px;
  font-weight: 800;
  color: #C49A3C;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}
.pubfreq-label {
  font-size: 10px;
  color: #A67C2E;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 1px;
}
.pubfreq-pattern {
  font-size: 13px;
  color: #374151;
  background: #FBF6EE;
  border: 1px solid #EDE8DF;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.pubfreq-recs {
  padding-top: 12px;
  border-top: 1px solid #EDE8DF;
}
.pubfreq-recs-title {
  font-size: 13px;
  font-weight: 600;
  color: #A67C2E;
  margin-bottom: 8px;
}
.pubfreq-recs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pubfreq-recs li {
  font-size: 13px;
  color: #374151;
  padding: 5px 0 5px 18px;
  position: relative;
  line-height: 1.5;
}
.pubfreq-recs li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C49A3C;
}

/* ── FOOTER ── */
.footer {
  margin-top: auto;
  padding-top: 20px;
  padding-bottom: 12px;
  border-top: 2px solid #C49A3C;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #9CA3AF;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-brand {
  font-weight: 700;
  color: #C49A3C;
  font-size: 13px;
}
.footer-center {
  color: #9CA3AF;
}
.footer-right {
  color: #9CA3AF;
}

/* ── PRINT ── */
@media print {
  body { margin: 0; padding: 0; }
  .pdf-page { box-shadow: none; margin: 0; max-width: 100%; min-height: 100%; }
  .cover-page { box-shadow: none; }
}
@page { margin: 0; size: A4; }

/* ── ANTI-COUPURE ── */
/* Petits blocs individuels : ne jamais couper */
.stat-card, .best-time-item, .video-item,
.regularity-item, .persona-block, .exec-item,
.health-component-row, .cta-box,
.profile, .top-bar,
.shadowban-card, .pubfreq-card {
  page-break-inside: avoid;
  break-inside: avoid;
}
/* Grilles de stats : elles tiennent sur une page */
.stats-grid, .stats-grid-5 {
  page-break-inside: avoid;
  break-inside: avoid;
}
/* GROS conteneurs : NE PAS mettre break-inside:avoid car ils depassent souvent 1 page */
/* .section, .insights-section, .insights-content → on laisse couper entre sous-elements */

/* Titres ne doivent jamais rester seuls en bas de page */
.section-title, .sub-title,
.insights-content h2, .insights-content h3 {
  page-break-after: avoid;
  break-after: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
}
/* Paragraphes et items individuels ne se coupent pas */
.insights-content p,
.insights-content li,
.priority-actions li {
  page-break-inside: avoid;
  break-inside: avoid;
}

      </style>
    </head>
    <body>

      <!-- ═══ COVER PAGE ═══ -->
      ${generateCoverPage(pdfData, dateStr, healthScoreData)}

      <div class="pdf-page">
        <div class="content-wrapper">

          <!-- TOP BAR -->
          <div class="top-bar avoid-break">
            <div class="top-bar-brand">FredWav</div>
            <div class="top-bar-right">
              <div class="subtitle">Analyse TikTok Express</div>
              <div class="meta">${dateStr} | @${pdfData.username}</div>
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
                ${pdfData.verified ? `<span class="profile-verified">V\u00e9rifi\u00e9</span>` : ""}
              </div>
              ${pdfData.bio ? `<div class="profile-bio">${pdfData.bio}</div>` : ""}
            </div>
          </div>

          <!-- EXECUTIVE SUMMARY -->
          ${generateExecutiveSummary(pdfData, healthScoreData)}

          <!-- KEY METRICS -->
          <div class="section">
            <h2 class="section-title">&#128202; M&eacute;triques Cl&eacute;s</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.follower_count)}</div>
                <div class="stat-label">Abonnes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.total_likes || pdfData.like_count)}</div>
                <div class="stat-label">Likes totaux</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatNumber(pdfData.video_count)}</div>
                <div class="stat-label">Videos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${(pdfData.engagement_rate || 0).toFixed(2)}%</div>
                <div class="stat-label">Engagement</div>
              </div>
            </div>

            <div class="sub-title">Moyennes par vid\u00e9o</div>
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

            <div class="sub-title">M\u00e9dianes par vid\u00e9o</div>
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

          <!-- HEALTH SCORE DETAIL -->
          ${generateHealthScoreDetailHTML(healthScoreData)}

          <!-- HASHTAGS -->
          ${
    topHashtags.length > 0
      ? `
          <div class="section avoid-break">
            <h2 class="section-title">&#35; Top Hashtags</h2>
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

          <!-- SHADOWBAN STATUS -->
          ${generateShadowbanHTML(pdfData)}

          <!-- PUBLICATION FREQUENCY -->
          ${generatePublicationFrequencyHTML(pdfData)}

          <!-- TOP VIDEOS -->
          ${
    topVideos.length > 0
      ? `
          <div class="section">
            <h2 class="section-title">&#127916; Top Vid&eacute;os R&eacute;centes</h2>
            ${topVideos
          .map(
            (video, i) => `
              <div class="video-item avoid-break">
                <div class="video-header">
                  <span class="video-index">#${i + 1}</span>
                  <span class="video-title">${video.title || video.description || "Video"}</span>
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
          <div class="insights-section">
            <h2 class="section-title">&#129504; Analyse D&eacute;taill&eacute;e &amp; Insights IA</h2>
            <div class="insights-content">${markdownToHtml(rawInsights)}</div>
          </div>
          `
      : ""
  }

          <!-- CTA / UPSELL -->
          ${generateCTASection()}

        </div>

        <!-- FOOTER -->
        <div class="footer avoid-break">
          <div class="footer-left">
            <span class="footer-brand">FredWav</span>
            <span>|</span>
            <span>fredwav.com</span>
          </div>
          <div class="footer-center">Document confidentiel</div>
          <div class="footer-right">Analyse TikTok Express</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
