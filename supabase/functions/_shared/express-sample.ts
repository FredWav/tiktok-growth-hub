import { normalizeWavStatsResult } from "./wavstats-normalizer.ts";

type RecordValue = Record<string, unknown>;
const record = (v: unknown): RecordValue =>
  v && typeof v === "object" && !Array.isArray(v) ? v as RecordValue : {};
const median = (a: number[]) => {
  const s = [...a].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Proposed partner contract, deliberately fail-closed until verified with WavStats.
 * `analysisScope.videoIds` identifies ALL available analysed videos (max 120).
 * Every external derived section must attest to the identical IDs. A top-video list is not a sample.
 */
export function normalizeExpressSample(input: unknown) {
  const raw = record(input),
    account = record(raw.account),
    scope = record(raw.analysisScope);
  if (
    account.isPrivate === true || account.private === true ||
    account.is_private === true
  ) throw new Error("Compte privé");
  if (
    !Array.isArray(raw.videos) || !raw.videos.length || raw.videos.length > 120
  ) throw new Error("Échantillon intégral de 1 à 120 vidéos requis");
  const videos = raw.videos.map(record);
  const ids = videos.map((v) => String(v.id ?? v.videoId ?? v.video_id ?? ""));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("Identifiants vidéo manquants ou dupliqués");
  }
  const sameIds = (value: unknown) =>
    Array.isArray(value) && value.length === ids.length &&
    new Set(value.map(String)).size === ids.length && ids.every((id) =>
      value.map(String).includes(id)
    );
  if (!sameIds(scope.videoIds)) {
    throw new Error("Périmètre du rapport non attesté");
  }
  const sections = record(scope.sections);
  for (
    const section of [
      "aiAnalysis",
      "healthScore",
      "publicationPattern",
      "hashtags",
      "shadowbanAnalysis",
    ]
  ) {
    if (raw[section] != null && !sameIds(sections[section])) {
      throw new Error(`Périmètre divergent : ${section}`);
    }
  }
  const normalized = normalizeWavStatsResult({ ...raw, topVideos: raw.videos });
  const pool = normalized.account.recent_videos as {
    id: string;
    date: string | null;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  }[];
  if (!pool.length) throw new Error("Aucune vidéo exploitable");
  const dates = pool.map((v) => v.date ? new Date(v.date).getTime() : NaN);
  if (dates.some((d) => !Number.isFinite(d))) {
    throw new Error("Dates des vidéos non documentées");
  }
  // These metric fields are required; missing metrics must not silently become zero.
  const aliases: Record<string, string[]> = {
    views: [
      "views",
      "view_count",
      "viewCount",
      "playCount",
      "play_count",
      "plays",
    ],
    likes: ["likes", "like_count", "likeCount", "diggCount", "digg_count"],
    comments: ["comments", "comment_count", "commentCount", "commentaryCount"],
    shares: ["shares", "share_count", "shareCount"],
    saves: [
      "saves",
      "save_count",
      "saveCount",
      "collectCount",
      "collect_count",
      "favorites",
      "favouriteCount",
    ],
  };
  for (
    const metric of ["views", "likes", "comments", "shares", "saves"] as const
  ) {
    const values = pool.map((v) => v[metric]);
    for (const v of videos) {
      const buckets = [
        v,
        record(v.metrics),
        record(v.stats),
        record(v.statistics),
        record(v.analytics),
      ];
      const value = buckets.flatMap((b) =>
        aliases[metric].filter((k) =>
          b[k] != null
        ).map((k) => b[k])
      )[0];
      if (
        value == null || !Number.isFinite(Number(value)) || Number(value) < 0
      ) throw new Error(`Métrique indisponible : ${metric}`);
    }
    normalized.account[`avg_${metric}`] = values.reduce((a, b) => a + b, 0) /
      pool.length;
    normalized.account[`median_${metric}`] = median(values);
  }
  const sum = (key: "views" | "likes" | "comments" | "shares" | "saves") =>
    pool.reduce((s, v) => s + v[key], 0);
  normalized.account.engagement_rate = sum("views")
    ? 100 * (sum("likes") + sum("comments") + sum("shares") + sum("saves")) /
      sum("views")
    : null;
  normalized.account.save_rate = sum("views")
    ? 100 * sum("saves") / sum("views")
    : null;
  for (const video of pool) {
    const rates = video as typeof video & {
      engagement_rate: number | null;
      save_rate: number | null;
    };
    rates.engagement_rate = video.views
      ? 100 * (video.likes + video.comments + video.shares + video.saves) /
        video.views
      : null;
    rates.save_rate = video.views ? 100 * video.saves / video.views : null;
  }
  const measured = pool.filter((v) => v.views > 0);
  normalized.account.median_engagement_rate = measured.length
    ? median(
      measured.map((v) =>
        100 * (v.likes + v.comments + v.shares + v.saves) / v.views
      ),
    )
    : null;
  normalized.account.median_save_rate = measured.length
    ? median(measured.map((v) => 100 * v.saves / v.views))
    : null;
  normalized.averages = {}; // No fallback to unverified upstream aggregates in the PDF.
  normalized.account.niche_confidence = null;
  normalized.top_videos = [...pool].sort((a, b) => b.views - a.views).slice(
    0,
    10,
  );
  normalized.sample = {
    count: pool.length,
    from: new Date(Math.min(...dates)).toISOString(),
    to: new Date(Math.max(...dates)).toISOString(),
    limited: pool.length < 30,
    ids,
    methodology:
      "Moyennes et médianes : même échantillon. Engagement : (likes + commentaires + partages + enregistrements) / vues × 100. Statistiques globales du profil séparées. Interprétations automatisées à tester, non des certitudes.",
  };
  return normalized;
}
