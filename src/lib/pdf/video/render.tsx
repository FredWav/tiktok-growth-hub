import { pdf } from "@react-pdf/renderer";

import type { VideoReport } from "../../../../supabase/functions/_shared/video-report";
import { registerFonts } from "../document/fonts";
import { VideoReportDocument } from "./VideoReportDocument";

/** Seul point d'entrée react-pdf du rapport vidéo : chargé par l'`import()` de index.ts. */
const RENDER_TIMEOUT_MS = 30_000;

export async function renderVideoReportBlob(report: VideoReport, dateLabel: string): Promise<Blob> {
  registerFonts();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Génération du PDF interrompue : délai dépassé.")), RENDER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([pdf(<VideoReportDocument report={report} dateLabel={dateLabel} />).toBlob(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
