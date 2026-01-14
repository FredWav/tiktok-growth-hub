import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "in_progress" | "done";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "À faire",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  in_progress: {
    label: "En cours",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  done: {
    label: "Terminée",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
};

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
