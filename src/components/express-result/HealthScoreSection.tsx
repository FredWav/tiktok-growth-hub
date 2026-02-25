import { Heart, RefreshCw, Star, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SCORE_ICONS: Record<string, any> = {
  engagement: Heart,
  consistency: RefreshCw,
  content_quality: Star,
  growth_potential: TrendingUp,
  technical_seo: Shield,
};

const SCORE_LABELS: Record<string, string> = {
  engagement: "Engagement",
  consistency: "Régularité",
  content_quality: "Qualité du contenu",
  growth_potential: "Potentiel de croissance",
  technical_seo: "SEO technique",
};

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function getBarColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getStatusColor(status: string) {
  if (status === "excellent") return "text-green-500";
  if (status === "good") return "text-yellow-500";
  return "text-red-500";
}

interface HealthScoreSectionProps {
  healthScore: any;
}

export function HealthScoreSection({ healthScore }: HealthScoreSectionProps) {
  const total = healthScore?.total;
  const components = healthScore?.components;
  const overallStatus = healthScore?.overall_status;
  const priorityActions = healthScore?.priority_actions;

  return (
    <div className="space-y-4">
      {/* Total score */}
      {total != null && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Health Score</h2>
          <div className={`text-6xl font-bold ${getScoreColor(total)}`}>
            {total}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <Progress value={total} className="mt-4 max-w-xs mx-auto" />
          {overallStatus && (
            <p className="mt-2 text-sm text-muted-foreground capitalize">Statut : <span className="font-medium text-foreground">{overallStatus}</span></p>
          )}
        </div>
      )}

      {/* Components */}
      {components && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Détail du score</h3>
          <div className="space-y-4">
            {Object.entries(components).map(([key, comp]: [string, any]) => {
              if (comp?.score == null) return null;
              const Icon = SCORE_ICONS[key] || Shield;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm w-44 shrink-0">{SCORE_LABELS[key] || key}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${getBarColor(comp.score)}`} style={{ width: `${comp.score}%` }} />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{comp.score}</span>
                  </div>
                  {comp.label && (
                    <p className={`text-xs ml-7 ${getStatusColor(comp.status)}`}>{comp.label}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority actions */}
      {priorityActions?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Actions prioritaires
          </h3>
          <ul className="space-y-2">
            {priorityActions.map((action: string, i: number) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="text-primary font-bold">→</span> {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
