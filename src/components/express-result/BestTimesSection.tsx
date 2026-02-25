import { Clock } from "lucide-react";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface BestTimesSectionProps {
  bestTimes: Array<{ day: number; hour: number; avg_views: number; videos_count: number }>;
  recommendations?: string[];
  consistencyScore?: number;
  publicationFrequency?: { daily_avg?: number; weekly_pattern?: string };
}

export function BestTimesSection({ bestTimes, recommendations, consistencyScore, publicationFrequency }: BestTimesSectionProps) {
  const top5 = bestTimes?.slice(0, 5);
  if (!top5?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Meilleurs créneaux de publication
      </h3>

      {publicationFrequency?.weekly_pattern && (
        <p className="text-sm text-muted-foreground">
          Fréquence : <span className="font-medium text-foreground">{publicationFrequency.weekly_pattern}</span>
        </p>
      )}

      {consistencyScore != null && (
        <p className="text-sm text-muted-foreground">
          Score de régularité : <span className="font-medium text-foreground">{consistencyScore}/100</span>
        </p>
      )}

      <div className="grid gap-2">
        {top5.map((t, i) => (
          <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-lg">#{i + 1}</span>
              <div>
                <span className="font-medium">{DAYS[t.day]}</span>
                <span className="text-muted-foreground"> à {String(t.hour).padStart(2, "0")}h00</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-semibold">{formatNumber(t.avg_views)}</span>
              <span className="text-xs text-muted-foreground ml-1">vues moy.</span>
            </div>
          </div>
        ))}
      </div>

      {recommendations?.length > 0 && (
        <div className="pt-2 space-y-1">
          <h4 className="text-sm font-medium">Recommandations</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">→</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
