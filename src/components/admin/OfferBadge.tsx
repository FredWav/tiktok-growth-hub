import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// The DB enum still allows legacy values ("one_shot", "vip") for historical
// records. We render them in a muted style so admins can distinguish active
// offers from archived ones at a glance.
type OfferType = "one_shot" | "45_jours" | "vip";

interface OfferBadgeProps {
  offer: OfferType;
}

const offerConfig: Record<OfferType, { label: string; className: string }> = {
  "45_jours": {
    label: "Wav Premium",
    className: "bg-secondary/30 text-secondary-foreground border-secondary/50",
  },
  one_shot: {
    label: "One Shot (archivé)",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  vip: {
    label: "VIP (archivé)",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
};

export const OfferBadge: React.FC<OfferBadgeProps> = ({ offer }) => {
  const config = offerConfig[offer];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
