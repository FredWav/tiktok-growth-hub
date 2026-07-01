/**
 * WavStats API v2 normalizer.
 * Converts the new payload shape returned by https://wavstats.com/api/v1
 * into the shape stored in `express_analyses.result_data` and consumed by
 * the front-end + PDF generator.
 *
 * Output shape (stable contract for the rest of the app):
 * {
 *   account: {
 *     username, display_name, avatar_url, bio, verified, detected_niche,
 *     follower_count, following_count, video_count, like_count, total_likes,
 *     engagement_rate, save_rate,
 *     avg_views, avg_likes, avg_comments, avg_shares, avg_saves,
 *     median_views, median_likes, median_comments, median_shares, median_saves,
 *     median_engagement_rate, top_hashtags,
 *     shadowban_analysis, recent_videos,
 *     ai_insights        // markdown generated from ai_analysis (legacy renderer + PDF)
 *   },
 *   ai_analysis: { ... }   // structured aiAnalysis, passed through
 *   health_score: { total, status, components: { engagement, consistency, ... } }
 *   publication_pattern: { best_days, best_hours, frequency, consistency_score, max_gap_days, days_since_last_post, weekly_distribution }
 *   top_videos: [...]
 *   shadowban_analysis: {...}
 *   hashtags: [...]
 * }
 */

// deno-lint-ignore no-explicit-any
type Any = any;

function cleanTag(t: string): string {
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

function toNumber(value: Any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickMetric(source: Any, keys: string[]): number {
  const buckets = [
    source,
    source?.metrics,
    source?.stats,
    source?.statistics,
    source?.analytics,
  ];

  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== "object") continue;
    for (const key of keys) {
      if (bucket[key] !== undefined && bucket[key] !== null) return toNumber(bucket[key]);
    }
  }

  return 0;
}

function buildAiInsightsMarkdown(ai: Any): string {
  if (!ai) return "";
  const lines: string[] = [];

  if (ai.summary) {
    lines.push("## Synthèse");
    lines.push(ai.summary);
    lines.push("");
  }

  if (Array.isArray(ai.strengths) && ai.strengths.length) {
    lines.push("## Forces");
    for (const s of ai.strengths) {
      lines.push(`- **${s.title}** — ${s.description}`);
    }
    lines.push("");
  }

  if (Array.isArray(ai.improvements) && ai.improvements.length) {
    lines.push("## Axes d'amélioration");
    for (const s of ai.improvements) {
      lines.push(`- **${s.title}** — ${s.description}`);
    }
    lines.push("");
  }

  if (Array.isArray(ai.actionPlan) && ai.actionPlan.length) {
    lines.push("## Plan d'action 30 jours");
    for (const a of ai.actionPlan) {
      const meta: string[] = [];
      if (a.metric) meta.push(`objectif : ${a.metric}`);
      if (a.impact) meta.push(`impact ${a.impact}`);
      if (a.effort) meta.push(`effort ${a.effort}`);
      lines.push(`- ${a.text}${meta.length ? ` _(${meta.join(" · ")})_` : ""}`);
    }
    lines.push("");
  }

  if (Array.isArray(ai.strategy3_6) && ai.strategy3_6.length) {
    lines.push("## Stratégie 3-6 mois");
    for (const a of ai.strategy3_6) {
      const meta: string[] = [];
      if (a.metric) meta.push(`objectif : ${a.metric}`);
      if (a.timeline) meta.push(a.timeline);
      if (a.impact) meta.push(`impact ${a.impact}`);
      lines.push(`- ${a.text}${meta.length ? ` _(${meta.join(" · ")})_` : ""}`);
    }
    lines.push("");
  }

  if (ai.hashtagStrategy) {
    lines.push("## Stratégie hashtags");
    if (ai.hashtagStrategy.strategy) {
      lines.push(ai.hashtagStrategy.strategy);
    }
    if (Array.isArray(ai.hashtagStrategy.suggested) && ai.hashtagStrategy.suggested.length) {
      lines.push(`Tags suggérés : ${ai.hashtagStrategy.suggested.map(cleanTag).join(" ")}`);
    }
    lines.push("");
  }

  if (Array.isArray(ai.bioOptimized) && ai.bioOptimized.length) {
    lines.push("## Bio optimisée");
    for (const b of ai.bioOptimized) lines.push(`- ${b}`);
    lines.push("");
  }

  if (ai.profilePhoto?.verdict) {
    lines.push("## Photo de profil");
    if (ai.profilePhoto.score != null) lines.push(`Score : ${ai.profilePhoto.score}/10`);
    lines.push(ai.profilePhoto.verdict);
    lines.push("");
  }

  if (ai.gridVisual?.verdict) {
    lines.push("## Visuel de grille");
    if (ai.gridVisual.score != null) lines.push(`Score : ${ai.gridVisual.score}/10`);
    lines.push(ai.gridVisual.verdict);
    lines.push("");
  }

  return lines.join("\n").trim();
}

