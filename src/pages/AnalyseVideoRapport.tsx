import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { VideoReportView } from "@/components/video-report/VideoReportView";
import type { VideoReport } from "../../supabase/functions/_shared/video-report";

type State =
  | { kind: "loading" }
  | { kind: "processing" }
  | { kind: "failed" }
  | { kind: "error"; message: string }
  | { kind: "ready"; report: VideoReport; tiktokUrl: string };

export default function AnalyseVideoRapport() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") || "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setState({ kind: "error", message: "Lien incomplet. Ouvre le bouton « Voir mon analyse » depuis ton e-mail." });
      return;
    }
    const { data, error } = await supabase.functions.invoke("video-analysis-report", { body: { token } });
    if (error || !data) {
      setState({ kind: "error", message: "Ce rapport est introuvable ou momentanément indisponible. Réessaie dans un instant." });
      return;
    }
    if (data.status === "ready") setState({ kind: "ready", report: data.report as VideoReport, tiktokUrl: data.tiktok_url });
    else if (data.status === "failed") setState({ kind: "failed" });
    else setState({ kind: "processing" });
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // Rapport encore en préparation : nouvelle lecture toutes les 15 s.
  useEffect(() => {
    if (state.kind !== "processing") return;
    const timer = setInterval(() => void load(), 15_000);
    return () => clearInterval(timer);
  }, [state.kind, load]);

  const handleDownload = async () => {
    if (state.kind !== "ready") return;
    setPdfLoading(true);
    try {
      // Le moteur PDF n'est téléchargé qu'au clic.
      const { downloadVideoReport } = await import("@/lib/pdf/video");
      await downloadVideoReport(state.report);
      void supabase.functions.invoke("video-analysis-report", { body: { token, action: "pdf" } });
      toast.success("Rapport PDF téléchargé !");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("La génération du PDF a échoué. Réessaie dans un instant.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead {...seoFor("/analyse-video/rapport")} />
      <Section className="pt-28 pb-20 md:pt-36">
        <div className="mx-auto max-w-3xl">
          {state.kind === "loading" && (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          )}

          {state.kind === "processing" && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-primary" />
              <h1 className="mb-3 font-display text-2xl font-semibold">Ton analyse est en préparation</h1>
              <p className="text-muted-foreground">Cette page se met à jour toute seule. Tu recevras aussi un e-mail dès qu'elle est prête.</p>
            </div>
          )}

          {(state.kind === "failed" || state.kind === "error") && (
            <div className="py-16 text-center">
              <AlertCircle className="mx-auto mb-6 h-10 w-10 text-destructive" />
              <h1 className="mb-3 font-display text-2xl font-semibold">
                {state.kind === "failed" ? "L'analyse n'a pas pu aboutir" : "Rapport indisponible"}
              </h1>
              <p className="text-muted-foreground">
                {state.kind === "failed"
                  ? "Fred est prévenu et revient vers toi sous deux jours ouvrés, sans nouveau paiement."
                  : state.message}
              </p>
            </div>
          )}

          {state.kind === "ready" && (
            <>
              <VideoReportView report={state.report} tiktokUrl={state.tiktokUrl} />
              <div className="sticky bottom-4 mt-10 flex justify-center">
                <Button variant="hero" size="lg" onClick={handleDownload} disabled={pdfLoading} className="w-full shadow-lg sm:w-auto">
                  {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Télécharger mon rapport PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
