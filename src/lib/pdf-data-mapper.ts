/**
 * Mapper pour convertir les données du compte vers le format attendu
 * par le générateur HTML de PDF
 */

import { parseAIInsightsToSections, ParsedSections } from './pdf-markdown-parser';

export interface BestTime {
  /** Numeric day 0-6 (Sunday=0). Optional when the API returns labels. */
  day?: number;
  /** Numeric hour 0-23. Optional when the API returns labels. */
  hour?: number;
  /** Optional pre-formatted label (e.g. "Lundi 07h-08h"). Used when day/hour unknown. */
  label?: string;
  avg_views: number;
}

export interface RegularityItem {
  score: number;
  details: string;
}

export interface PersonaData {
  niche_principale?: string;
  forces?: string[];
  faiblesses?: string[];
}

export interface PDFDataFormat {
  platform: string;
  username: string;
  ai_insights: string;
  display_name: string;
  profile_picture_url: string;
  bio: string;
  generated_at: string;
  avatar_url?: string;
  verified?: boolean;
  follower_count?: number;
  following_count?: number;
  video_count?: number;
  like_count?: number;
  total_likes?: number;
  avg_views?: number;
  median_views?: number;
  engagement_rate?: number;
  avg_likes?: number;
  top_hashtags?: string[];
  stats: {
    followers: number;
    following: number;
    videos: number;
    total_likes: number;
    engagement_rate: number;
    median_engagement_rate: number;
    avg_views: number;
    median_views: number;
    avg_likes: number;
    median_likes: number;
    avg_comments: number;
    median_comments: number;
    avg_saves: number;
    median_saves: number;
    avg_shares: number;
    median_shares: number;
  };
  popular_hashtags: string[];
  sections: ParsedSections;
  health_score?: number;
  /** Full health score object (total + components + priority_actions) used by the detail section. */
  health_score_detail?: {
    total?: number;
    components?: Record<string, number>;
    priority_actions?: string[];
  };
  shadowban_status?: string;
  niche?: string;
  best_times?: BestTime[];
  regularity_breakdown?: Record<string, RegularityItem>;
  consistency_score?: number;
  publication_frequency?: { daily_avg?: number; weekly_pattern?: string };
  recommendations?: string[];
  persona?: PersonaData;
}

function cleanUsername(username: string | null | undefined): string {
  if (!username) return 'inconnu';
  return username.replace(/^@/, '');
}

function extractPopularHashtags(accountData: any): string[] {
  if (accountData.top_hashtags && Array.isArray(accountData.top_hashtags)) {
    return accountData.top_hashtags.slice(0, 10);
  }
  if (accountData.hashtag_analysis?.top_performing) {
    return accountData.hashtag_analysis.top_performing
      .map((h: any) => h.hashtag || h.tag || h)
      .slice(0, 10);
  }
  if (accountData.recent_videos && Array.isArray(accountData.recent_videos)) {
    const allHashtags = new Set<string>();
    for (const video of accountData.recent_videos) {
      const hashtags = video.hashtags || extractHashtagsFromDescription(video.description);
      hashtags.forEach((h: string) => allHashtags.add(h));
    }
    return Array.from(allHashtags).slice(0, 10);
  }
  return [];
}

