import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Shadowban {
  risk_level?: string;
  is_confirmed?: boolean;
  shadowban_videos?: number;
  total_videos?: number;
  percentage?: number;
  diagnosis?: string;
  recommendations?: string[];
}

const RISK_LABEL: Record<string, string> = {
  none: "Aucun risque",
  low: "Risque faible",
  medium: "Risque modéré",
  high: "Risque élevé",
  confirmed: "Shadowban confirmé",
};

export function ShadowbanSection({ sb }: { sb: Shadowban }) {
  if (!sb) return null;
  const risk = sb.risk_level || "unknown";
  const Icon = risk === "none" || risk === "low" ? ShieldCheck : risk === "medium" ? Shield : ShieldAlert;
  const tone =
    risk === "none" || risk === "low" ? "text-green-600 border-green-500/30 bg-green-500/10" :
    risk === "medium" ? "text-yellow-700 border-yellow-500/30 bg-yellow-500/10" :
    "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          Analyse shadowban
        </h3>
        <Badge variant="outline" className={tone}>{RISK_LABEL[risk] || risk}</Badge>
      </div>
      {sb.diagnosis && <p className="text-sm text-muted-foreground">{sb.diagnosis}</p>}
      {(sb.shadowban_videos != null && sb.total_videos != null) && (
        <p className="text-xs text-muted-foreground">
          {sb.shadowban_videos}/{sb.total_videos} vidéos sous le seuil ({sb.percentage ?? 0}%)
        </p>
      )}
      {sb.recommendations?.length ? (
        <ul className="space-y-1 pt-1">
          {sb.recommendations.map((r, i) => (
            <li key={i} className="text-sm flex gap-2 text-muted-foreground">
              <span className="text-primary">→</span> {r}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}