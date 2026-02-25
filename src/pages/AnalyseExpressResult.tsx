import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, Loader2, AlertCircle, BarChart3, TrendingUp, Users, Heart, RefreshCw, Clock, Zap, Eye, Star, Shield, Target } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 600_000; // 10 minutes

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

      if (fnError || result?.error) {
        console.warn("Status check error:", result?.error || fnError?.message);
        return;
      }

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
      if (result.job_id) jobIdRef.current = result.job_id;

      startTimeRef.current = Date.now();
      pollingRef.current = setInterval(checkStatus, POLL_INTERVAL);
      setTimeout(checkStatus, 1500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [sessionId, checkStatus]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("express_session_id", sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!launchedRef.current) {
      launchAnalysis();
    }
    return () => stopPolling();
  }, [launchAnalysis, stopPolling]);

  const handleRetry = () => {
    launchedRef.current = false;
    launchAnalysis();
  };

  const handleDownloadPdf = async () => {
    if (!sessionId || !username) return;
    setPdfLoading(true);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("express-pdf", {
        body: { session_id: sessionId, username },
      });

      if (fnError || result?.error) {
        throw new Error(result?.error || fnError?.message || "Erreur lors de la génération du PDF");
      }

      const blob = new Blob([result.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analyse-tiktok-${username}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Rapport téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du téléchargement");
    } finally {
      setPdfLoading(false);
    }
  };

  const healthScore = data?.health_score?.total;
  const healthComponents = data?.health_score?.components;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };


  return (
    <Layout>
      <SEOHead
        title="Résultats Analyse Express TikTok | FredWav"
        description="Consultez les résultats de votre analyse TikTok et téléchargez votre rapport PDF."
        path="/analyse-express/result"
      />

      <Section className="pt-32 pb-20 md:pt-40">
        <div className="max-w-3xl mx-auto">
          {/* Loading state */}
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
                {currentStep && (
                  <p className="text-sm text-muted-foreground">
                    {currentStep}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
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
              <div className="text-center">
                <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
                  Analyse de <span className="text-primary">@{username}</span>
                </h1>
                <p className="text-muted-foreground">Voici les résultats de ton diagnostic TikTok</p>
              </div>

              {/* Health Score */}
              {healthScore !== undefined && (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Health Score</h2>
                  <div className={`text-6xl font-bold ${getScoreColor(healthScore)}`}>
                    {healthScore}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <Progress value={healthScore} className="mt-4 max-w-xs mx-auto" />
                </div>
              )}

              {/* Health Score Components */}
              {healthComponents && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Détail du score</h3>
                  <div className="space-y-3">
                    {healthComponents.engagement?.score !== undefined && (
                      <ScoreBar label="Engagement" score={healthComponents.engagement.score} icon={Heart} />
                    )}
                    {healthComponents.consistency?.score !== undefined && (
                      <ScoreBar label="Régularité" score={healthComponents.consistency.score} icon={RefreshCw} />
                    )}
                    {healthComponents.content_quality?.score !== undefined && (
                      <ScoreBar label="Qualité du contenu" score={healthComponents.content_quality.score} icon={Star} />
                    )}
                    {healthComponents.growth_potential?.score !== undefined && (
                      <ScoreBar label="Potentiel de croissance" score={healthComponents.growth_potential.score} icon={TrendingUp} />
                    )}
                    {healthComponents.technical_seo?.score !== undefined && (
                      <ScoreBar label="SEO technique" score={healthComponents.technical_seo.score} icon={Shield} />
                    )}
                  </div>
                </div>
              )}

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.account?.follower_count !== undefined && (
                  <MetricCard icon={Users} label="Abonnés" value={formatNumber(data.account.follower_count)} />
                )}
                {data.account?.following_count !== undefined && (
                  <MetricCard icon={Heart} label="Abonnements" value={formatNumber(data.account.following_count)} />
                )}
                {data.account?.like_count !== undefined && (
                  <MetricCard icon={Heart} label="Likes totaux" value={formatNumber(data.account.like_count)} />
                )}
                {data.account?.video_count !== undefined && (
                  <MetricCard icon={BarChart3} label="Vidéos" value={formatNumber(data.account.video_count)} />
                )}
                {data.account?.engagement_rate != null && (
                  <MetricCard icon={TrendingUp} label="Engagement" value={`${data.account.engagement_rate}%`} />
                )}
                {data.account?.avg_views != null && (
                  <MetricCard icon={Eye} label="Vues moy." value={formatNumber(data.account.avg_views)} />
                )}
              </div>

              {/* Analysis insights */}
              {data.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.analysis.viral_potential != null && (
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Potentiel viral</div>
                        <div className="font-semibold">{Math.round(data.analysis.viral_potential * 100)}%</div>
                      </div>
                    </div>
                  )}
                  {data.analysis.optimal_duration && (
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Durée optimale</div>
                        <div className="font-semibold">{data.analysis.optimal_duration}</div>
                      </div>
                    </div>
                  )}
                  {data.analysis.best_posting_times?.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 md:col-span-2">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Meilleurs horaires</div>
                        <div className="font-semibold">{data.analysis.best_posting_times.join(", ")}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Persona */}
              {data.persona && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Persona identifié
                  </h3>
                  {data.persona.niche_principale && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Niche :</span> {data.persona.niche_principale}
                    </p>
                  )}
                  {data.persona.forces?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Forces</span>
                      <ul className="mt-1 space-y-1">
                        {data.persona.forces.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2 text-muted-foreground text-sm">
                            <span className="text-green-500 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.persona.faiblesses?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Points d'amélioration</span>
                      <ul className="mt-1 space-y-1">
                        {data.persona.faiblesses.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2 text-muted-foreground text-sm">
                            <span className="text-yellow-500 font-bold">!</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {data.persona?.recommandations?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Recommandations</h3>
                  <ul className="space-y-2">
                    {data.persona.recommandations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2 text-muted-foreground">
                        <span className="text-primary font-bold">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Download PDF */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={handleDownloadPdf} variant="hero" size="lg" disabled={pdfLoading}>
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
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

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const getColor = (s: number) => {
    if (s >= 70) return "bg-green-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium w-10 text-right">{score}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
