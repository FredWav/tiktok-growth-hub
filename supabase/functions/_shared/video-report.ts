/**
 * Résultat WavStats `video_analysis` -> données du rapport client.
 *
 * Le format de `result` n'est pas documenté : ce normaliseur est écrit à partir
 * d'un vrai JSON récupéré par scripts/wavstats-video-probe.mjs. Tant qu'il n'est
 * pas finalisé, il refuse tout résultat : une commande ne peut donc jamais
 * recevoir un rapport vide (elle passe en échec, résultat brut conservé).
 */

export const VIDEO_REPORT_VERSION = "video-v1";

export type VideoReport = {
  version: typeof VIDEO_REPORT_VERSION;
};

export function normalizeVideoResult(_result: unknown): VideoReport {
  throw new Error("normaliseur vidéo non finalisé (en attente du payload réel)");
}
