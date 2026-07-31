import type { ActionItem, ReportModel, ScoreComponent, ShadowbanRisk, Stat } from "./report-model";
import {
  cleanUsername,
  fmtCompact,
  fmtDateFr,
  fmtInt,
  fmtPercent,
  fmtShortDateFr,
  initialsOf,
  stripMarkdown,
  toNumber,
  truncate,
} from "./format";

/** Libellés partagés avec l'affichage écran (HealthScoreSection). */
const COMPONENT_LABELS: Record<string, string> = {
  engagement: "Interactions sur tes vidéos",
  consistency: "Régularité de publication",
  content_quality: "Qualité de tes contenus",
  growth_potential: "Marge de progression",
  technical_seo: "Référencement de tes vidéos",
  save_quality: "Vidéos mises en favori",
};

/** Libellés partagés avec l'affichage écran (ShadowbanSection). */
const RISK_LABELS: Record<string, string> = {
  none: "Aucun risque",
  low: "Risque faible",
  medium: "Risque modéré",
  high: "Risque élevé",
  confirmed: "Shadowban confirmé",
  unknown: "Non analysé",
};

const STATUS_LABELS: Record<string, string> = {
  excellent: "Excellent",
  bon: "Bon",
  good: "Bon",
  moyen: "Moyen",
  average: "Moyen",
  faible: "Faible",
  poor: "Faible",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Les données d'analyse arrivent sans schéma garanti : tout est lu défensivement. */
type Raw = Record<string, unknown>;

const asRecord = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

/**
 * Les métriques d'une vidéo changent de nom selon la version de l'API : on
 * cherche la clé à plat puis dans les conteneurs habituels.
 */
function pickVideoMetric(video: Raw, keys: string[]): number | null {
  const containers = [video, video.metrics, video.stats, video.statistics, video.analytics].filter(Boolean);
  for (const c of containers) {
    for (const k of keys) {
      const n = toNumber(asRecord(c)[k]);
      if (n !== null) return n;
    }
  }
  return null;
}

/** Une stat absente est omise, jamais affichée à « 0 » : un chiffre faux vaut moins que rien. */
function stat(label: string, value: string | null | undefined): Stat | null {
  return value ? { label, value } : null;
}

function compact(list: (Stat | null)[]): Stat[] {
  return list.filter((s): s is Stat => s !== null);
}

function normalizeComponents(raw: unknown): ScoreComponent[] {
  const src = asRecord(raw);
  return Object.entries(src)
    .map(([key, value]) => {
      // Les composantes arrivent soit en { score: n }, soit en nombre nu.
      const score = toNumber(asRecord(value).score ?? value);
      if (score === null) return null;
      const label =
        COMPONENT_LABELS[key] ??
        key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
      return { key, label, score: Math.max(0, Math.min(100, score)) };
    })
    .filter((c): c is ScoreComponent => c !== null)
    .sort((a, b) => b.score - a.score);
}

function normalizeActionItems(raw: unknown): ActionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): ActionItem | null => {
      if (typeof entry === "string") return { text: stripMarkdown(entry) };
      const e = asRecord(entry);
      const text = stripMarkdown(String(e.text ?? e.title ?? ""));
      if (!text) return null;
      return {
        text,
        metric: e.metric ? stripMarkdown(String(e.metric)) : undefined,
        impact: e.impact ? String(e.impact).trim() : undefined,
        effort: e.effort ? String(e.effort).trim() : undefined,
        timeline: e.timeline ? String(e.timeline).trim() : undefined,
      };
    })
    .filter((i): i is ActionItem => i !== null);
}

function normalizeTitled(raw: unknown): { title: string; description: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return { title: stripMarkdown(entry), description: "" };
      const e = asRecord(entry);
      const title = stripMarkdown(String(e.title ?? ""));
      const description = stripMarkdown(String(e.description ?? ""));
      if (!title && !description) return null;
      return { title: title || description, description: title ? description : "" };
    })
    .filter((i): i is { title: string; description: string } => i !== null);
}

function normalizeStringList(raw: unknown, max = 20): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => stripMarkdown(String(v ?? "")))
    .filter(Boolean)
    .slice(0, max);
}

