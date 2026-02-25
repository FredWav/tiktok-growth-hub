/**
 * Mapper pour convertir les données du compte vers le format attendu
 * par le générateur HTML de PDF
 */

import { parseAIInsightsToSections, ParsedSections } from './pdf-markdown-parser';

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
  shadowban_status?: string;
  niche?: string;
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

export function mapAccountDataForPDF(accountData: any): PDFDataFormat {
  const parsedSections = parseAIInsightsToSections(accountData.ai_insights || '');
  const popularHashtags = extractPopularHashtags(accountData);
  const totalLikes = accountData.like_count || 
    (accountData.avg_likes && accountData.video_count 
      ? Math.round(accountData.avg_likes * accountData.video_count) 
      : 0);

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
    health_score: extractHealthScore(accountData),
    shadowban_status: extractShadowbanStatus(accountData),
    niche: accountData.detected_niche || accountData.niche || undefined
  };
}
