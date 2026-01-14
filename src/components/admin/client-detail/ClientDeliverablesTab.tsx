import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Deliverable, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable } from "@/hooks/useDeliverables";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ClientDeliverablesTabProps {
  clientId: string;
  deliverables: Deliverable[];
  isLoading: boolean;
}

export const ClientDeliverablesTab: React.FC<ClientDeliverablesTabProps> = ({
  clientId,
  deliverables,
  isLoading,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({
    title: "",
    description: "",
    file_url: "",
    is_visible_to_client: true,
  });

  const createDeliverable = useCreateDeliverable();
  const updateDeliverable = useUpdateDeliverable();
  const deleteDeliverable = useDeleteDeliverable();

  const handleCreateDeliverable = async () => {
    if (!newDeliverable.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await createDeliverable.mutateAsync({
        client_id: clientId,
        title: newDeliverable.title,
        description: newDeliverable.description || null,
        file_url: newDeliverable.file_url || null,
        is_visible_to_client: newDeliverable.is_visible_to_client,
      });
      setNewDeliverable({
        title: "",
        description: "",
        file_url: "",
        is_visible_to_client: true,
      });
      setIsDialogOpen(false);
      toast.success("Livrable ajouté");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleToggleVisibility = async (deliverable: Deliverable) => {
    try {
      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        client_id: clientId,
        is_visible_to_client: !deliverable.is_visible_to_client,
      });
      toast.success(
        deliverable.is_visible_to_client
          ? "Livrable masqué pour le client"
          : "Livrable visible pour le client"
      );
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (deliverableId: string) => {
    if (!confirm("Supprimer ce livrable ?")) return;

    try {
      await deleteDeliverable.mutateAsync({ id: deliverableId, client_id: clientId });
      toast.success("Livrable supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
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
        <h3 className="font-display text-lg text-cream">Livrables</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un livrable
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-noir-light border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-cream">Nouveau livrable</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Titre *</label>
                <Input
                  value={newDeliverable.title}
                  onChange={(e) =>
                    setNewDeliverable({ ...newDeliverable, title: e.target.value })
                  }
                  placeholder="Titre du livrable"
                  className="bg-noir border-primary/30"
                />
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Description</label>
                <Textarea
                  value={newDeliverable.description}
                  onChange={(e) =>
                    setNewDeliverable({ ...newDeliverable, description: e.target.value })
                  }
                  placeholder="Description optionnelle"
                  className="bg-noir border-primary/30"
                />
              </div>
              <div>
                <label className="text-sm text-cream/60 mb-1 block">Lien du fichier</label>
                <Input
                  value={newDeliverable.file_url}
                  onChange={(e) =>
                    setNewDeliverable({ ...newDeliverable, file_url: e.target.value })
                  }
                  placeholder="https://drive.google.com/..."
                  className="bg-noir border-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="visibility"
                  checked={newDeliverable.is_visible_to_client}
                  onCheckedChange={(checked) =>
                    setNewDeliverable({ ...newDeliverable, is_visible_to_client: checked })
                  }
                />
                <Label htmlFor="visibility" className="text-cream/80">
                  Visible par le client
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="hero"
                  onClick={handleCreateDeliverable}
                  disabled={createDeliverable.isPending}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {deliverables.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-cream/60">Aucun livrable pour ce client</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-transparent">
              <TableHead className="text-cream/60">Titre</TableHead>
              <TableHead className="text-cream/60">Date</TableHead>
              <TableHead className="text-cream/60">Visibilité</TableHead>
              <TableHead className="text-cream/60">Fichier</TableHead>
              <TableHead className="text-cream/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliverables.map((deliverable) => (
              <TableRow
                key={deliverable.id}
                className="border-primary/10 hover:bg-primary/5"
              >
                <TableCell>
                  <div>
                    <p className="text-cream font-medium">{deliverable.title}</p>
                    {deliverable.description && (
                      <p className="text-sm text-cream/60 line-clamp-1">
                        {deliverable.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-cream/80">
                  {format(new Date(deliverable.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(deliverable)}
                    className={
                      deliverable.is_visible_to_client
                        ? "text-green-400 hover:text-green-300"
                        : "text-cream/40 hover:text-cream/60"
                    }
                  >
                    {deliverable.is_visible_to_client ? (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Masqué
                      </>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  {deliverable.file_url ? (
                    <a
                      href={deliverable.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </a>
                  ) : (
                    <span className="text-cream/40">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(deliverable.id)}
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
