import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OfferType = "one_shot" | "45_jours" | "vip";

interface OfferBadgeProps {
  offer: OfferType;
}

const offerConfig: Record<OfferType, { label: string; className: string }> = {
  one_shot: {
    label: "One Shot",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  "45_jours": {
    label: "45 Jours",
    className: "bg-secondary/30 text-secondary-foreground border-secondary/50",
  },
  vip: {
    label: "VIP",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};

export const OfferBadge: React.FC<OfferBadgeProps> = ({ offer }) => {
  const config = offerConfig[offer];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
