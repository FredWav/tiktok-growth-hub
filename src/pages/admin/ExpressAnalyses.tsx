import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useExpressAnalyses } from "@/hooks/useExpressAnalyses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Loader2, RefreshCw, Search, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { mapAccountDataForPDF } from "@/lib/pdf-data-mapper";
import { generateCompletePDFHTML } from "@/lib/pdf-html-generator";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "outline" },
  processing: { label: "En cours", variant: "secondary" },
  complete: { label: "Terminée", variant: "default" },
  failed: { label: "Échouée", variant: "destructive" },
};

async function downloadPDF(analysis: any) {
  try {
    const result = analysis.result_data;
    const account = result?.account || result;
    const persona = result?.persona;
    const pubPattern = persona?.style_contenu?.publication_pattern;

    const pdfData = mapAccountDataForPDF(account, persona, pubPattern);
    const htmlContent = generateCompletePDFHTML(pdfData, account.ai_insights || '', account.recent_videos || []);

    const element = document.createElement("div");
    element.innerHTML = htmlContent;

    const html2pdf = (await import('html2pdf.js')).default;
    await (html2pdf().set as any)({
      margin: [10, 0, 10, 0],
      filename: `analyse-express-${analysis.tiktok_username}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        avoid: [".video-item", ".stat-card", ".stats-grid", ".stats-section",
                ".bio-section", ".hashtags-section", ".header", ".hashtags-grid"],
      },
    }).from(element).save();

    toast.success("PDF téléchargé !");
  } catch (err) {
    console.error("PDF generation error:", err);
    toast.error("Erreur lors de la génération du PDF");
  }
}

function canRetry(analysis: any): boolean {
  if (analysis.status === "failed") return true;
  if (analysis.status === "complete" && analysis.result_data) {
    const account = analysis.result_data?.account || analysis.result_data;
    const ai = account?.ai_insights;
    if (!ai || (typeof ai === "string" && ai.trim() === "")) return true;
  }
  return false;
}

const ExpressAnalyses = () => {
  const { data: analyses, isLoading } = useExpressAnalyses();
  const queryClient = useQueryClient();
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [manualUsername, setManualUsername] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success("Email copié");
      setTimeout(() => setCopiedEmail(null), 1500);
    } catch {
      toast.error("Impossible de copier l'email");
    }
  };

  const stopPolling = useCallback((analysisId: string) => {
    if (pollingRefs.current[analysisId]) {
      clearInterval(pollingRefs.current[analysisId]);
      delete pollingRefs.current[analysisId];
    }
    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.delete(analysisId);
      return next;
    });
  }, []);

  const startPolling = useCallback((analysisId: string, jobId: string) => {
    const poll = setInterval(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-express-job`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ job_id: jobId, analysis_id: analysisId }),
          }
        );

        const result = await res.json();

        if (result.status === "complete" || result.status === "failed") {
          stopPolling(analysisId);
          queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
          if (result.status === "complete") {
            toast.success("Analyse relancée avec succès !");
          } else {
            toast.error("L'analyse a échoué après relance");
          }
        }
      } catch {
        // continue polling
      }
    }, 5000);

    pollingRefs.current[analysisId] = poll;
  }, [stopPolling, queryClient]);

  const handleRetry = async (analysis: any) => {
    try {
      setRetryingIds((prev) => new Set(prev).add(analysis.id));

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retry-express-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            tiktok_username: analysis.tiktok_username,
            analysis_id: analysis.id,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");

      toast.info("Analyse relancée, polling en cours...");
      queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      startPolling(analysis.id, result.job_id);
    } catch (err: any) {
      console.error("Retry error:", err);
      toast.error(err.message || "Erreur lors de la relance");
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(analysis.id);
        return next;
      });
    }
  };

  const handleManualLaunch = async () => {
    const username = manualUsername.replace(/^@/, "").trim();
    if (!username) {
      toast.error("Entre un nom d'utilisateur TikTok");
      return;
    }
    try {
      setIsLaunching(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-express-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ tiktok_username: username }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");

      toast.info(`Analyse lancée pour @${username}`);
      setManualUsername("");
      queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      startPolling(result.analysis_id, result.job_id);
    } catch (err: any) {
      console.error("Manual launch error:", err);
      toast.error(err.message || "Erreur lors du lancement");
    } finally {
      setIsLaunching(false);
    }
  };

  const stats = analyses
    ? {
        total: analyses.length,
        complete: analyses.filter((a) => a.status === "complete").length,
        failed: analyses.filter((a) => a.status === "failed").length,
        processing: analyses.filter((a) => a.status === "processing" || a.status === "pending").length,
      }
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-primary">Analyses Express</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="@username"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualLaunch()}
              className="w-48 bg-noir-light border-primary/30 text-cream"
            />
            <Button
              onClick={handleManualLaunch}
              disabled={isLaunching || !manualUsername.trim()}
              size="sm"
            >
              {isLaunching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              Lancer
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{stats.total}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Réussies</p>
              <p className="text-2xl font-bold text-green-400">{stats.complete}</p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">En cours</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.processing}</p>
            </div>
            <div className="bg-noir-light border border-red-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Échouées</p>
              <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !analyses?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune analyse express pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Username</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">Newsletter</TableHead>
                  <TableHead className="text-cream/70">Statut</TableHead>
                  <TableHead className="text-cream/70">Health Score</TableHead>
                  <TableHead className="text-cream/70">Erreur</TableHead>
                  <TableHead className="text-cream/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => {
                  const config = statusConfig[analysis.status] || statusConfig.pending;
                  const canDownload = analysis.status === "complete" && analysis.result_data;
                  const isRetrying = retryingIds.has(analysis.id);
                  const showRetry = canRetry(analysis) && !isRetrying;
                  const isProcessing = analysis.status === "processing" || analysis.status === "pending" || isRetrying;

                  return (
                    <TableRow key={analysis.id} className="border-primary/10">
                      <TableCell className="text-cream/80">
                        {format(new Date(analysis.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-cream font-medium">
                        @{analysis.tiktok_username}
                      </TableCell>
                      <TableCell className="text-cream/80 max-w-[220px]">
                        {analysis.email ? (
                          <div className="flex items-center gap-1.5 group">
                            <a
                              href={`mailto:${analysis.email}`}
                              className="text-cream/80 hover:text-primary truncate"
                              title={analysis.email}
                            >
                              {analysis.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(analysis.email!)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-cream/40 hover:text-primary"
                              title="Copier l'email"
                            >
                              {copiedEmail === analysis.email ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-cream/30">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {analysis.newsletter_requested ? (
                          analysis.newsletter_subscribed ? (
                            <Badge variant="default" className="gap-1">
                              <Mail className="h-3 w-3" />
                              Inscrit
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-yellow-400 border-yellow-500/40">
                              <Mail className="h-3 w-3" />
                              En attente
                            </Badge>
                          )
                        ) : (
                          <span className="text-cream/30 text-xs">Non demandé</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isRetrying ? (
                          <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Relance...
                          </Badge>
                        ) : (
                          <Badge variant={config.variant}>{config.label}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-cream/80">
                        {analysis.health_score != null ? `${analysis.health_score}/100` : "-"}
                      </TableCell>
                      <TableCell className="text-red-400 text-sm max-w-[200px] truncate">
                        {analysis.error_message || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canDownload && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPDF(analysis)}
                              title="Télécharger le PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {showRetry && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(analysis)}
                              title="Relancer l'analyse"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          {isProcessing && !isRetrying && (
                            <Loader2 className="h-4 w-4 animate-spin text-cream/40" />
                          )}
                          {!canDownload && !showRetry && !isProcessing && !isRetrying && (
                            <span className="text-cream/30">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExpressAnalyses;
