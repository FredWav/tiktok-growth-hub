import { pdf } from "@react-pdf/renderer";

import { ExpressReportDocument } from "./document/ExpressReportDocument";
import { registerFonts } from "./document/fonts";
import { stripEmojis } from "./format";
import type { ReportModel } from "./report-model";

/**
 * Ce module est le SEUL point d'entrée du chunk react-pdf : il n'est chargé que
 * par l'`import()` de `index.ts`, au clic sur « Télécharger ». L'importer
 * ailleurs de façon statique ramènerait le moteur dans le bundle initial.
 */

/** Retire les emojis de tous les textes libres du modèle. */
function withoutEmojis(model: ReportModel): ReportModel {
  const clean = (v?: string) => (v ? stripEmojis(v) : v);
  return {
    ...model,
    meta: { ...model.meta, bio: clean(model.meta.bio) },
    shadowban: model.shadowban
      ? {
          ...model.shadowban,
          diagnosis: clean(model.shadowban.diagnosis),
          recommendations: model.shadowban.recommendations.map((r) => stripEmojis(r)),
        }
      : undefined,
    health: model.health
      ? { ...model.health, priorityActions: model.health.priorityActions.map((a) => stripEmojis(a)) }
      : undefined,
    topVideos: model.topVideos.map((v) => ({ ...v, description: stripEmojis(v.description) })),
    ai: model.ai
      ? {
          ...model.ai,
          summary: clean(model.ai.summary),
          strengths: model.ai.strengths.map((x) => ({
            title: stripEmojis(x.title),
            description: stripEmojis(x.description),
          })),
          improvements: model.ai.improvements.map((x) => ({
            title: stripEmojis(x.title),
            description: stripEmojis(x.description),
          })),
          actionPlan: model.ai.actionPlan.map((x) => ({ ...x, text: stripEmojis(x.text) })),
          strategy36: model.ai.strategy36.map((x) => ({ ...x, text: stripEmojis(x.text) })),
          bioOptimized: model.ai.bioOptimized.map((b) => stripEmojis(b)),
          profilePhoto: model.ai.profilePhoto
            ? { ...model.ai.profilePhoto, verdict: stripEmojis(model.ai.profilePhoto.verdict) }
            : undefined,
          gridVisual: model.ai.gridVisual
            ? { ...model.ai.gridVisual, verdict: stripEmojis(model.ai.gridVisual.verdict) }
            : undefined,
        }
      : undefined,
  };
}

export async function renderExpressReportBlob(model: ReportModel): Promise<Blob> {
  registerFonts();
  try {
    return await pdf(<ExpressReportDocument model={model} />).toBlob();
  } catch (error) {
    // Les emojis sont rendus depuis des PNG distants (Twemoji) : hors ligne ou
    // CDN indisponible, le rendu échoue. Mieux vaut un rapport sans emoji.
    console.warn("Rendu PDF en échec, seconde tentative sans emoji.", error);
    return await pdf(<ExpressReportDocument model={withoutEmojis(model)} />).toBlob();
  }
}
