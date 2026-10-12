/**
 * Résultat WavStats `video_analysis` (schemaVersion 1) -> données du rapport client.
 *
 * Contrat fourni par WavStats (2026-10) : les blocs éditoriaux peuvent être null,
 * recevoir de nouvelles clés ou perdre un texte. On ne lit donc que les champs
 * connus, on ignore le reste, et rien n'est inventé : un bloc absent reste absent.
 * Un résultat sans matière (pas de verdict ni de conseil) est refusé : la commande
 * passe en échec plutôt que de livrer un rapport vide.
 *
 * Module pur : utilisé par les Edge Functions, le front (types) et les tests Node.
 */

export const VIDEO_REPORT_VERSION = "video-v1";

export type VideoReportItem = { title: string; description: string | null };
export type VideoReport = {
  version: typeof VIDEO_REPORT_VERSION;
  video: {
    author: string | null;
    description: string | null;
    durationSeconds: number | null;
    hashtags: string[];
  };
  summary: {
    verdict: string;
    overallScore: number | null;
    niche: string | null;
    /** Avertissement WavStats quand la vidéo est trop récente pour conclure. */
    maturityNotice: string | null;
    conclusionsReliable: boolean;
  };
  metrics: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    engagementRate: number | null;
    /** Interactions pour 1 000 vues ; une valeur non fiable est omise. */
    perMille: { likes: number | null; comments: number | null; shares: number | null; saves: number | null } | null;
    /** Comparaison avec l'historique du même compte. */
    account: {
      medianViews: number | null;
      rank: number | null;
      rankTotal: number | null;
      topPercent: number | null;
      accountEngagement: number | null;
    } | null;
  };
  /** Scores sur 100 ; null quand WavStats les juge non fiables ou absents. */
  scores: { hook: number | null; engagement: number | null; saves: number | null; share: number | null; viral: number | null };
  hook: {
    text: string | null;
    score: number | null;
    effectiveness: string | null;
    improvement: string | null;
    /** false : le hook est estimé depuis la description ou autre, pas depuis la parole. */
    spoken: boolean;
  } | null;
  speech: { wordCount: number | null; wordsPerMinute: number | null; startsImmediately: boolean | null } | null;
  script: { label: string; quote: string | null; analysis: string | null; rewrite: string | null }[];
  cta: { hasCta: boolean | null; verdict: string | null; improvement: string | null } | null;
  description: { analysis: string | null; suggestions: string[]; hashtagSuggestions: string[] } | null;
  thumbnail: { verdict: string | null; suggestions: string[] } | null;
  strengths: (VideoReportItem & { impact: string | null })[];
  improvements: (VideoReportItem & { action: string | null })[];
  recommendations: (VideoReportItem & { priority: string | null; metric: string | null })[];
  /** « Si tu devais refaire cette vidéo demain » : 5 actions au plus, tirées des blocs ci-dessus. */
  actionPlan: { title: string; detail: string | null }[];
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown, max = 1200): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strings = (v: unknown, max = 8): string[] =>
  list(v).map((x) => str(x, 300)).filter((x): x is string => !!x).slice(0, max);
const score = (v: unknown): number | null => {
  const n = num(v);
  return n == null ? null : Math.max(0, Math.min(100, Math.round(n)));
};

