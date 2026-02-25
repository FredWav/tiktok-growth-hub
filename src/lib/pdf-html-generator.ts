/**
 * Génère le HTML complet du rapport PDF avec CSS intégré — Style FredWav (crème/or/noir).
 */

import { PDFDataFormat, BestTime } from './pdf-data-mapper';

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) { result.push('</ul>'); inUl = false; }
    if (inOl) { result.push('</ol>'); inOl = false; }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
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
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${inlineFormat(line.replace(/^[-*] /, ''))}</li>`);
    } else if (line.match(/^\d+\. (.+)/)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ''))}</li>`);
    } else if (line.trim() === '') {
      closeLists();
    } else {
      closeLists();
      result.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeLists();
  return result.join('\n');
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const REGULARITY_LABELS: Record<string, string> = {
  no_gaps_72h: "Pas de pause > 72h",
  weekly_volume: "Volume hebdo",
  day_consistency: "Régularité des jours",
  hour_consistency: "Régularité horaire",
  uniform_distribution: "Distribution uniforme",
};

function getBarColor(score: number): string {
  if (score >= 25) return '#22C55E';
  if (score >= 10) return '#EAB308';
  return '#EF4444';
}

function generateBestTimesHTML(bestTimes: BestTime[]): string {
  if (!bestTimes?.length) return '';
  const top5 = bestTimes.slice(0, 5);
  const maxViews = Math.max(...top5.map(t => t.avg_views));

  return `
    <div class="section best-times-section">
      <h2 class="section-title">🕐 Meilleurs Créneaux de Publication</h2>
      <div class="best-times-list">
        ${top5.map((t, i) => {
          const pct = maxViews > 0 ? (t.avg_views / maxViews) * 100 : 0;
          return `
          <div class="best-time-item">
            <div class="best-time-rank">#${i + 1}</div>
            <div class="best-time-info">
              <div class="best-time-label">${DAY_NAMES[t.day] || 'Jour ' + t.day} à ${String(t.hour).padStart(2, '0')}h00</div>
              <div class="best-time-bar-bg">
                <div class="best-time-bar" style="width: ${pct}%"></div>
              </div>
            </div>
            <div class="best-time-value">${formatNumber(t.avg_views)} vues</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function generateRegularityHTML(breakdown: Record<string, { score: number; details: string }>): string {
  if (!breakdown) return '';
  const total = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  return `
    <div class="section regularity-section">
      <h2 class="section-title">📊 Régularité Détaillée <span class="score-badge">${total}/100</span></h2>
      <div class="regularity-list">
        ${Object.entries(breakdown).map(([key, item]) => {
          const pct = (item.score / 30) * 100;
          return `
          <div class="regularity-item">
            <div class="regularity-header">
              <span class="regularity-label">${REGULARITY_LABELS[key] || key}</span>
              <span class="regularity-score">${item.score}/30</span>
            </div>
            <div class="regularity-bar-bg">
              <div class="regularity-bar" style="width: ${pct}%; background: ${getBarColor(item.score)}"></div>
            </div>
            <div class="regularity-details">${item.details}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function generatePersonaHTML(persona: { niche_principale?: string; forces?: string[]; faiblesses?: string[] }): string {
  if (!persona) return '';
  return `
    <div class="section persona-section">
      <h2 class="section-title">🎯 Persona Identifié</h2>
      ${persona.niche_principale ? `<p class="persona-niche"><strong>Niche :</strong> ${persona.niche_principale}</p>` : ''}
      ${persona.forces?.length ? `
        <div class="persona-block">
          <h4>Forces</h4>
          <ul>${persona.forces.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${persona.faiblesses?.length ? `
        <div class="persona-block">
          <h4>Points d'amélioration</h4>
          <ul>${persona.faiblesses.map(f => `<li><span class="warn">!</span> ${f}</li>`).join('')}</ul>
        </div>
      ` : ''}
    </div>
  `;
}

export function generateCompletePDFHTML(pdfData: PDFDataFormat, rawInsights: string, recentVideos: any[] = []): string {
  const topVideos = recentVideos.slice(0, 5);
  const topHashtags = pdfData.top_hashtags || [];
  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1A1A1A; line-height: 1.6; background: #FDF8F0;
        }
        .pdf-page {
          background: #FDF8F0; padding: 40px; margin: 0 auto; max-width: 210mm;
          min-height: 100vh; display: flex; flex-direction: column; position: relative;
        }
        .content-wrapper { flex: 1; }

        /* ── HEADER BAR ── */
        .top-bar {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: 20px; margin-bottom: 30px; border-bottom: 2px solid #C49A3C;
        }
        .top-bar-brand { font-size: 24px; font-weight: 700; color: #C49A3C; letter-spacing: -0.5px; }
        .top-bar-right { text-align: right; font-size: 12px; color: #6B7280; }
        .top-bar-right .subtitle { font-size: 14px; color: #A67C2E; font-weight: 600; }

        /* ── PROFILE ── */
        .profile {
          display: flex; align-items: center; gap: 24px;
          margin-bottom: 32px; padding: 24px;
          background: #FEFCF7; border: 1px solid #E5E1D8; border-radius: 12px;
        }
        .profile-avatar {
          width: 90px; height: 90px; border-radius: 50%;
          border: 3px solid #C49A3C; overflow: hidden; flex-shrink: 0;
        }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { flex: 1; }
        .profile-name { font-size: 22px; font-weight: 700; color: #1A1A1A; }
        .profile-username { font-size: 14px; color: #A67C2E; margin-bottom: 4px; }
        .profile-bio { font-size: 13px; color: #6B7280; line-height: 1.5; white-space: pre-wrap; }
        .profile-verified { color: #C49A3C; font-weight: 600; font-size: 12px; }

        /* ── SECTIONS ── */
        .section { margin-bottom: 28px; }
        .section-title {
          font-size: 16px; font-weight: 700; color: #1A1A1A;
          margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #C49A3C;
          display: flex; align-items: center; gap: 8px;
        }
        .score-badge {
          font-size: 12px; font-weight: 500; color: #6B7280; margin-left: auto;
        }

        /* ── STATS GRID ── */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card {
          background: #FEFCF7; border: 1px solid #E5E1D8; border-radius: 10px;
          padding: 16px; text-align: center;
        }
        .stat-value { font-size: 20px; font-weight: 700; color: #C49A3C; margin-bottom: 4px; }
        .stat-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }

        .stats-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
        .stats-grid-5 .stat-card { padding: 12px; }
        .stats-grid-5 .stat-value { font-size: 16px; }
        .sub-title { font-size: 13px; font-weight: 600; color: #A67C2E; margin-bottom: 10px; }

        /* ── HASHTAGS ── */
        .hashtags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .hashtag-badge {
          background: linear-gradient(135deg, #C49A3C 0%, #A67C2E 100%);
          color: white; padding: 6px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 500;
        }

        /* ── BEST TIMES ── */
        .best-times-list { display: flex; flex-direction: column; gap: 10px; }
        .best-time-item {
          display: flex; align-items: center; gap: 12px;
          background: #FEFCF7; border: 1px solid #E5E1D8; border-radius: 8px; padding: 12px 16px;
        }
        .best-time-rank {
          font-size: 14px; font-weight: 700; color: #C49A3C; min-width: 28px;
        }
        .best-time-info { flex: 1; }
        .best-time-label { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
        .best-time-bar-bg { background: #E5E1D8; border-radius: 4px; height: 8px; overflow: hidden; }
        .best-time-bar { background: linear-gradient(90deg, #C49A3C, #A67C2E); height: 100%; border-radius: 4px; }
        .best-time-value { font-size: 13px; font-weight: 700; color: #C49A3C; min-width: 70px; text-align: right; }

        /* ── REGULARITY ── */
        .regularity-list { display: flex; flex-direction: column; gap: 12px; }
        .regularity-item { }
        .regularity-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .regularity-label { font-size: 13px; font-weight: 500; color: #1A1A1A; }
        .regularity-score { font-size: 13px; font-weight: 600; color: #6B7280; }
        .regularity-bar-bg { background: #E5E1D8; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 4px; }
        .regularity-bar { height: 100%; border-radius: 4px; }
        .regularity-details { font-size: 11px; color: #6B7280; }

        /* ── PERSONA ── */
        .persona-section {
          background: #FEFCF7; border: 1px solid #E5E1D8; border-radius: 12px; padding: 20px;
        }
        .persona-section .section-title { margin-top: 0; }
        .persona-niche { font-size: 14px; color: #1A1A1A; margin-bottom: 12px; }
        .persona-block { margin-bottom: 12px; }
        .persona-block h4 { font-size: 13px; font-weight: 600; color: #A67C2E; margin-bottom: 6px; }
        .persona-block ul { list-style: none; padding: 0; }
        .persona-block li { font-size: 13px; color: #6B7280; margin-bottom: 4px; display: flex; gap: 6px; }
        .persona-block .check { color: #22C55E; font-weight: 700; }
        .persona-block .warn { color: #EAB308; font-weight: 700; }

        /* ── TOP VIDEOS ── */
        .video-item {
          background: #FEFCF7; border: 1px solid #E5E1D8;
          border-radius: 8px; padding: 14px; margin-bottom: 10px;
        }
        .video-title { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; line-height: 1.4; }
        .video-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; font-size: 11px; }
        .video-stat-label { color: #6B7280; text-transform: uppercase; font-weight: 500; margin-bottom: 2px; }
        .video-stat-value { color: #C49A3C; font-weight: 700; font-size: 13px; }

        /* ── INSIGHTS ── */
        .insights-section {
          background: #FEFCF7; border: 1px solid #E5E1D8;
          border-radius: 12px; padding: 24px; margin-bottom: 40px;
        }
        .insights-content { font-size: 13px; color: #374151; line-height: 1.7; }
        .insights-content h2 {
          font-size: 16px; font-weight: 700; color: #C49A3C;
          margin: 20px 0 10px 0; padding-bottom: 6px; border-bottom: 1px solid #E5E1D8;
        }
        .insights-content h3 { font-size: 14px; font-weight: 600; color: #A67C2E; margin: 14px 0 6px 0; }
        .insights-content strong { font-weight: 700; color: #1A1A1A; }
        .insights-content ul, .insights-content ol { padding-left: 20px; margin: 8px 0; }
        .insights-content li { margin-bottom: 4px; }
        .insights-content p { margin-bottom: 8px; }

        /* ── FOOTER ── */
        .footer {
          margin-top: auto; padding-top: 24px; padding-bottom: 16px;
          border-top: 2px solid #C49A3C; text-align: center;
          font-size: 11px; color: #6B7280;
        }
        .footer-brand { font-weight: 700; color: #C49A3C; font-size: 14px; margin-bottom: 4px; }

        /* ── PRINT ── */
        @media print {
          body { margin: 0; padding: 0; }
          .pdf-page { box-shadow: none; margin: 0; max-width: 100%; min-height: 100%; }
        }
        @page { margin: 0; size: A4; }
        .stat-card, .stats-grid, .profile, .best-time-item,
        .video-item, .regularity-item, .persona-section,
        .top-bar, .section { page-break-inside: avoid; break-inside: avoid; }
        .insights-content p, .insights-content li, .insights-content h2, .insights-content h3 {
          page-break-inside: avoid; break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="pdf-page">
        <div class="content-wrapper">
          <!-- TOP BAR -->
          <div class="top-bar">
            <div class="top-bar-brand">FredWav</div>
            <div class="top-bar-right">
              <div class="subtitle">Analyse TikTok Express</div>
              <div>${dateStr} • @${pdfData.username}</div>
            </div>
          </div>

          <!-- PROFILE -->
          <div class="profile">
            ${pdfData.avatar_url ? `
              <div class="profile-avatar">
                <img src="${pdfData.avatar_url}" alt="Avatar" crossorigin="anonymous">
              </div>
            ` : ''}
            <div class="profile-info">
              <div class="profile-name">${pdfData.display_name || pdfData.username}</div>
              <div class="profile-username">@${pdfData.username}${pdfData.verified ? ' <span class="profile-verified">✓ Vérifié</span>' : ''}</div>
              ${pdfData.bio ? `<div class="profile-bio">${pdfData.bio}</div>` : ''}
            </div>
          </div>

          <!-- KEY METRICS -->
          <div class="section">
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
          ${topHashtags.length > 0 ? `
          <div class="section">
            <h2 class="section-title">#️⃣ Top Hashtags</h2>
            <div class="hashtags-wrap">
              ${topHashtags.slice(0, 10).map(tag => `<span class="hashtag-badge">${tag.startsWith('#') ? tag : '#' + tag}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <!-- BEST TIMES -->
          ${generateBestTimesHTML(pdfData.best_times || [])}

          <!-- REGULARITY -->
          ${pdfData.regularity_breakdown ? generateRegularityHTML(pdfData.regularity_breakdown) : ''}

          <!-- PERSONA -->
          ${pdfData.persona ? generatePersonaHTML(pdfData.persona) : ''}

          <!-- TOP VIDEOS -->
          ${topVideos.length > 0 ? `
          <div class="section">
            <h2 class="section-title">🎥 Top vidéos récentes</h2>
            ${topVideos.map(video => `
              <div class="video-item">
                <div class="video-title">${video.title || video.description || 'Vidéo'}</div>
                <div class="video-stats">
                  <div><div class="video-stat-label">Vues</div><div class="video-stat-value">${formatNumber(video.view_count)}</div></div>
                  <div><div class="video-stat-label">Likes</div><div class="video-stat-value">${formatNumber(video.like_count)}</div></div>
                  <div><div class="video-stat-label">Commentaires</div><div class="video-stat-value">${formatNumber(video.comment_count)}</div></div>
                  <div><div class="video-stat-label">Partages</div><div class="video-stat-value">${formatNumber(video.share_count)}</div></div>
                  <div><div class="video-stat-label">Sauvegardes</div><div class="video-stat-value">${formatNumber(video.save_count)}</div></div>
                  <div><div class="video-stat-label">Engagement</div><div class="video-stat-value">${(video.engagement_rate || 0).toFixed(2)}%</div></div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- AI INSIGHTS -->
          ${rawInsights ? `
          <div class="insights-section">
            <h2 class="section-title">📝 Analyse détaillée & insights IA</h2>
            <div class="insights-content">${markdownToHtml(rawInsights)}</div>
          </div>
          ` : ''}
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-brand">⚡ FredWav</div>
          <p>Analyse TikTok Express — Rapport généré le ${dateStr}</p>
          <p>fredwav.lovable.app</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