function normalizeShadowban(sb: Any) {
  if (!sb) return null;
  return {
    risk_level: sb.riskLevel ?? sb.risk_level ?? "unknown",
    is_confirmed: sb.isConfirmed ?? sb.is_confirmed ?? false,
    shadowban_videos: sb.shadowbanVideos ?? sb.shadowban_videos ?? 0,
    total_videos: sb.totalVideos ?? sb.total_videos ?? 0,
    percentage: sb.percentage ?? 0,
    sb_threshold: sb.sbThreshold ?? sb.sb_threshold ?? null,
    diagnosis: sb.diagnosis ?? "",
    recommendations: sb.recommendations ?? [],
  };
}

function normalizeVideos(videos: Any[]) {
  if (!Array.isArray(videos)) return [];
  return videos.map((v) => ({
    id: v.id ?? v.videoId ?? v.video_id ?? v.awemeId ?? v.aweme_id,
    description: v.description ?? v.caption ?? v.title ?? "",
    views: pickMetric(v, ["views", "view_count", "viewCount", "playCount", "play_count", "plays", "diggCount"]),
    likes: pickMetric(v, ["likes", "like_count", "likeCount", "diggCount", "digg_count"]),
    comments: pickMetric(v, ["comments", "comment_count", "commentCount", "commentaryCount"]),
    shares: pickMetric(v, ["shares", "share_count", "shareCount"]),
    saves: pickMetric(v, ["saves", "save_count", "saveCount", "collectCount", "collect_count", "favorites", "favouriteCount"]),
    engagement_rate: v.engagementRate ?? v.engagement_rate ?? v.metrics?.engagementRate ?? v.metrics?.engagement_rate ?? null,
    save_rate: v.saveRate ?? v.save_rate ?? v.metrics?.saveRate ?? v.metrics?.save_rate ?? null,
    date: v.date ?? v.createdAt ?? v.created_at ?? v.publishedAt ?? v.published_at ?? null,
    cover_url: v.coverUrl ?? v.cover_url ?? v.cover ?? v.thumbnail ?? v.thumbnailUrl ?? v.thumbnail_url ?? null,
  }));
}

function normalizeHealthScore(hs: Any) {
  if (!hs) return null;
  if (typeof hs === "number") return { total: hs };
  const components: Record<string, { score: number }> = {};
  if (hs.components && typeof hs.components === "object") {
    for (const [k, v] of Object.entries(hs.components)) {
      if (typeof v === "number") {
        // Map camelCase -> snake_case keys consumed by HealthScoreSection
        const key = k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
        components[key] = { score: v };
      } else if (v && typeof v === "object" && typeof (v as Any).score === "number") {
        const key = k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
        components[key] = v as Any;
      }
    }
  }
  return {
    total: hs.total ?? null,
    overall_status: hs.status ?? hs.overall_status ?? null,
    components,
    priority_actions: hs.priority_actions ?? hs.priorityActions ?? [],
  };
}

function normalizePublicationPattern(pp: Any) {
  if (!pp) return null;
  return {
    best_days: pp.bestDays ?? pp.best_days ?? [],
    best_hours: pp.bestHours ?? pp.best_hours ?? [],
    frequency: pp.frequency ?? pp.currentFrequency ?? null,
    consistency_score: pp.consistencyScore ?? pp.consistency_score ?? null,
    max_gap_days: pp.maxGapDays ?? pp.max_gap_days ?? null,
    days_since_last_post: pp.daysSinceLastPost ?? pp.days_since_last_post ?? null,
    weekly_distribution: pp.weeklyDistribution ?? pp.weekly_distribution ?? [],
  };
}