function items<T>(v: unknown, build: (o: Obj, title: string) => T, max = 6): T[] {
  const out: T[] = [];
  for (const raw of list(v)) {
    const o = obj(raw);
    const title = o && str(o.title, 200);
    if (o && title) out.push(build(o, title));
    if (out.length >= max) break;
  }
  return out;
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function normalizeVideoResult(result: unknown): VideoReport {
  const r = obj(result);
  if (!r) throw new Error("résultat absent ou illisible");

  const videoData = obj(r.videoData);
  const verdict = str(r.verdict, 2000);
  if (!verdict) throw new Error("verdict absent");
  if (!videoData) throw new Error("données vidéo absentes");

  const reliability = obj(r.scoreReliability) ?? {};
  const rawScores = obj(r.scores) ?? {};
  const reliable = (key: string) => reliability[key] !== false;

  const perMilleRaw = obj(r.perMille);
  const perMilleReliable = obj(perMilleRaw?.reliable) ?? {};
  const pm = (key: string) => (perMilleRaw && perMilleReliable[key] !== false ? num(perMilleRaw[key]) : null);

  const catalog = obj(r.catalog);
  const maturity = obj(r.maturity);
  const speechRaw = obj(r.speech);
  const hookAnalysis = obj(r.hookAnalysis);
  const hookScore = obj(r.hookScore);
  const sources = obj(r.scoreSources) ?? {};
  const ctaRaw = obj(r.ctaAnalysis);
  const seo = obj(r.descriptionSeo);
  const thumb = obj(r.thumbnailAnalysis);
  const speechHooks = obj(speechRaw?.hooks);

  const hookText = str(hookAnalysis?.text, 400) ?? str(hookScore?.hookText, 400) ?? str(speechHooks?.s3, 400);
  const hookValue = score(hookAnalysis?.score) ?? score(hookScore?.score) ?? score(rawScores.hook);
  const hook: VideoReport["hook"] = hookText || hookAnalysis
    ? {
      text: hookText,
      score: hookValue,
      effectiveness: str(hookAnalysis?.effectiveness),
      improvement: str(hookAnalysis?.improvement),
      spoken: (str(hookScore?.gradedOn) ?? str(sources.hook)) === "spoken",
    }
    : null;

  const script: VideoReport["script"] = [];
  for (const raw of list(obj(r.scriptBreakdown)?.segments)) {
    const o = obj(raw);
    const label = o && str(o.label, 80);
    if (!o || !label) continue;
    const segment = { label, quote: str(o.quote, 600), analysis: str(o.analysis), rewrite: str(o.rewrite, 600) };
    if (segment.quote || segment.analysis || segment.rewrite) script.push(segment);
    if (script.length >= 6) break;
  }

  const strengths = items(r.strengths, (o, title) => ({ title, description: str(o.description), impact: str(o.impact, 20) }));
  const improvements = items(r.improvements, (o, title) => ({ title, description: str(o.description), action: str(o.action) }));
  const recommendations = items(r.recommendations, (o, title) => ({
    title, description: str(o.description), priority: str(o.priority, 20), metric: str(o.metric, 200),
  })).sort((a, b) => (PRIORITY_ORDER[a.priority ?? ""] ?? 3) - (PRIORITY_ORDER[b.priority ?? ""] ?? 3));

  const cta: VideoReport["cta"] = ctaRaw
    ? { hasCta: bool(ctaRaw.hasCta), verdict: str(ctaRaw.verdict), improvement: str(ctaRaw.improvement) }
    : null;

  // Plan d'action : d'abord les corrections avec une action précise, puis l'accroche,
  // le CTA et les tests recommandés. Aucun conseil générique n'est ajouté.
  const actionPlan: VideoReport["actionPlan"] = [];
  const seen = new Set<string>();
  const push = (title: string | null, detail: string | null) => {
    if (!title || actionPlan.length >= 5) return;
    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    actionPlan.push({ title, detail });
  };
  for (const i of improvements) push(i.action ?? i.title, i.description);
  const hookRewrite = script.find((s) => /hook|accroche/i.test(s.label))?.rewrite ?? null;
  if (hook?.improvement) push(hook.improvement, hookRewrite ? `Exemple d'accroche : « ${hookRewrite} »` : null);
  if (cta?.improvement) push(cta.improvement, cta.verdict);
  for (const rec of recommendations) push(rec.title, rec.description);

  if (!actionPlan.length && !script.length && !hook && !strengths.length) {
    throw new Error("aucune analyse exploitable dans le résultat");
  }

  return {
    version: VIDEO_REPORT_VERSION,
    video: {
      author: str(videoData.author, 60)?.replace(/^@/, "") ?? null,
      description: str(videoData.description, 600),
      durationSeconds: num(videoData.duration),
      hashtags: strings(videoData.hashtags, 12),
    },
    summary: {
      verdict,
      overallScore: score(r.overallScore),
      niche: str(r.niche, 60),
      maturityNotice: str(maturity?.notice, 400),
      conclusionsReliable: maturity?.includeInStrongConclusions !== false,
    },
    metrics: {
      views: num(videoData.views),
      likes: num(videoData.likes),
      comments: num(videoData.comments),
      shares: num(videoData.shares),
      saves: num(videoData.saves),
      engagementRate: num(videoData.engagementRate),
      perMille: perMilleRaw
        ? { likes: pm("likes"), comments: pm("comments"), shares: pm("shares"), saves: pm("saves") }
        : null,
      account: catalog
        ? {
          medianViews: num(catalog.medianViews),
          rank: num(catalog.rank),
          rankTotal: num(catalog.rankTotal),
          topPercent: num(catalog.topPercent),
          accountEngagement: num(catalog.accountEngagement),
        }
        : null,
    },
    scores: {
      hook: hookValue,
      engagement: reliable("engagement") ? score(rawScores.engagement) : null,
      saves: reliable("saves") ? score(rawScores.saves) : null,
      share: reliable("share") ? score(rawScores.share) : null,
      viral: score(rawScores.viral),
    },
    hook,
    speech: speechRaw && speechRaw.hasSpeech !== false
      ? {
        wordCount: num(speechRaw.wordCount),
        wordsPerMinute: num(speechRaw.wordsPerMinute),
        startsImmediately: str(speechRaw.speechStartBand) ? str(speechRaw.speechStartBand) === "immediat" : null,
      }
      : null,
    script,
    cta,
    description: seo
      ? { analysis: str(seo.analysis), suggestions: strings(seo.suggestions, 5), hashtagSuggestions: strings(seo.hashtagSuggestions, 8) }
      : null,
    thumbnail: thumb ? { verdict: str(thumb.verdict), suggestions: strings(thumb.suggestions, 5) } : null,
    strengths,
    improvements,
    recommendations,
    actionPlan,
  };
}
