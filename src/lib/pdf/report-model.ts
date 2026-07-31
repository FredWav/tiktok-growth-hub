/**
 * Modèle du rapport PDF de l'Analyse Express.
 *
 * Le modèle porte des chaînes **déjà formatées** (fr-FR) pour tout ce qui est
 * affiché tel quel, et ne garde des nombres bruts que là où le rendu en dépend
 * (scores 0-100 des barres et du donut). Les composants du document sont donc
 * muets : aucune logique de formatage ni de repli n'y vit.
 */

export type Stat = { label: string; value: string };

export type ScoreComponent = { key: string; label: string; score: number };

export type ActionItem = {
  text: string;
  metric?: string;
  impact?: string;
  effort?: string;
  timeline?: string;
};

export type ShadowbanRisk = "none" | "low" | "medium" | "high" | "confirmed" | "unknown";

export interface ReportModel {
  meta: {
    username: string;
    displayName: string;
    /** Deux lettres pour la pastille monogramme (l'avatar TikTok est inutilisable : pas de CORS). */
    initials: string;
    verified: boolean;
    bio?: string;
    niche?: string;
    creatorLevel?: string;
    generatedAtLabel: string;
  };
  health?: {
    total: number;
    statusLabel?: string;
    components: ScoreComponent[];
    priorityActions: string[];
  };
  stats: {
    primary: Stat[];
    averages: Stat[];
    medians: Stat[];
  };
  publication?: {
    bestDays: string[];
    bestHours: string[];
    frequency?: string;
    consistencyScore?: number;
    maxGapLabel?: string;
    lastPostLabel?: string;
    weeklyDistribution?: { label: string; value: number }[];
  };
  shadowban?: {
    riskLevel: ShadowbanRisk;
    riskLabel: string;
    diagnosis?: string;
    ratioLabel?: string;
    recommendations: string[];
  };
  topVideos: {
    rank: number;
    description: string;
    dateLabel?: string;
    views: string;
    likes: string;
    comments: string;
    shares: string;
    saves: string;
    erLabel?: string;
  }[];
  hashtags: string[];
  ai?: {
    summary?: string;
    strengths: { title: string; description: string }[];
    improvements: { title: string; description: string }[];
    actionPlan: ActionItem[];
    strategy36: ActionItem[];
    bioOptimized: string[];
    hashtagStrategy?: { current: string[]; suggested: string[]; strategy?: string };
    profilePhoto?: { score?: number; verdict: string };
    gridVisual?: { score?: number; verdict: string };
  };
  /** Sommaire de couverture, calculé depuis les sections réellement présentes. */
  contents: string[];
}