/**
 * Detect whether a result is already in the legacy/normalized shape
 * (defensive — allows re-runs after migration without double-normalizing).
 */
function isAlreadyNormalized(result: Any): boolean {
  return !!(result?.account && (
    "follower_count" in result.account ||
    "ai_insights" in result.account
  ));
}

export function normalizeWavStatsResult(result: Any): Any {
  if (!result) return result;
  if (isAlreadyNormalized(result)) return result;

  const acc = result.account ?? {};
  const avg = result.averages ?? {};
  const ai = result.aiAnalysis ?? null;
  const hashtags: string[] = Array.isArray(result.hashtags) ? result.hashtags.map(cleanTag) : [];
  const aiInsightsMd = buildAiInsightsMarkdown(ai);
  const videos = normalizeVideos(result.topVideos ?? []);
  const shadowban = normalizeShadowban(result.shadowbanAnalysis);
  const healthScore = normalizeHealthScore(result.healthScore);
  const publicationPattern = normalizePublicationPattern(result.publicationPattern);

  const followerCount = acc.followers ?? acc.followerCount ?? acc.follower_count ?? 0;
  const videoCount = acc.totalVideos ?? acc.videoCount ?? acc.video_count ?? 0;
  const likeCount = acc.totalLikes ?? acc.likeCount ?? acc.like_count ?? 0;

  const normalizedAccount = {
    username: acc.username ?? "",
    display_name: acc.displayName ?? acc.display_name ?? acc.username ?? "",
    avatar_url: acc.avatarUrl ?? acc.avatar_url ?? "",
    bio: acc.bio ?? "",
    verified: !!acc.verified,
    detected_niche: acc.niche ?? acc.detected_niche ?? null,
    niche_confidence: acc.nicheConfidence ?? acc.niche_confidence ?? null,
    creator_level: acc.creatorLevel ?? acc.creator_level ?? null,
    account_status: acc.accountStatus ?? acc.account_status ?? null,

    follower_count: followerCount,
    following_count: acc.following ?? acc.followingCount ?? acc.following_count ?? 0,
    video_count: videoCount,
    like_count: likeCount,
    total_likes: likeCount,
    engagement_rate: acc.engagementRate ?? acc.engagement_rate ?? avg.engagementRate ?? 0,
    median_engagement_rate: avg.medianEngagementRate ?? avg.median_engagement_rate ?? null,
    save_rate: acc.saveRate ?? acc.save_rate ?? avg.saveRate ?? null,
    median_save_rate: avg.medianSaveRate ?? avg.median_save_rate ?? null,

    avg_views: avg.views ?? avg.avg_views ?? 0,
    avg_likes: avg.likes ?? avg.avg_likes ?? 0,
    avg_comments: avg.comments ?? avg.avg_comments ?? 0,
    avg_shares: avg.shares ?? avg.avg_shares ?? 0,
    avg_saves: avg.saves ?? avg.avg_saves ?? 0,

    median_views: avg.medianViews ?? avg.median_views ?? 0,
    median_likes: avg.medianLikes ?? avg.median_likes ?? 0,
    median_comments: avg.medianComments ?? avg.median_comments ?? 0,
    median_shares: avg.medianShares ?? avg.median_shares ?? 0,
    median_saves: avg.medianSaves ?? avg.median_saves ?? 0,

    top_hashtags: hashtags,
    shadowban_analysis: shadowban,
    recent_videos: videos,
    ai_insights: aiInsightsMd,
    // Pass health score on the account too (PDF generator looks here)
    health_score: healthScore,
  };

  return {
    account: normalizedAccount,
    ai_analysis: ai,
    health_score: healthScore,
    publication_pattern: publicationPattern,
    top_videos: videos,
    shadowban_analysis: shadowban,
    hashtags,
    averages: avg,
    // keep raw for debug
    _raw_v2: { type: result.type, completedAt: result.completedAt },
  };
}

export function extractHealthScoreNumber(result: Any): number | null {
  if (!result) return null;
  const hs = result.healthScore ?? result.health_score;
  if (typeof hs === "number") return hs;
  if (hs && typeof hs === "object" && typeof hs.total === "number") return hs.total;
  return null;
}

export function hasAiInsights(normalized: Any): boolean {
  const md = normalized?.account?.ai_insights;
  return !!(md && typeof md === "string" && md.trim().length > 0);
}