import { pdf } from "@react-pdf/renderer";

import { ExpressReportDocument } from "./document/ExpressReportDocument";
import { registerFonts } from "./document/fonts";
import type { ReportModel } from "./report-model";

/**
 * Ce module est le SEUL point d'entrée du chunk react-pdf : il n'est chargé que
 * par l'`import()` de `index.ts`, au clic sur « Télécharger ». L'importer
 * ailleurs de façon statique ramènerait le moteur dans le bundle initial.
 */

/**
 * Au-delà de ce délai, on rend la main plutôt que de laisser l'utilisateur
 * devant un bouton qui tourne indéfiniment. Ne protège que d'un blocage
 * asynchrone (police injoignable) : une boucle de calcul monopoliserait le
 * thread et empêcherait ce minuteur de se déclencher.
 */
const RENDER_TIMEOUT_MS = 30_000;

export async function renderExpressReportBlob(model: ReportModel): Promise<Blob> {
  registerFonts();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Génération du PDF interrompue : délai dépassé.")),
      RENDER_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([pdf(<ExpressReportDocument model={model} />).toBlob(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
