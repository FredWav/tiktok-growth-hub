import type { VideoReport } from "../../../../supabase/functions/_shared/video-report";

/** PDF du rapport vidéo, généré dans le navigateur au clic (moteur react-pdf de l'Express). */
export async function downloadVideoReport(_report: VideoReport): Promise<void> {
  throw new Error("Document PDF vidéo en attente du payload WavStats réel");
}
