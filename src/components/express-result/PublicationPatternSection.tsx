import { Clock, Calendar } from "lucide-react";

interface PublicationPattern {
  best_days?: string[];
  best_hours?: string[];
  frequency?: string | null;
  consistency_score?: number | null;
  max_gap_days?: number | null;
  days_since_last_post?: number | null;
}

export function PublicationPatternSection({ pp }: { pp: PublicationPattern }) {
  if (!pp) return null;
  const hasAny = pp.best_days?.length || pp.best_hours?.length || pp.frequency || pp.consistency_score != null;
  if (!hasAny) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Rythme de publication
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        {pp.best_days?.length ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Meilleurs jours</p>
            <p className="text-sm font-medium">{pp.best_days.join(" · ")}</p>
          </div>
        ) : null}
        {pp.best_hours?.length ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Meilleures tranches</p>
            <p className="text-sm font-medium">{pp.best_hours.join(" · ")}</p>
          </div>
        ) : null}
        {pp.frequency ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fréquence</p>
            <p className="text-sm font-medium">{pp.frequency}</p>
          </div>
        ) : null}
        {pp.consistency_score != null ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Régularité</p>
            <p className="text-sm font-medium">{pp.consistency_score}/100</p>
          </div>
        ) : null}
        {pp.max_gap_days != null ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Plus long écart</p>
            <p className="text-sm font-medium">{pp.max_gap_days} jours</p>
          </div>
        ) : null}
        {pp.days_since_last_post != null ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Dernière publication</p>
            <p className="text-sm font-medium">Il y a {pp.days_since_last_post} {pp.days_since_last_post > 1 ? "jours" : "jour"}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}