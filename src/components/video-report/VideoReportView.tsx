import type { VideoReport } from "../../../supabase/functions/_shared/video-report";

/**
 * Affichage web du rapport vidéo. Les sections sont construites à partir du
 * payload WavStats réel (voir supabase/functions/_shared/video-report.ts).
 */
export function VideoReportView({ tiktokUrl }: { report: VideoReport; tiktokUrl: string }) {
  return (
    <header className="mb-8 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">Analyse Vidéo TikTok</p>
      <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-muted-foreground underline underline-offset-2">
        {tiktokUrl}
      </a>
    </header>
  );
}
