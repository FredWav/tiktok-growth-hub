import type { VideoReport } from "../../../../supabase/functions/_shared/video-report";
import { cleanText, fmtDateFr } from "../format";

/** Les textes viennent d'une IA : markdown et emojis sont retirés avant le PDF. */
function cleanDeep<T>(value: T): T {
  if (typeof value === "string") return cleanText(value) as T;
  if (Array.isArray(value)) return value.map(cleanDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanDeep(v)])) as T;
  }
  return value;
}

export function buildVideoReportFilename(report: VideoReport, date = new Date()): string {
  const author = (report.video.author || "video").toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `analyse-video-${author || "video"}-${date.toISOString().slice(0, 10)}.pdf`;
}

/** PDF du rapport vidéo, généré dans le navigateur au clic (moteur react-pdf de l'Express). */
export async function downloadVideoReport(report: VideoReport, completedAt?: string): Promise<void> {
  const { renderVideoReportBlob } = await import("./render");
  const blob = await renderVideoReportBlob(cleanDeep(report), fmtDateFr(completedAt));

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildVideoReportFilename(report);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Révocation différée : Safari annule le téléchargement si l'URL disparaît trop tôt.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
