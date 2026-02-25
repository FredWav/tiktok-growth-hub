import { Activity } from "lucide-react";

interface TiktokBreakdownItem {
  score: number;
  details: string;
}

interface RegularityBreakdownProps {
  breakdown: Record<string, TiktokBreakdownItem>;
}

const LABELS: Record<string, string> = {
  no_gaps_72h: "Pas de pause > 72h",
  weekly_volume: "Volume hebdo",
  day_consistency: "Régularité des jours",
  hour_consistency: "Régularité horaire",
  uniform_distribution: "Distribution uniforme",
};

function getBarColor(score: number) {
  if (score >= 25) return "bg-green-500";
  if (score >= 10) return "bg-yellow-500";
  return "bg-red-500";
}

export function RegularityBreakdown({ breakdown }: RegularityBreakdownProps) {
  if (!breakdown) return null;

  const total = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        Régularité détaillée
        <span className="text-sm font-normal text-muted-foreground">({total}/100)</span>
      </h3>
      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, item]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">{LABELS[key] || key}</span>
              <span className="text-sm font-medium">{item.score}/30</span>
            </div>
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full ${getBarColor(item.score)}`} style={{ width: `${(item.score / 30) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{item.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
