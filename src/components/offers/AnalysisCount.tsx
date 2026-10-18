import { Users } from "lucide-react";
import { type CountedAnalysis, useAnalysisCount } from "@/lib/analysis-counts";

const LABELS: Record<CountedAnalysis, string> = {
  analyse_express: "l'Analyse Express",
  analyse_video: "l'Analyse vidéo",
};

/** « 224 créateurs ont fait confiance à l'Analyse Express ». */
export function AnalysisCount({ offer, className }: { offer: CountedAnalysis; className?: string }) {
  const count = useAnalysisCount(offer);
  return (
    <p className={`flex items-center gap-2 ${className ?? ""}`}>
      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        <span className="font-semibold text-foreground">{count}</span> créateurs ont fait confiance à {LABELS[offer]}
      </span>
    </p>
  );
}
