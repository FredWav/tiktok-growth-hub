/**
 * Génère le HTML complet du rapport PDF avec CSS intégré.
 * L'élément est créé en mémoire (detached) — pas besoin de visibilité DOM.
 */

import { PDFDataFormat } from './pdf-data-mapper';

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

export function generateCompletePDFHTML(pdfData: PDFDataFormat, rawInsights: string, recentVideos: any[] = []): string {
  const topVideos = recentVideos.slice(0, 5);
  const topHashtags = pdfData.top_hashtags || [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1f2937; line-height: 1.6; background: #f3f4f6;
        }
        .pdf-page {
          background: white; padding: 40px; margin: 0 auto; max-width: 210mm;
          min-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.1);
          display: flex; flex-direction: column; position: relative;
        }
        .content-wrapper { flex: 1; }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 50px 40px; border-radius: 16px;
          margin-bottom: 40px; display: flex; align-items: center;
          gap: 30px; position: relative; overflow: hidden;
        }
        .header::before {
          content: ''; position: absolute; top: -50%; right: -50%;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        .header-avatar {
          width: 120px; height: 120px; border-radius: 50%; background: white;
          border: 4px solid rgba(255,255,255,0.3); overflow: hidden;
          flex-shrink: 0; position: relative; z-index: 1;
        }
        .header-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .header-content { flex: 1; position: relative; z-index: 1; }
        .header h1 { font-size: 36px; font-weight: 700; margin-bottom: 8px; }
        .header .username { font-size: 18px; opacity: 0.9; margin-bottom: 8px; }
        .header .meta { font-size: 13px; opacity: 0.8; }
        .header .verified { color: #4ade80; font-weight: 600; }
        .stats-section { margin-bottom: 40px; }
        .section-title {
          font-size: 20px; font-weight: 700; color: #111827;
          margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #667eea;
        }
        .stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 40px;
        }
        .stat-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
          border: 1px solid #e5e7eb; border-radius: 12px;
          padding: 20px; text-align: center;
        }
        .stat-icon { font-size: 28px; margin-bottom: 10px; }
        .stat-value { font-size: 24px; font-weight: 700; color: #667eea; margin-bottom: 6px; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .bio-section {
          background: #f9fafb; border-left: 4px solid #667eea;
          padding: 24px; border-radius: 8px; margin-bottom: 40px;
        }
        .bio-section h3 { font-size: 14px; font-weight: 600; color: #667eea; margin-bottom: 10px; text-transform: uppercase; }
        .bio-section p { font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap; }
        .videos-section { margin-bottom: 40px; }
        .video-item {
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 16px; margin-bottom: 12px;
        }
        .video-title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 8px; line-height: 1.4; }
        .video-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; font-size: 11px; }
        .video-stat { display: flex; flex-direction: column; }
        .video-stat-label { color: #6b7280; text-transform: uppercase; font-weight: 500; margin-bottom: 2px; }
        .video-stat-value { color: #667eea; font-weight: 700; font-size: 13px; }
        .hashtags-section { margin-bottom: 40px; }
        .hashtags-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .hashtag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 10px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 500; text-align: center;
          text-overflow: ellipsis; overflow: hidden;
        }
        .insights-section {
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 24px; margin-bottom: 60px;
        }
        .insights-section h3 { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px; }
        .insights-content { font-size: 13px; color: #374151; line-height: 1.7; }
        .insights-content h2 { font-size: 18px; font-weight: 700; color: #667eea; margin: 20px 0 10px 0; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
        .insights-content h3 { font-size: 15px; font-weight: 600; color: #764ba2; margin: 16px 0 8px 0; }
        .insights-content strong { font-weight: 700; color: #111827; }
        .insights-content ul, .insights-content ol { padding-left: 24px; margin: 8px 0; }
        .insights-content li { margin-bottom: 4px; }
        .insights-content p { margin-bottom: 8px; }
        .footer {
          margin-top: auto; padding-top: 30px; padding-bottom: 20px;
          border-top: 2px solid #e5e7eb; text-align: center;
          font-size: 11px; color: #9ca3af;
        }
        .footer-branding { font-weight: 700; color: #667eea; font-size: 14px; margin-bottom: 8px; }
        .footer p { margin-bottom: 0; }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .pdf-page { box-shadow: none; margin: 0; max-width: 100%; min-height: 100%; }
        }
        @page { margin: 0; size: A4; }
        .video-item, .stat-card, .stats-grid, .stats-section,
        .bio-section, .hashtags-section, .hashtags-grid, .header { page-break-inside: avoid; break-inside: avoid; }
        .insights-content p, .insights-content li, .insights-content h2, .insights-content h3 { page-break-inside: avoid; break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="pdf-page">
        <div class="content-wrapper">
          <!-- HERO HEADER -->
          <div class="header">
            ${pdfData.avatar_url ? `
              <div class="header-avatar">
                <img src="${pdfData.avatar_url}" alt="Avatar" crossorigin="anonymous">
              </div>
            ` : ''}
            <div class="header-content">
              <h1>${pdfData.display_name || pdfData.username}</h1>
              <div class="username">@${pdfData.username}</div>
              <div class="meta">
                ${pdfData.verified ? '<span class="verified">✓ Vérifié</span> • ' : ''}
                <span>Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <!-- BIO -->
          ${pdfData.bio ? `
          <div class="bio-section">
            <h3>À propos</h3>
            <p>${pdfData.bio}</p>
          </div>
          ` : ''}
          
          <!-- MAIN STATS -->
          <div class="stats-section">
            <h2 class="section-title">📊 Statistiques du compte</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${formatNumber(pdfData.follower_count)}</div>
                <div class="stat-label">Abonnés</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">➕</div>
                <div class="stat-value">${formatNumber(pdfData.following_count)}</div>
                <div class="stat-label">Abonnements</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🎬</div>
                <div class="stat-value">${formatNumber(pdfData.video_count)}</div>
                <div class="stat-label">Vidéos</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">❤️</div>
                <div class="stat-value">${formatNumber(pdfData.total_likes || pdfData.like_count)}</div>
                <div class="stat-label">Likes totaux</div>
              </div>
            </div>
          </div>
          
          <!-- ENGAGEMENT STATS -->
          <div class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">👁️</div>
                <div class="stat-value">${formatNumber(pdfData.avg_views)}</div>
                <div class="stat-label">Vues moyennes</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${formatNumber(pdfData.median_views)}</div>
                <div class="stat-label">Vues médianes</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-value">${(pdfData.engagement_rate || 0).toFixed(2)}%</div>
                <div class="stat-label">Engagement</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">✨</div>
                <div class="stat-value">${formatNumber(pdfData.avg_likes)}</div>
                <div class="stat-label">Likes moyens</div>
              </div>
            </div>
          </div>
          
          <!-- TOP VIDEOS -->
          ${topVideos.length > 0 ? `
          <div class="videos-section">
            <h2 class="section-title">🎥 Top vidéos (5 dernières)</h2>
            ${topVideos.map(video => `
              <div class="video-item">
                <div class="video-title">${video.title || video.description || 'Vidéo'}</div>
                <div class="video-stats">
                  <div class="video-stat">
                    <div class="video-stat-label">Vues</div>
                    <div class="video-stat-value">${formatNumber(video.view_count)}</div>
                  </div>
                  <div class="video-stat">
                    <div class="video-stat-label">Likes</div>
                    <div class="video-stat-value">${formatNumber(video.like_count)}</div>
                  </div>
                  <div class="video-stat">
                    <div class="video-stat-label">Commentaires</div>
                    <div class="video-stat-value">${formatNumber(video.comment_count)}</div>
                  </div>
                  <div class="video-stat">
                    <div class="video-stat-label">Partages</div>
                    <div class="video-stat-value">${formatNumber(video.share_count)}</div>
                  </div>
                  <div class="video-stat">
                    <div class="video-stat-label">Sauvegarde</div>
                    <div class="video-stat-value">${formatNumber(video.save_count)}</div>
                  </div>
                  <div class="video-stat">
                    <div class="video-stat-label">Engagement</div>
                    <div class="video-stat-value">${(video.engagement_rate || 0).toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <!-- TOP HASHTAGS -->
          ${topHashtags.length > 0 ? `
          <div class="hashtags-section">
            <h2 class="section-title">#️⃣ Top hashtags</h2>
            <div class="hashtags-grid">
              ${topHashtags.slice(0, 10).map(tag => `
                <div class="hashtag">${tag}</div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- AI INSIGHTS -->
          ${rawInsights ? `
          <div class="insights-section">
            <h3>📝 Analyse détaillée & insights IA</h3>
            <div class="insights-content">${markdownToHtml(rawInsights)}</div>
          </div>
          ` : ''}
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-branding">⚡ FredWav</div>
          <p>Analyse TikTok avancée — Rapport généré automatiquement</p>
          <p>fredwav.lovable.app</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
