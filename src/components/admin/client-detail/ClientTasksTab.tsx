import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Task, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { TaskStatusBadge } from "@/components/admin/TaskStatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ClientTasksTabProps {
  clientId: string;
  tasks: Task[];
  isLoading: boolean;
}

export const ClientTasksTab: React.FC<ClientTasksTabProps> = ({
  clientId,
  tasks,
  isLoading,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await createTask.mutateAsync({
        client_id: clientId,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        status: "todo",
      });
      setNewTask({ title: "", description: "", due_date: "" });
      setIsDialogOpen(false);
      toast.success("Tâche créée");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        client_id: clientId,
        status: status as "todo" | "in_progress" | "done",
      });
      toast.success("Statut mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      await deleteTask.mutateAsync({ id: taskId, client_id: clientId });
      toast.success("Tâche supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card className="bg-noir-light border-primary/20 p-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2 bg-cream/10" />
        ))}
      </Card>
    );
  }

  return (
    <Card className="bg-noir-light border-primary/20 overflow-hidden">
      <div className="p-4 border-b border-primary/20 flex justify-between items-center">
        <h3 className="font-display text-lg text-cream">Tâches du client</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-noir-light border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-cream">Nouvelle tâche</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Titre *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Titre de la tâche"
                  className="bg-noir border-primary/30"
                />
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Description optionnelle"
                  className="bg-noir border-primary/30"
                />
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Date d'échéance</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="bg-noir border-primary/30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="hero"
                  onClick={handleCreateTask}
                  disabled={createTask.isPending}
                >
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-cream/60">Aucune tâche pour ce client</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-transparent">
              <TableHead className="text-cream/60">Titre</TableHead>
              <TableHead className="text-cream/60">Statut</TableHead>
              <TableHead className="text-cream/60">Échéance</TableHead>
              <TableHead className="text-cream/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="border-primary/10 hover:bg-primary/5">
                <TableCell>
                  <div>
                    <p className="text-cream font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-cream/60 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                  >
                    <SelectTrigger className="w-[130px] bg-transparent border-0 p-0 h-auto">
                      <TaskStatusBadge status={task.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">À faire</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="done">Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {task.due_date ? (
                      <>
                        <span
                          className={
                            isOverdue(task.due_date) && task.status !== "done"
                              ? "text-orange-400"
                              : "text-cream/80"
                          }
                        >
                          {format(new Date(task.due_date), "d MMM yyyy", { locale: fr })}
                        </span>
                        {isOverdue(task.due_date) && task.status !== "done" && (
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                        )}
                      </>
                    ) : (
                      <span className="text-cream/40">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
