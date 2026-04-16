import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Video, CheckCircle, XCircle, UserX } from "lucide-react";
import { Session, useCreateSession, useUpdateSession } from "@/hooks/useSessions";
import { SessionStatusBadge } from "@/components/admin/SessionStatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ClientSessionsTabProps {
  clientId: string;
  sessions: Session[];
  isLoading: boolean;
}

export const ClientSessionsTab: React.FC<ClientSessionsTabProps> = ({
  clientId,
  sessions,
  isLoading,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    type: "suivi" as Session["type"],
    scheduled_at: "",
    duration_minutes: 60,
    meeting_link: "",
  });

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const handleCreateSession = async () => {
    if (!newSession.scheduled_at) {
      toast.error("La date est requise");
      return;
    }

    try {
      await createSession.mutateAsync({
        client_id: clientId,
        type: newSession.type,
        scheduled_at: new Date(newSession.scheduled_at).toISOString(),
        duration_minutes: newSession.duration_minutes,
        meeting_link: newSession.meeting_link || null,
        status: "scheduled",
      });
      setNewSession({
        type: "suivi",
        scheduled_at: "",
        duration_minutes: 60,
        meeting_link: "",
      });
      setIsDialogOpen(false);
      toast.success("Rendez-vous créé");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleStatusChange = async (sessionId: string, status: Session["status"]) => {
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        client_id: clientId,
        status,
      });
      toast.success("Statut mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getSessionTypeLabel = (type: Session["type"]) => {
    const labels: Record<Session["type"], string> = {
      closing_45j: "Closing Wav Premium",
      closing_vip: "Closing VIP (archivé)",
      suivi: "Suivi",
      one_shot: "One Shot (archivé)",
    };
    return labels[type];
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
        <h3 className="font-display text-lg text-cream">Rendez-vous</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau RDV
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-noir-light border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-cream">Nouveau rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Type *</label>
                <Select
                  value={newSession.type}
                  onValueChange={(value) =>
                    setNewSession({ ...newSession, type: value as Session["type"] })
                  }
                >
                  <SelectTrigger className="bg-noir border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suivi">Suivi</SelectItem>
                    <SelectItem value="closing_45j">Closing Wav Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Date et heure *</label>
                <Input
                  type="datetime-local"
                  value={newSession.scheduled_at}
                  onChange={(e) =>
                    setNewSession({ ...newSession, scheduled_at: e.target.value })
                  }
                  className="bg-noir border-primary/30"
                />
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Durée (minutes)</label>
                <Select
                  value={String(newSession.duration_minutes)}
                  onValueChange={(value) =>
                    setNewSession({ ...newSession, duration_minutes: Number(value) })
                  }
                >
                  <SelectTrigger className="bg-noir border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Lien de réunion</label>
                <Input
                  value={newSession.meeting_link}
                  onChange={(e) =>
                    setNewSession({ ...newSession, meeting_link: e.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                  className="bg-noir border-primary/30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="hero"
                  onClick={handleCreateSession}
                  disabled={createSession.isPending}
                >
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-cream/60">Aucun rendez-vous pour ce client</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-transparent">
              <TableHead className="text-cream/60">Type</TableHead>
              <TableHead className="text-cream/60">Date</TableHead>
              <TableHead className="text-cream/60">Durée</TableHead>
              <TableHead className="text-cream/60">Statut</TableHead>
              <TableHead className="text-cream/60">Lien</TableHead>
              <TableHead className="text-cream/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id} className="border-primary/10 hover:bg-primary/5">
                <TableCell className="text-cream">
                  {getSessionTypeLabel(session.type)}
                </TableCell>
                <TableCell className="text-cream/80">
                  {format(new Date(session.scheduled_at), "d MMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell className="text-cream/80">
                  {session.duration_minutes} min
                </TableCell>
                <TableCell>
                  <SessionStatusBadge status={session.status} />
                </TableCell>
                <TableCell>
                  {session.meeting_link ? (
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <Video className="h-4 w-4" />
                      Rejoindre
                    </a>
                  ) : (
                    <span className="text-cream/40">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(session.id, "completed")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Marquer terminé
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(session.id, "cancelled")}
                      >
                        <XCircle className="h-4 w-4 mr-2 text-red-400" />
                        Annuler
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(session.id, "no_show")}
                      >
                        <UserX className="h-4 w-4 mr-2 text-orange-400" />
                        Absent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