export function buildReportModel(input: unknown): ReportModel {
  const raw = asRecord(input);
  // Certaines lignes anciennes stockent le compte à la racine plutôt que sous `account`.
  const account = asRecord(raw.account ?? raw);
  const healthRaw = asRecord(raw.health_score ?? account.health_score);
  const pub = asRecord(raw.publication_pattern);
  const sb = asRecord(raw.shadowban_analysis ?? account.shadowban_analysis);
  const aiRaw = asRecord(raw.ai_analysis);

  const username = cleanUsername(account.username) || "compte";
  const displayName = String(account.display_name ?? "").trim() || username;

  // ── Santé ────────────────────────────────────────────────────────────────
  const total = toNumber(healthRaw.total ?? healthRaw.score ?? account.health_score);
  const components = normalizeComponents(healthRaw.components);
  const priorityActions = normalizeStringList(healthRaw.priority_actions, 6);
  const health =
    total !== null || components.length
      ? {
          total: Math.max(0, Math.min(100, total ?? 0)),
          statusLabel: healthRaw.overall_status
            ? STATUS_LABELS[String(healthRaw.overall_status).toLowerCase()] ??
              String(healthRaw.overall_status)
            : undefined,
          components,
          priorityActions,
        }
      : undefined;

  // ── Statistiques ─────────────────────────────────────────────────────────
  const primary = compact([
    stat("Abonnés", fmtCompact(account.follower_count)),
    stat("Mentions J'aime", fmtCompact(account.total_likes ?? account.like_count)),
    stat("Vidéos publiées", fmtInt(account.video_count)),
    stat("Taux d'interaction", fmtPercent(account.engagement_rate, 2)),
  ]);
  const averages = compact([
    stat("Vues", fmtCompact(account.avg_views)),
    stat("J'aime", fmtCompact(account.avg_likes)),
    stat("Commentaires", fmtCompact(account.avg_comments)),
    stat("Partages", fmtCompact(account.avg_shares)),
    stat("Enregistrements", fmtCompact(account.avg_saves)),
  ]);
  const medians = compact([
    stat("Vues", fmtCompact(account.median_views)),
    stat("J'aime", fmtCompact(account.median_likes)),
    stat("Commentaires", fmtCompact(account.median_comments)),
    stat("Partages", fmtCompact(account.median_shares)),
    stat("Enregistrements", fmtCompact(account.median_saves)),
  ]);

  // ── Rythme de publication ────────────────────────────────────────────────
  const bestDays = normalizeStringList(pub.best_days, 4);
  const bestHours = normalizeStringList(pub.best_hours, 4);
  const consistency = toNumber(pub.consistency_score);
  const maxGap = toNumber(pub.max_gap_days);
  const sinceLast = toNumber(pub.days_since_last_post);
  // Le tableau reçu peut compter plus de 7 entrées : on le ramène à la semaine.
  const weekly = Array.isArray(pub.weekly_distribution)
    ? pub.weekly_distribution
        .slice(0, 7)
        .map((v: unknown, i: number) => ({ label: WEEKDAYS[i], value: toNumber(v) ?? 0 }))
    : undefined;
  const publication =
    bestDays.length || bestHours.length || pub.frequency || consistency !== null
      ? {
          bestDays,
          bestHours,
          frequency: pub.frequency ? String(pub.frequency) : undefined,
          consistencyScore: consistency ?? undefined,
          maxGapLabel: maxGap !== null ? `${maxGap} jour${maxGap > 1 ? "s" : ""}` : undefined,
          lastPostLabel:
            sinceLast !== null
              ? sinceLast === 0
                ? "Aujourd'hui"
                : `Il y a ${sinceLast} jour${sinceLast > 1 ? "s" : ""}`
              : undefined,
          weeklyDistribution: weekly && weekly.length ? weekly : undefined,
        }
      : undefined;

  // ── Shadowban ────────────────────────────────────────────────────────────
  const riskLevel = (String(sb.risk_level ?? "unknown").toLowerCase() as ShadowbanRisk) || "unknown";
  const sbTotal = toNumber(sb.total_videos);
  const sbHit = toNumber(sb.shadowban_videos);
  const sbPct = toNumber(sb.percentage);
  const shadowban = Object.keys(sb).length
    ? {
        riskLevel,
        riskLabel: RISK_LABELS[riskLevel] ?? RISK_LABELS.unknown,
        diagnosis: sb.diagnosis ? stripMarkdown(String(sb.diagnosis)) : undefined,
        ratioLabel:
          sbTotal !== null && sbHit !== null
            ? `${sbHit} vidéo${sbHit > 1 ? "s" : ""} sur ${sbTotal} analysée${sbTotal > 1 ? "s" : ""}${
                sbPct !== null ? ` (${fmtPercent(sbPct, 0)})` : ""
              }`
            : undefined,
        recommendations: normalizeStringList(sb.recommendations, 6),
      }
    : undefined;

  // ── Top vidéos ───────────────────────────────────────────────────────────
  const videosRaw = Array.isArray(raw.top_videos)
    ? raw.top_videos
    : Array.isArray(account.recent_videos)
      ? account.recent_videos
      : [];
  const topVideos = videosRaw
    .map((v: unknown) => {
      const video = asRecord(v);
      const views = pickVideoMetric(video, ["views", "playCount", "play_count", "viewCount"]);
      return { video, views: views ?? 0 };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(({ video }, i) => {
      const er = pickVideoMetric(video, ["engagement_rate", "engagementRate"]);
      return {
        rank: i + 1,
        description: truncate(String(video.description ?? video.title ?? "Sans description"), 120),
        dateLabel: fmtShortDateFr(
          String(video.date ?? video.create_time ?? video.createTime ?? "") || undefined,
        ),
        views: fmtCompact(pickVideoMetric(video, ["views", "playCount", "play_count"])) ?? "—",
        likes: fmtCompact(pickVideoMetric(video, ["likes", "diggCount", "like_count"])) ?? "—",
        comments: fmtCompact(pickVideoMetric(video, ["comments", "commentCount", "comment_count"])) ?? "—",
        shares: fmtCompact(pickVideoMetric(video, ["shares", "shareCount", "share_count"])) ?? "—",
        saves: fmtCompact(pickVideoMetric(video, ["saves", "collectCount", "save_count"])) ?? "—",
        erLabel: er !== null ? fmtPercent(er, 2) ?? undefined : undefined,
      };
    });

  // ── Analyse IA ───────────────────────────────────────────────────────────
  const strengths = normalizeTitled(aiRaw.strengths);
  const improvements = normalizeTitled(aiRaw.improvements);
  const actionPlan = normalizeActionItems(aiRaw.actionPlan);
  const strategy36 = normalizeActionItems(aiRaw.strategy3_6);
  const bioOptimized = normalizeStringList(aiRaw.bioOptimized, 5);
  const hashtagRaw = asRecord(aiRaw.hashtagStrategy);
  const photo = asRecord(aiRaw.profilePhoto);
  const grid = asRecord(aiRaw.gridVisual);
  const summary = aiRaw.summary ? stripMarkdown(String(aiRaw.summary)) : undefined;

  const hasAi =
    !!summary ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    actionPlan.length > 0 ||
    strategy36.length > 0 ||
    bioOptimized.length > 0;

  const ai = hasAi
    ? {
        summary,
        strengths,
        improvements,
        actionPlan,
        strategy36,
        bioOptimized,
        hashtagStrategy: Object.keys(hashtagRaw).length
          ? {
              current: normalizeStringList(hashtagRaw.current, 12),
              suggested: normalizeStringList(hashtagRaw.suggested, 12),
              strategy: hashtagRaw.strategy ? stripMarkdown(String(hashtagRaw.strategy)) : undefined,
            }
          : undefined,
        profilePhoto: photo.verdict
          ? { score: toNumber(photo.score) ?? undefined, verdict: stripMarkdown(String(photo.verdict)) }
          : undefined,
        gridVisual: grid.verdict
          ? { score: toNumber(grid.score) ?? undefined, verdict: stripMarkdown(String(grid.verdict)) }
          : undefined,
      }
    : undefined;

  // ── Sommaire de couverture ───────────────────────────────────────────────
  const contents: string[] = [];
  if (ai?.summary) contents.push("Ce qu'il faut retenir");
  if (health) contents.push("Le détail de ta note");
  if (primary.length) contents.push("Tes chiffres");
  if (publication) contents.push("Ton rythme de publication");
  if (topVideos.length) contents.push("Tes meilleures vidéos");
  if (ai && (ai.strengths.length || ai.improvements.length)) contents.push("Ce qui fonctionne, ce qui bloque");
  if (ai?.actionPlan.length) contents.push("Plan d'action 30 jours");
  if (ai?.strategy36.length) contents.push("Stratégie 3-6 mois");
  if (ai && (ai.profilePhoto || ai.gridVisual || ai.bioOptimized.length)) {
    contents.push("Améliorer ton profil");
  }

  return {
    meta: {
      username,
      displayName,
      initials: initialsOf(account.display_name as string, username),
      verified: Boolean(account.verified),
      bio: account.bio ? String(account.bio).trim() : undefined,
      niche: account.detected_niche ? String(account.detected_niche).trim() : undefined,
      creatorLevel: account.creator_level ? String(account.creator_level).trim() : undefined,
      generatedAtLabel: fmtDateFr(),
    },
    health,
    stats: { primary, averages, medians },
    publication,
    shadowban,
    topVideos,
    hashtags: normalizeStringList(account.top_hashtags ?? raw.hashtags, 12),
    ai,
    contents,
  };
}
