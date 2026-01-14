import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClientStatus = "prospect" | "active" | "completed" | "cancelled";

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

const statusConfig: Record<ClientStatus, { label: string; className: string }> = {
  prospect: {
    label: "Prospect",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  active: {
    label: "Actif",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  completed: {
    label: "Terminé",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export const ClientStatusBadge: React.FC<ClientStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
