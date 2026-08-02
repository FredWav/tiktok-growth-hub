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
    /** Deux lettres, affichées en repli quand l'avatar n'a pas pu être chargé. */
    initials: string;
    /** Avatar en data URI. Absent si l'image n'a pas pu être récupérée. */
    avatar?: string;
    verified: boolean;
    bio?: string;
    niche?: string;
    /** Fiabilité de la niche détectée, en pourcentage. */
    nicheConfidence?: number;
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
    /** Taux d'interaction et d'enregistrement, exprimés en pourcentage. */
    rates: Stat[];
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
    /** Miniature en data URI. Absente si l'image n'a pas pu être récupérée. */
    cover?: string;
    views: string;
    likes: string;
    comments: string;
    shares: string;
    saves: string;
    erLabel?: string;
    /** Taux d'enregistrement de la vidéo, en pourcentage. */
    saveRateLabel?: string;
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

/**
 * Présence des blocs de recommandations.
 *
 * Le document en a besoin pour décider quelles pages émettre : une section qui
 * renvoie `null` à l'intérieur d'une `<Page>` laisserait une page blanche. Ces
 * prédicats sont donc la source unique, partagée entre le document et les
 * sections elles-mêmes.
 */
export const hasStrengths = (m: ReportModel): boolean =>
  !!m.ai && (m.ai.strengths.length > 0 || m.ai.improvements.length > 0);

export const hasActionPlan = (m: ReportModel): boolean =>
  !!m.ai && (m.ai.actionPlan.length > 0 || m.ai.strategy36.length > 0);

export const hasBranding = (m: ReportModel): boolean =>
  !!m.ai &&
  (m.ai.bioOptimized.length > 0 || !!m.ai.hashtagStrategy || !!m.ai.profilePhoto || !!m.ai.gridVisual);
