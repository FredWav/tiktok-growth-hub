import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, Loader2, AlertCircle, RefreshCw, ChevronDown, Target } from "lucide-react";
// @ts-ignore - html2pdf.js doesn't have proper types
import html2pdf from "html2pdf.js";
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { ProfileHeader } from "@/components/express-result/ProfileHeader";
import { MetricsGrids } from "@/components/express-result/MetricsGrids";
import { HealthScoreSection } from "@/components/express-result/HealthScoreSection";
import { HashtagsSection } from "@/components/express-result/HashtagsSection";
import { BestTimesSection } from "@/components/express-result/BestTimesSection";
import { RegularityBreakdown } from "@/components/express-result/RegularityBreakdown";
import { MarkdownRenderer } from "@/components/express-result/MarkdownRenderer";
import { mapAccountDataForPDF } from "@/lib/pdf-data-mapper";
import { generateCompletePDFHTML } from "@/lib/pdf-html-generator";

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 600_000;

export default function AnalyseExpressResult() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const launchedRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!sessionId || !jobIdRef.current) return;
    if (Date.now() - startTimeRef.current > MAX_POLL_DURATION) {
      stopPolling();
      setError("L'analyse prend plus de temps que prévu. Réessayez dans quelques instants.");
      setLoading(false);
      return;
    }
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("express-analysis-status", {
        body: { session_id: sessionId, job_id: jobIdRef.current },
      });
      if (fnError || result?.error) return;
      if (result.username) setUsername(result.username);
      if (result.progress !== undefined) setProgress(result.progress);
      if (result.current_step) setCurrentStep(result.current_step);
      if (result.status === "complete" && result.data) {
        stopPolling();
        setData(result.data);
        setLoading(false);
      } else if (result.status === "failed") {
        stopPolling();
        setError(result.error || "L'analyse a échoué. Réessayez.");
        setLoading(false);
      }
    } catch (err) {
      console.warn("Status check exception:", err);
    }
  }, [sessionId, stopPolling]);

  const launchAnalysis = useCallback(async () => {
    if (!sessionId) {
      setError("Session de paiement introuvable");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep(null);
    launchedRef.current = true;
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("express-analysis", {
        body: { session_id: sessionId },
      });
      if (fnError || result?.error) {
        throw new Error(result?.error || fnError?.message || "Erreur lors du lancement de l'analyse");
      }
      if (result.username) setUsername(result.username);
      if (result.job_id) {
        jobIdRef.current = result.job_id;
        // Cache job_id in localStorage for refresh deduplication
        localStorage.setItem(`express_job_${sessionId}`, result.job_id);
      }
      startTimeRef.current = Date.now();
      pollingRef.current = setInterval(checkStatus, POLL_INTERVAL);
      setTimeout(checkStatus, 1500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [sessionId, checkStatus]);

  useEffect(() => {
    if (sessionId) localStorage.setItem("express_session_id", sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    // Check localStorage for cached job_id (refresh deduplication)
    const cachedJobId = sessionId ? localStorage.getItem(`express_job_${sessionId}`) : null;
    if (cachedJobId && sessionId) {
      jobIdRef.current = cachedJobId;
      setLoading(true);
      startTimeRef.current = Date.now();
      pollingRef.current = setInterval(checkStatus, POLL_INTERVAL);
      setTimeout(checkStatus, 500);
    } else {
      launchAnalysis();
    }

    return () => stopPolling();
  }, [sessionId, launchAnalysis, checkStatus, stopPolling]);

  const handleRetry = () => {
    launchedRef.current = false;
    launchAnalysis();
  };

  const handleDownloadPdf = async () => {
    if (!username || !data?.account) return;
    setPdfLoading(true);
    try {
      const pdfData = mapAccountDataForPDF(data.account, persona, pubPattern);
      const htmlContent = generateCompletePDFHTML(
        pdfData,
        data.account.ai_insights || "",
        data.account.recent_videos || []
      );

      // Élément détaché — pas dans le DOM visible
      const element = document.createElement("div");
      element.innerHTML = htmlContent;

      await (html2pdf() as any).set({
        margin: [10, 0, 10, 0],
        filename: `analyse-tiktok-${username}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          avoid: [".video-item", ".stat-card", ".stats-grid", ".stats-section",
                  ".bio-section", ".hashtags-section", ".header", ".hashtags-grid"],
        },
      }).from(element).save();

      toast.success("Rapport PDF téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du téléchargement");
    } finally {
      setPdfLoading(false);
    }
  };

  const account = data?.account;
  const persona = data?.persona;
  const pubPattern = persona?.style_contenu?.publication_pattern;
  const healthScore = data?.health_score || account?.health_score;

  return (
    <Layout>
      <SEOHead
        title="Résultats Analyse Express TikTok | FredWav"
        description="Consultez les résultats de votre analyse TikTok et téléchargez votre rapport PDF."
        path="/analyse-express/result"
      />

      <Section className="pt-32 pb-20 md:pt-40">
        <div className="max-w-3xl mx-auto">
          {/* Loading */}
          {loading && (
            <div className="text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="font-display text-2xl font-semibold">Analyse en cours...</h2>
              <p className="text-muted-foreground">
                Nous analysons le compte @{username || "..."} – cela peut prendre jusqu'à 2 minutes.
              </p>
              <div className="max-w-xs mx-auto space-y-3">
                <Progress value={progress} className="h-3" />
                <p className="text-sm font-medium text-primary">{progress}%</p>
                {currentStep && <p className="text-sm text-muted-foreground">{currentStep}</p>}
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center space-y-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="font-display text-2xl font-semibold">Oups, une erreur est survenue</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button asChild>
                  <Link to="/analyse-express">Nouvelle analyse</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && !error && data && (
            <div className="space-y-8">
              {/* Profile header */}
              <ProfileHeader
                avatar_url={account?.avatar_url}
                display_name={account?.display_name}
                username={username}
                bio={account?.bio}
                detected_niche={account?.detected_niche}
                verified={account?.verified}
              />

              {/* Health Score */}
              {healthScore && <HealthScoreSection healthScore={healthScore} />}

              {/* Metrics */}
              {account && <MetricsGrids account={account} />}

              {/* Hashtags */}
              <HashtagsSection hashtags={account?.top_hashtags} />

              {/* Best posting times */}
              {pubPattern?.best_times?.length > 0 && (
                <BestTimesSection
                  bestTimes={pubPattern.best_times}
                  recommendations={pubPattern.recommendations}
                  consistencyScore={pubPattern.consistency_score}
                  publicationFrequency={pubPattern.publication_frequency}
                />
              )}

              {/* Regularity breakdown */}
              {pubPattern?.regularity_details?.tiktok_breakdown && (
                <RegularityBreakdown breakdown={pubPattern.regularity_details.tiktok_breakdown} />
              )}

              {/* Persona */}
              {persona && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Persona identifié
                  </h3>
                  {persona.niche_principale && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Niche :</span> {persona.niche_principale}
                    </p>
                  )}
                  {persona.forces?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Forces</span>
                      <ul className="mt-1 space-y-1">
                        {persona.forces.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2 text-muted-foreground text-sm">
                            <span className="text-green-500 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {persona.faiblesses?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Points d'amélioration</span>
                      <ul className="mt-1 space-y-1">
                        {persona.faiblesses.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2 text-muted-foreground text-sm">
                            <span className="text-yellow-500 font-bold">!</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* AI Insights — collapsible markdown */}
              {account?.ai_insights && (
                <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors">
                      <h3 className="font-semibold text-left">📊 Analyse détaillée (IA)</h3>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${insightsOpen ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-6 border-t border-border pt-4">
                        <MarkdownRenderer content={account.ai_insights} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Download */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={handleDownloadPdf} variant="hero" size="lg" disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Télécharger le rapport PDF
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/analyse-express">Nouvelle analyse</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </Layout>
  );
}
