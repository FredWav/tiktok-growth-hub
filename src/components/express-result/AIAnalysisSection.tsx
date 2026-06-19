import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Target, Calendar, Hash, User, Sparkles } from "lucide-react";

interface AIItem {
  title: string;
  description: string;
}

interface ActionItem {
  text: string;
  metric?: string;
  impact?: string;
  effort?: string;
  timeline?: string;
  tags?: string[];
}

interface HashtagStrategy {
  current?: string[];
  suggested?: string[];
  strategy?: string;
}

interface AIAnalysis {
  summary?: string;
  profilePhoto?: { score?: number; verdict?: string };
  bioOptimized?: string[];
  strengths?: AIItem[];
  improvements?: AIItem[];
  actionPlan?: ActionItem[];
  strategy3_6?: ActionItem[];
  hashtagStrategy?: HashtagStrategy;
  gridVisual?: { score?: number; verdict?: string };
}

function ImpactBadge({ value }: { value?: string }) {
  if (!value) return null;
  const color =
    value === "haut" ? "bg-green-500/15 text-green-600 border-green-500/30" :
    value === "moyen" ? "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" :
    "bg-muted text-muted-foreground border-border";
  return <Badge variant="outline" className={`text-xs ${color}`}>Impact {value}</Badge>;
}

function EffortBadge({ value }: { value?: string }) {
  if (!value) return null;
  return <Badge variant="outline" className="text-xs">Effort {value}</Badge>;
}

function cleanTag(t: string) {
  return t.startsWith("#") ? t : `#${t}`;
}

export function AIAnalysisSection({ ai }: { ai: AIAnalysis }) {
  if (!ai) return null;

  return (
    <div className="space-y-6">
      {ai.summary && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            Synthèse
          </h3>
          <p className="text-muted-foreground leading-relaxed">{ai.summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {ai.strengths?.length ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Forces
            </h3>
            <ul className="space-y-3">
              {ai.strengths.map((s, i) => (
                <li key={i}>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {ai.improvements?.length ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Axes d'amélioration
            </h3>
            <ul className="space-y-3">
              {ai.improvements.map((s, i) => (
                <li key={i}>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {ai.actionPlan?.length ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            Plan d'action 30 jours
          </h3>
          <ul className="space-y-3">
            {ai.actionPlan.map((a, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm">{a.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {a.metric && <Badge variant="secondary" className="text-xs">{a.metric}</Badge>}
                  <ImpactBadge value={a.impact} />
                  <EffortBadge value={a.effort} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ai.strategy3_6?.length ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            Stratégie 3-6 mois
          </h3>
          <ul className="space-y-3">
            {ai.strategy3_6.map((a, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm">{a.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {a.metric && <Badge variant="secondary" className="text-xs">{a.metric}</Badge>}
                  {a.timeline && <Badge variant="outline" className="text-xs">{a.timeline}</Badge>}
                  <ImpactBadge value={a.impact} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        {ai.bioOptimized?.length ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-primary" />
              Bio optimisée
            </h3>
            <ul className="space-y-2">
              {ai.bioOptimized.map((b, i) => (
                <li key={i} className="bg-muted/50 rounded-lg px-3 py-2 text-sm">{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {ai.hashtagStrategy ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Hash className="h-5 w-5 text-primary" />
              Stratégie hashtags
            </h3>
            {ai.hashtagStrategy.strategy && (
              <p className="text-sm text-muted-foreground mb-3">{ai.hashtagStrategy.strategy}</p>
            )}
            {ai.hashtagStrategy.suggested?.length ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Suggérés</p>
                <div className="flex flex-wrap gap-2">
                  {ai.hashtagStrategy.suggested.map((t, i) => (
                    <Badge key={i} className="text-sm">{cleanTag(t)}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {ai.hashtagStrategy.current?.length ? (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Actuels</p>
                <div className="flex flex-wrap gap-2">
                  {ai.hashtagStrategy.current.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-sm">{cleanTag(t)}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {(ai.profilePhoto?.verdict || ai.gridVisual?.verdict) && (
        <div className="grid md:grid-cols-2 gap-4">
          {ai.profilePhoto?.verdict && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Photo de profil {ai.profilePhoto.score != null && <span className="text-sm text-muted-foreground">({ai.profilePhoto.score}/10)</span>}</h3>
              <p className="text-sm text-muted-foreground">{ai.profilePhoto.verdict}</p>
            </div>
          )}
          {ai.gridVisual?.verdict && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Visuel de grille {ai.gridVisual.score != null && <span className="text-sm text-muted-foreground">({ai.gridVisual.score}/10)</span>}</h3>
              <p className="text-sm text-muted-foreground">{ai.gridVisual.verdict}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}