import type { VideoReport } from "../../../../supabase/functions/_shared/video-report";
import { fmtCompact, fmtInt, fmtPercent as fmtPct } from "../format";

/**
 * Mise en forme partagée par la page rapport et le PDF vidéo : mêmes chiffres,
 * mêmes libellés. Une valeur absente n'est jamais affichée.
 */
export const fmtNumber = (value: number | null) => fmtInt(value) ?? "";
export const fmtPercent = (value: number | null) => fmtPct(value) ?? "";
export const fmtPerMille = (value: number | null) =>
  value == null ? "" : `${value.toFixed(1).replace(".", ",")} pour 1 000 vues`;

export function fmtDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const s = Math.round(seconds);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")}`;
}

export type StatTile = { label: string; value: string; hint?: string };

export function statTiles(report: VideoReport): StatTile[] {
  const m = report.metrics;
  const tiles: StatTile[] = [];
  const add = (label: string, value: string | null, hint?: string) => {
    if (value) tiles.push({ label, value, ...(hint ? { hint } : {}) });
  };
  add("Vues", fmtCompact(m.views));
  add("Likes", fmtCompact(m.likes), fmtPerMille(m.perMille?.likes ?? null) || undefined);
  add("Commentaires", fmtCompact(m.comments), fmtPerMille(m.perMille?.comments ?? null) || undefined);
  add("Partages", fmtCompact(m.shares), fmtPerMille(m.perMille?.shares ?? null) || undefined);
  add("Enregistrements", fmtCompact(m.saves), fmtPerMille(m.perMille?.saves ?? null) || undefined);
  add("Engagement", fmtPct(m.engagementRate));
  add("Durée", fmtDuration(report.video.durationSeconds));
  return tiles;
}

export function scoreRows(report: VideoReport): { label: string; value: number }[] {
  const s = report.scores;
  return ([
    ["Accroche", s.hook],
    ["Engagement", s.engagement],
    ["Enregistrements", s.saves],
    ["Partages", s.share],
    ["Potentiel de diffusion", s.viral],
  ] as const).flatMap(([label, value]) => (value == null ? [] : [{ label, value }]));
}

/** Phrases de comparaison avec l'historique du même compte, quand il existe. */
export function accountComparison(report: VideoReport): string[] {
  const a = report.metrics.account;
  if (!a) return [];
  const lines: string[] = [];
  const views = report.metrics.views;
  if (a.medianViews && views != null) {
    const ratio = views / a.medianViews;
    const times = ratio.toFixed(1).replace(".", ",");
    lines.push(`${fmtCompact(views)} vues, soit ${times} fois la médiane du compte (${fmtCompact(a.medianViews)}).`);
  }
  if (a.rank != null && a.rankTotal != null) {
    lines.push(`Classée ${a.rank}e sur ${a.rankTotal} vidéos comparées${a.topPercent != null ? ` (top ${a.topPercent} %)` : ""}.`);
  }
  if (a.accountEngagement != null && report.metrics.engagementRate != null) {
    lines.push(`Engagement de ${fmtPct(report.metrics.engagementRate)}, contre ${fmtPct(a.accountEngagement)} en moyenne sur le compte.`);
  }
  return lines;
}
