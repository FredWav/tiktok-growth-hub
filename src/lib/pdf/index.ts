import { buildReportModel } from "./build-report-model";
import { cleanUsername } from "./format";
import { withEmbeddedImages } from "./images";

/**
 * API publique du rapport PDF. Ce module reste **léger** : le moteur react-pdf
 * vit derrière l'`import()` de `downloadExpressReport`, et n'est téléchargé
 * qu'au clic sur le bouton.
 */

export { buildReportModel } from "./build-report-model";
export type { ReportModel } from "./report-model";

export function buildExpressReportFilename(username: string, date = new Date()): string {
  const user = cleanUsername(username).toLowerCase() || "compte";
  return `analyse-${user}-${date.toISOString().slice(0, 10)}.pdf`;
}

export async function downloadExpressReport(resultData: unknown, username: string): Promise<void> {
  const model = await withEmbeddedImages(buildReportModel(resultData));
  const { renderExpressReportBlob } = await import("./render");
  const blob = await renderExpressReportBlob(model);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildExpressReportFilename(username);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Révocation différée : Safari annule le téléchargement si l'URL disparaît trop tôt.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