function extractHashtagsFromDescription(description: string | null | undefined): string[] {
  if (!description) return [];
  const matches = description.match(/#[\w\u00C0-\u017F]+/g);
  return matches || [];
}

function extractHealthScore(accountData: any): number | undefined {
  if (typeof accountData.health_score === 'number') return accountData.health_score;
  if (accountData.health_score?.total) return accountData.health_score.total;
  if (accountData.health_score?.global) return accountData.health_score.global;
  return undefined;
}

function extractShadowbanStatus(accountData: any): string {
  if (!accountData.shadowban_analysis) return 'Non analysé';
  const analysis = accountData.shadowban_analysis;
  if (analysis.risk_level === 'none' || analysis.risk_level === 'low') return 'Aucun shadowban détecté';
  if (analysis.risk_level === 'medium') return 'Risque modéré de shadowban';
  if (analysis.risk_level === 'high' || analysis.risk_level === 'confirmed') return 'Shadowban probable/confirmé';
  return analysis.diagnosis || 'Statut inconnu';
}

function derivePersonaFromAi(ai: any, detectedNiche?: string | null): PersonaData | undefined {
  if (!ai) return detectedNiche ? { niche_principale: detectedNiche } : undefined;
  const forces = Array.isArray(ai.strengths)
    ? ai.strengths.slice(0, 4).map((s: any) => s?.title).filter(Boolean)
    : [];
  const faiblesses = Array.isArray(ai.improvements)
    ? ai.improvements.slice(0, 4).map((s: any) => s?.title).filter(Boolean)
    : [];
  if (!detectedNiche && !forces.length && !faiblesses.length) return undefined;
  return {
    niche_principale: detectedNiche || undefined,
    forces: forces.length ? forces : undefined,
    faiblesses: faiblesses.length ? faiblesses : undefined,
  };
}

function flattenHealthComponents(hs: any): Record<string, number> | undefined {
  const comps = hs?.components;
  if (!comps || typeof comps !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(comps)) {
    if (typeof v === "number") out[k] = v;
    else if (v && typeof v === "object" && typeof (v as any).score === "number") out[k] = (v as any).score;
  }
  return Object.keys(out).length ? out : undefined;
}

function parseWeeklyFrequency(freq?: string | null): number | undefined {
  if (!freq || typeof freq !== "string") return undefined;
  // Matches "3 vidéos / semaine", "3-5 / semaine", "0.5 vidéo/jour"
  const m = freq.match(/(\d+(?:[.,]\d+)?)(?:\s*[-à]\s*(\d+(?:[.,]\d+)?))?\s*(?:vid[eé]os?)?\s*\/\s*(jour|semaine|week|day)/i);
  if (!m) return undefined;
  const low = parseFloat(m[1].replace(",", "."));
  const high = m[2] ? parseFloat(m[2].replace(",", ".")) : low;
  const avg = (low + high) / 2;
  const unit = m[3].toLowerCase();
  return unit.startsWith("j") || unit.startsWith("d") ? avg : avg / 7;
}

function buildBestTimesFromLabels(pp: any): BestTime[] | undefined {
  if (!pp) return undefined;
  const days: string[] = Array.isArray(pp.best_days) ? pp.best_days : [];
  const hours: string[] = Array.isArray(pp.best_hours) ? pp.best_hours : [];
  if (!days.length && !hours.length) return undefined;

  // Case A: strings (v2 API) → build labels
  const allStrings = [...days, ...hours].every((v) => typeof v === "string");
  if (allStrings) {
    const items: BestTime[] = [];
    if (days.length && hours.length) {
      for (const d of days.slice(0, 3)) for (const h of hours.slice(0, 3)) items.push({ label: `${d} · ${h}`, avg_views: 0 });
    } else if (days.length) {
      for (const d of days.slice(0, 5)) items.push({ label: d, avg_views: 0 });
    } else {
      for (const h of hours.slice(0, 5)) items.push({ label: h, avg_views: 0 });
    }
    return items.slice(0, 5);
  }

  // Case B: already structured (legacy)
  if (Array.isArray(pp.best_times)) return pp.best_times;
  return undefined;
}

export function mapAccountDataForPDF(
  accountData: any,
  persona?: any,
  pubPattern?: any,
  aiAnalysis?: any,
  healthScoreDetail?: any
): PDFDataFormat {
  const parsedSections = parseAIInsightsToSections(accountData.ai_insights || '');
  const popularHashtags = extractPopularHashtags(accountData);
  const totalLikes = accountData.like_count || 
    (accountData.avg_likes && accountData.video_count 
      ? Math.round(accountData.avg_likes * accountData.video_count) 
      : 0);

  // Health score: expose a plain number for the cover, and a flat detail object for the section.
  const hsSource = healthScoreDetail ?? accountData.health_score;
  const healthScoreNumber = extractHealthScore(accountData) ?? (typeof hsSource === "object" ? hsSource?.total : undefined);
  const flatComponents = flattenHealthComponents(hsSource);
  const healthDetail = hsSource && typeof hsSource === "object"
    ? {
        total: hsSource.total,
        components: flatComponents,
        priority_actions: hsSource.priority_actions || hsSource.priorityActions || [],
      }
    : undefined;

  // Derive persona from AI analysis when not supplied by caller.
  const finalPersona: PersonaData | undefined = persona
    ? {
        niche_principale: persona.niche_principale,
        forces: persona.forces,
        faiblesses: persona.faiblesses,
      }
    : derivePersonaFromAi(aiAnalysis, accountData.detected_niche || accountData.niche);

  // Best times: adapt v2 label format when needed
  const bestTimes = (Array.isArray(pubPattern?.best_times) && pubPattern.best_times.length)
    ? pubPattern.best_times
    : buildBestTimesFromLabels(pubPattern);

  // Publication frequency: derive from v2 `frequency` string when missing
  let pubFreq = pubPattern?.publication_frequency;
  if (!pubFreq && pubPattern?.frequency) {
    const dailyAvg = parseWeeklyFrequency(pubPattern.frequency);
    pubFreq = {
      weekly_pattern: pubPattern.frequency,
      ...(dailyAvg !== undefined ? { daily_avg: dailyAvg } : {}),
    };
  }

  // Recommendations fallback: use AI action plan when publication pattern has none
  let recommendations: string[] = Array.isArray(pubPattern?.recommendations) ? pubPattern.recommendations : [];
  if (!recommendations.length && Array.isArray(aiAnalysis?.actionPlan)) {
    recommendations = aiAnalysis.actionPlan.slice(0, 3).map((a: any) => a?.text).filter(Boolean);
  }

  return {
    platform: 'tiktok',
    username: cleanUsername(accountData.username),
    ai_insights: accountData.ai_insights || '',
    display_name: accountData.display_name || accountData.username || 'Inconnu',
    profile_picture_url: accountData.avatar_url || '',
    bio: accountData.bio || '',
    generated_at: new Date().toISOString().split('T')[0],
    avatar_url: accountData.avatar_url || '',
    verified: accountData.verified || false,
    follower_count: accountData.follower_count || 0,
    following_count: accountData.following_count || 0,
    video_count: accountData.video_count || 0,
    like_count: accountData.like_count || 0,
    total_likes: totalLikes,
    avg_views: accountData.avg_views || 0,
    median_views: accountData.median_views || 0,
    engagement_rate: accountData.engagement_rate || 0,
    avg_likes: accountData.avg_likes || 0,
    top_hashtags: popularHashtags,
    stats: {
      followers: accountData.follower_count || 0,
      following: accountData.following_count || 0,
      videos: accountData.video_count || 0,
      total_likes: totalLikes,
      engagement_rate: accountData.engagement_rate || 0,
      median_engagement_rate: accountData.median_engagement_rate || accountData.engagement_rate || 0,
      avg_views: accountData.avg_views || 0,
      median_views: accountData.median_views || 0,
      avg_likes: accountData.avg_likes || 0,
      median_likes: accountData.median_likes || 0,
      avg_comments: accountData.avg_comments || 0,
      median_comments: accountData.median_comments || 0,
      avg_saves: accountData.avg_saves || 0,
      median_saves: accountData.median_saves || 0,
      avg_shares: accountData.avg_shares || 0,
      median_shares: accountData.median_shares || 0
    },
    popular_hashtags: popularHashtags,
    sections: parsedSections,
    health_score: healthScoreNumber,
    health_score_detail: healthDetail,
    shadowban_status: extractShadowbanStatus(accountData),
    niche: accountData.detected_niche || accountData.niche || undefined,
    best_times: bestTimes || [],
    regularity_breakdown: pubPattern?.regularity_details?.tiktok_breakdown || undefined,
    consistency_score: pubPattern?.consistency_score,
    publication_frequency: pubFreq,
    recommendations,
    persona: finalPersona,
  };
}
