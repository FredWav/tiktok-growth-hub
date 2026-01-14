import { Progress } from "@/components/ui/progress";

interface ClientProgressProps {
  totalTasks: number;
  doneTasks: number;
  showLabel?: boolean;
}

export const ClientProgress: React.FC<ClientProgressProps> = ({
  totalTasks,
  doneTasks,
  showLabel = true,
}) => {
  const percentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="h-2 flex-1 min-w-[60px]" />
      {showLabel && (
        <span className="text-sm text-cream/60 whitespace-nowrap">
          {percentage}%
        </span>
      )}
    </div>
  );
};
