import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Planifié",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  completed: {
    label: "Terminé",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  no_show: {
    label: "Absent",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
