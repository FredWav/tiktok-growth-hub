interface PdfReportTemplateProps {
  data: any;
  username: string;
}

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const SCORE_LABELS: Record<string, string> = {
  engagement: "Engagement",
  consistency: "Régularité",
  content_quality: "Qualité du contenu",
  growth_potential: "Potentiel de croissance",
  technical_seo: "SEO technique",
};

const REGULARITY_LABELS: Record<string, string> = {
  no_gaps_72h: "Pas de pause > 72h",
  weekly_volume: "Volume hebdo",
  day_consistency: "Régularité des jours",
  hour_consistency: "Régularité horaire",
  uniform_distribution: "Distribution uniforme",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function barColor(score: number, max = 100) {
  const pct = (score / max) * 100;
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#eab308";
  return "#ef4444";
}

function renderMarkdown(content: string) {
  if (!content) return null;
  const lines = content.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (inList) { html.push("</ul>"); inList = false; }
      continue;
    }
    if (t.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h4 style="font-size:13px;font-weight:600;margin:12px 0 4px;">${t.slice(4)}</h4>`);
    } else if (t.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 style="font-size:15px;font-weight:700;margin:16px 0 6px;color:#c9a84c;">${t.slice(3)}</h3>`);
    } else if (t.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 style="font-size:17px;font-weight:700;margin:16px 0 8px;">${t.slice(2)}</h2>`);
    } else if (t.startsWith("- ") || t.startsWith("* ") || /^\d+\.\s/.test(t)) {
      if (!inList) { html.push('<ul style="padding-left:18px;margin:4px 0;">'); inList = true; }
      const text = t.replace(/^[-*]\s|^\d+\.\s/, "");
      html.push(`<li style="font-size:12px;color:#555;margin:2px 0;">${text}</li>`);
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p style="font-size:12px;color:#555;margin:3px 0;line-height:1.5;">${t}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

export function PdfReportTemplate({ data, username }: PdfReportTemplateProps) {
  const account = data?.account;
  const persona = data?.persona;
  const pubPattern = persona?.style_contenu?.publication_pattern;
  const healthScore = data?.health_score || account?.health_score;
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const s = {
    page: { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", color: "#0f0f0f", background: "#fff", padding: "30px 35px", maxWidth: "800px" } as React.CSSProperties,
    header: { textAlign: "center" as const, borderBottom: "2px solid #c9a84c", paddingBottom: "16px", marginBottom: "24px" },
    gold: { color: "#c9a84c" },
    title: { fontSize: "28px", fontWeight: 700, margin: 0 },
    subtitle: { fontSize: "13px", color: "#888", marginTop: "4px" },
    section: { marginBottom: "20px", pageBreakInside: "avoid" as const },
    sectionTitle: { fontSize: "16px", fontWeight: 600, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" },
    card: { border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px", marginBottom: "12px" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" } as React.CSSProperties,
    grid5: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" } as React.CSSProperties,
    metricCard: { border: "1px solid #e5e5e5", borderRadius: "8px", padding: "10px", textAlign: "center" as const },
    bigNum: { fontSize: "22px", fontWeight: 700 },
    smallLabel: { fontSize: "11px", color: "#888" },
    badge: { display: "inline-block", border: "1px solid #c9a84c", borderRadius: "12px", padding: "3px 10px", fontSize: "12px", color: "#c9a84c", margin: "3px" },
    bar: (pct: number, color: string) => ({ width: `${pct}%`, height: "8px", borderRadius: "4px", backgroundColor: color } as React.CSSProperties),
    barBg: { width: "100%", height: "8px", borderRadius: "4px", backgroundColor: "#f0f0f0", overflow: "hidden" } as React.CSSProperties,
    footer: { textAlign: "center" as const, borderTop: "1px solid #e5e5e5", paddingTop: "12px", marginTop: "30px", fontSize: "11px", color: "#888" },
  };

  return (
    <div id="pdf-report-template" style={{ position: "fixed", left: 0, top: 0, width: "800px", visibility: "hidden", zIndex: -9999, overflow: "hidden", height: 0 }}>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={{ ...s.title, ...s.gold }}>FredWav</h1>
          <p style={s.subtitle}>Analyse Express TikTok — {today}</p>
        </div>

        {/* Profile */}
        <div style={{ ...s.section, textAlign: "center" }}>
          {account?.avatar_url && (
            <img src={account.avatar_url} alt="" style={{ width: "70px", height: "70px", borderRadius: "50%", border: "2px solid #c9a84c", objectFit: "cover", margin: "0 auto 8px" }} crossOrigin="anonymous" />
          )}
          <h2 style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 2px" }}>
            {account?.display_name || `@${username}`}
          </h2>
          <p style={{ ...s.gold, fontSize: "14px", margin: 0 }}>@{username}</p>
          {account?.detected_niche && (
            <span style={{ ...s.badge, marginTop: "6px" }}>{account.detected_niche}</span>
          )}
          {account?.bio && (
            <p style={{ fontSize: "12px", color: "#666", maxWidth: "400px", margin: "8px auto 0", whiteSpace: "pre-line" }}>{account.bio}</p>
          )}
        </div>

        {/* Health Score */}
        {healthScore?.total != null && (
          <div style={s.section}>
            <div style={{ ...s.card, textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>Health Score</p>
              <p style={{ fontSize: "48px", fontWeight: 700, color: barColor(healthScore.total), margin: 0 }}>
                {healthScore.total}<span style={{ fontSize: "20px", color: "#888" }}>/100</span>
              </p>
              <div style={{ ...s.barBg, maxWidth: "250px", margin: "10px auto" }}>
                <div style={s.bar(healthScore.total, barColor(healthScore.total))} />
              </div>
            </div>
            {healthScore.components && (
              <div style={s.card}>
                <p style={{ fontWeight: 600, marginBottom: "10px", fontSize: "14px" }}>Détail du score</p>
                {Object.entries(healthScore.components).map(([key, comp]: [string, any]) => comp?.score != null && (
                  <div key={key} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                      <span>{SCORE_LABELS[key] || key}</span>
                      <span style={{ fontWeight: 600 }}>{comp.score}/100</span>
                    </div>
                    <div style={s.barBg}>
                      <div style={s.bar(comp.score, barColor(comp.score))} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {healthScore.priority_actions?.length > 0 && (
              <div style={s.card}>
                <p style={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>⚡ Actions prioritaires</p>
                {healthScore.priority_actions.map((a: string, i: number) => (
                  <p key={i} style={{ fontSize: "12px", color: "#555", margin: "3px 0" }}>→ {a}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Metrics */}
        {account && (
          <div style={s.section}>
            <div style={s.grid4}>
              {account.follower_count != null && <div style={s.metricCard}><div style={s.bigNum}>{fmt(account.follower_count)}</div><div style={s.smallLabel}>Abonnés</div></div>}
              {account.like_count != null && <div style={s.metricCard}><div style={s.bigNum}>{fmt(account.like_count)}</div><div style={s.smallLabel}>Likes totaux</div></div>}
              {account.video_count != null && <div style={s.metricCard}><div style={s.bigNum}>{fmt(account.video_count)}</div><div style={s.smallLabel}>Vidéos</div></div>}
              {account.engagement_rate != null && <div style={s.metricCard}><div style={s.bigNum}>{account.engagement_rate}%</div><div style={s.smallLabel}>Engagement</div></div>}
            </div>
          </div>
        )}

        {/* Averages */}
        {account && (
          <div style={s.section}>
            <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "1px", marginBottom: "8px" }}>Moyennes par vidéo</p>
            <div style={s.grid5}>
              {account.avg_views != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.avg_views)}</div><div style={s.smallLabel}>Vues</div></div>}
              {account.avg_likes != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.avg_likes)}</div><div style={s.smallLabel}>Likes</div></div>}
              {account.avg_comments != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.avg_comments)}</div><div style={s.smallLabel}>Commentaires</div></div>}
              {account.avg_saves != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.avg_saves)}</div><div style={s.smallLabel}>Saves</div></div>}
              {account.avg_shares != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.avg_shares)}</div><div style={s.smallLabel}>Partages</div></div>}
            </div>
          </div>
        )}

        {/* Medians */}
        {account && (
          <div style={s.section}>
            <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "1px", marginBottom: "8px" }}>Médianes par vidéo</p>
            <div style={s.grid5}>
              {account.median_views != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.median_views)}</div><div style={s.smallLabel}>Vues</div></div>}
              {account.median_likes != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.median_likes)}</div><div style={s.smallLabel}>Likes</div></div>}
              {account.median_comments != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.median_comments)}</div><div style={s.smallLabel}>Commentaires</div></div>}
              {account.median_saves != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.median_saves)}</div><div style={s.smallLabel}>Saves</div></div>}
              {account.median_shares != null && <div style={s.metricCard}><div style={{ ...s.bigNum, fontSize: "18px" }}>{fmt(account.median_shares)}</div><div style={s.smallLabel}>Partages</div></div>}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {account?.top_hashtags?.length > 0 && (
          <div style={s.section}>
            <p style={{ ...s.sectionTitle as any }}># Top Hashtags</p>
            <div>
              {account.top_hashtags.map((tag: string, i: number) => (
                <span key={i} style={s.badge}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          </div>
        )}

        {/* Best Times */}
        {pubPattern?.best_times?.length > 0 && (
          <div style={s.section}>
            <p style={{ ...s.sectionTitle as any }}>🕐 Meilleurs créneaux</p>
            {pubPattern.best_times.slice(0, 5).map((t: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: i % 2 === 0 ? "#fafafa" : "#fff", borderRadius: "6px", fontSize: "13px", marginBottom: "3px" }}>
                <span><strong style={{ color: "#c9a84c" }}>#{i + 1}</strong> {DAYS[t.day]} à {String(t.hour).padStart(2, "0")}h00</span>
                <span><strong>{fmt(t.avg_views)}</strong> vues moy.</span>
              </div>
            ))}
          </div>
        )}

        {/* Regularity */}
        {pubPattern?.regularity_details?.tiktok_breakdown && (
          <div style={s.section}>
            <p style={{ ...s.sectionTitle as any }}>📊 Régularité détaillée</p>
            {Object.entries(pubPattern.regularity_details.tiktok_breakdown).map(([key, item]: [string, any]) => (
              <div key={key} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                  <span>{REGULARITY_LABELS[key] || key}</span>
                  <span style={{ fontWeight: 600 }}>{item.score}/30</span>
                </div>
                <div style={s.barBg}>
                  <div style={s.bar((item.score / 30) * 100, barColor(item.score, 30))} />
                </div>
                <p style={{ fontSize: "11px", color: "#888", margin: "2px 0 0" }}>{item.details}</p>
              </div>
            ))}
          </div>
        )}

        {/* Persona */}
        {persona && (
          <div style={s.section}>
            <p style={{ ...s.sectionTitle as any }}>🎯 Persona identifié</p>
            <div style={s.card}>
              {persona.niche_principale && (
                <p style={{ fontSize: "13px", marginBottom: "8px" }}><strong>Niche :</strong> {persona.niche_principale}</p>
              )}
              {persona.forces?.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Forces</p>
                  {persona.forces.map((f: string, i: number) => (
                    <p key={i} style={{ fontSize: "12px", color: "#555", margin: "2px 0" }}>✓ {f}</p>
                  ))}
                </div>
              )}
              {persona.faiblesses?.length > 0 && (
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Points d'amélioration</p>
                  {persona.faiblesses.map((f: string, i: number) => (
                    <p key={i} style={{ fontSize: "12px", color: "#555", margin: "2px 0" }}>! {f}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {account?.ai_insights && (
          <div style={s.section}>
            <p style={{ ...s.sectionTitle as any }}>📊 Analyse détaillée (IA)</p>
            <div style={s.card} dangerouslySetInnerHTML={{ __html: renderMarkdown(account.ai_insights) || "" }} />
          </div>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <p>Généré par <strong style={s.gold}>FredWav</strong> — {today}</p>
          <p>fredwav.lovable.app</p>
        </div>
      </div>
    </div>
  );
}
