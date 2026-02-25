import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, Loader2, AlertCircle, BarChart3, TrendingUp, Users, Heart, RefreshCw } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AnalyseExpressResult() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Persist session_id
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("express_session_id", sessionId);
    }
  }, [sessionId]);

  const fetchAnalysis = async () => {
    if (!sessionId) {
      setError("Session de paiement introuvable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("express-analysis", {
        body: { session_id: sessionId },
      });

      if (fnError || result?.error) {
        throw new Error(result?.error || fnError?.message || "Erreur lors de l'analyse");
      }

      setData(result.data);
      setUsername(result.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [sessionId]);

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

      // Download HTML as file
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

  const healthScore = data?.health_score;
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
              <div className="max-w-xs mx-auto space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
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
                <Button onClick={fetchAnalysis} variant="outline">
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
              {/* Header */}
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

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.followers !== undefined && (
                  <MetricCard icon={Users} label="Abonnés" value={formatNumber(data.followers)} />
                )}
                {data.following !== undefined && (
                  <MetricCard icon={Heart} label="Abonnements" value={formatNumber(data.following)} />
                )}
                {data.total_likes !== undefined && (
                  <MetricCard icon={Heart} label="Likes totaux" value={formatNumber(data.total_likes)} />
                )}
                {data.total_videos !== undefined && (
                  <MetricCard icon={BarChart3} label="Vidéos" value={formatNumber(data.total_videos)} />
                )}
                {data.engagement_rate !== undefined && (
                  <MetricCard icon={TrendingUp} label="Engagement" value={`${data.engagement_rate}%`} />
                )}
                {data.avg_views !== undefined && (
                  <MetricCard icon={BarChart3} label="Vues moy." value={formatNumber(data.avg_views)} />
                )}
              </div>

              {/* Persona / Bio */}
              {data.persona && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Persona identifié</h3>
                  <p className="text-muted-foreground">{data.persona}</p>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Recommandations</h3>
                  <ul className="space-y-2">
                    {data.recommendations.map((rec: string, i: number) => (
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
