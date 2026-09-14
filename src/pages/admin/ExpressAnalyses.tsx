import { useState, useRef, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  fetchAnalysisResultData,
  useExpressAnalyses,
  type ExpressAnalysis,
} from "@/hooks/useExpressAnalyses";
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
import { downloadExpressReport } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { normalizeTikTokUsername } from "@/lib/tiktok-username";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { canRetryExpress, isExpressActive, isExpressComplete } from "../../../supabase/functions/_shared/express-state";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente de lancement", variant: "outline" },
  awaiting_payment: { label: "Paiement attendu", variant: "outline" },
  starting: { label: "Démarrage", variant: "secondary" },
  refunded: { label: "Remboursée", variant: "outline" },
  completed: { label: "Terminée", variant: "default" },
  processing: { label: "En cours", variant: "secondary" },
  complete: { label: "Terminée", variant: "default" },
  failed: { label: "Échouée", variant: "destructive" },
};

async function downloadPDF(analysis: ExpressAnalysis) {
  try {
    // `result_data` ne fait pas partie de la liste (trop lourd) : on le charge
    // pour cette seule ligne, au moment du clic.
    const resultData = await fetchAnalysisResultData(analysis.id);
    if (!resultData) {
      toast.error("Cette analyse n'a pas de données à exporter");
      return;
    }
    // buildReportModel tolère les lignes anciennes où result_data EST le compte.
    await downloadExpressReport(resultData, analysis.tiktok_username);
    toast.success("PDF téléchargé !");
  } catch (err) {
    console.error("PDF generation error:", err);
    toast.error("Erreur lors de la génération du PDF");
  }
}

async function checkAnalysisStatus(analysisId: string, signal: AbortSignal) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Session expirée : reconnecte-toi pour suivre les analyses.");
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-express-job`, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ analysis_id: analysisId }),
    });
  const result = await res.json();
  if (!res.ok || result.error) throw new Error(result.error || "Consultation du traitement indisponible");
}

const ExpressAnalyses = () => {
  const { data: analyses, isLoading, error: listError } = useExpressAnalyses();
  const queryClient = useQueryClient();
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const analysesRef = useRef(analyses);
  const pollingAttempts = useRef(new Map<string, { job: string | null; started: number; checked: number }>());
  const [pollingError, setPollingError] = useState<string | null>(null);
  const launchInFlight = useRef(false);
  const retryInFlight = useRef(new Set<string>());
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

  useEffect(() => { analysesRef.current = analyses; }, [analyses]);

  // Resume existing jobs on arrival, serialize rounds, and stop requests on unmount.
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const tick = async () => {
      if (document.hidden) { timer = setTimeout(tick, 5_000); return; }
      const now = Date.now();
      let roundError: string | null = null;
      const active = (analysesRef.current || []).filter(isExpressActive).filter((row) => {
        let attempt = pollingAttempts.current.get(row.id);
        if (!attempt || attempt.job !== row.job_id) {
          attempt = { job: row.job_id, started: now, checked: 0 };
          pollingAttempts.current.set(row.id, attempt);
        }
        if (now - attempt.started > 10 * 60_000) {
          roundError = "Suivi automatique limité à dix minutes. Utilise Vérifier pour consulter à nouveau le traitement ; le suivi serveur continue.";
          return false;
        }
        return true;
      }).sort((a, b) => pollingAttempts.current.get(a.id)!.checked - pollingAttempts.current.get(b.id)!.checked).slice(0, 3);
      await Promise.all(active.map(async (row) => {
        pollingAttempts.current.get(row.id)!.checked = now;
        try {
          await checkAnalysisStatus(row.id, AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]));
        } catch (error) {
          roundError = error instanceof Error ? error.message : "Suivi temporairement indisponible";
        }
      }));
      if (disposed) return;
      setPollingError(roundError);
      if (active.length) void queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      timer = setTimeout(tick, 5_000);
    };
    void tick();
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, [queryClient]);

  const handleCheck = async (analysisId: string) => {
    try {
      await checkAnalysisStatus(analysisId, AbortSignal.timeout(20_000));
      pollingAttempts.current.delete(analysisId);
      setPollingError(null);
      await queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Consultation impossible");
    }
  };

  const handleRetry = async (analysis: ExpressAnalysis) => {
    if (retryInFlight.current.has(analysis.id)) return;
    retryInFlight.current.add(analysis.id);
    try {
      setRetryingIds((prev) => new Set(prev).add(analysis.id));

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retry-express-analysis`,
        {
          method: "POST",
          signal: AbortSignal.timeout(45_000),
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

      toast.info("Analyse relancée, suivi en cours…");
      queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      pollingAttempts.current.delete(analysis.id);
    } catch (err: unknown) {
      console.error("Retry error:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la relance");
    } finally {
      retryInFlight.current.delete(analysis.id);
      void queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(analysis.id);
        return next;
      });
    }
  };

  const handleManualLaunch = async () => {
    if (launchInFlight.current) return;
    // Même forme canonique que côté fonction : le toast doit annoncer le pseudo
    // réellement envoyé à WavStats.
    const username = normalizeTikTokUsername(manualUsername);
    if (!username) {
      toast.error("Entre un nom d'utilisateur TikTok");
      return;
    }
    launchInFlight.current = true;
    try {
      setIsLaunching(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-express-analysis`,
        {
          method: "POST",
          signal: AbortSignal.timeout(45_000),
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
      pollingAttempts.current.delete(result.analysis_id);
    } catch (err: unknown) {
      console.error("Manual launch error:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du lancement");
    } finally {
      launchInFlight.current = false;
      void queryClient.invalidateQueries({ queryKey: ["express-analyses"] });
      setIsLaunching(false);
    }
  };

  // Mémoïsé : sans ça, ces quatre parcours du tableau étaient refaits à chaque
  // frappe dans le champ « @username » du lancement manuel.
  const stats = useMemo(() => {
    if (!analyses) return null;
    return {
      total: analyses.length,
      complete: analyses.filter(isExpressComplete).length,
      failed: analyses.filter((a) => a.status === "failed").length,
      processing: analyses.filter(isExpressActive).length,
    };
  }, [analyses]);

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

        {(listError || pollingError) && (
          <p role="alert" className="text-amber-300 text-sm">{listError ? "Impossible de charger les analyses. Actualise la page ou reconnecte-toi." : pollingError}</p>
        )}

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
                  const config = statusConfig[analysis.status] || { label: "Statut inconnu", variant: "outline" as const };
                  // `result_data` n'est plus dans la liste : le statut suffit à
                  // savoir s'il y a quelque chose à exporter, et le clic vérifie.
                  const canDownload = isExpressComplete(analysis);
                  const isRetrying = retryingIds.has(analysis.id);
                  const showRetry = canRetryExpress(analysis) && !isRetrying;
                  const isProcessing = isExpressActive(analysis) || isRetrying;

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
                      <TableCell className="text-red-400 text-sm max-w-[320px] whitespace-normal break-words">
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
                            <Button variant="ghost" size="sm" onClick={() => handleCheck(analysis.id)} title="Vérifier le traitement existant">
                              <RefreshCw className="h-4 w-4 mr-1" /> Vérifier
                            </Button>
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
