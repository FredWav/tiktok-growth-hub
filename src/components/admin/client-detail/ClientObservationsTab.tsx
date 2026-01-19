import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  StickyNote,
  BarChart3,
  Trophy,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  useClientObservations,
  useCreateObservation,
  useDeleteObservation,
  type ObservationType,
} from "@/hooks/useObservations";

interface ClientObservationsTabProps {
  clientId: string;
}

const observationTypeConfig: Record<
  ObservationType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  note: {
    label: "Note",
    icon: <StickyNote className="h-4 w-4" />,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  measure: {
    label: "Mesure",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  milestone: {
    label: "Étape",
    icon: <Trophy className="h-4 w-4" />,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  concern: {
    label: "Attention",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  image_analysis: {
    label: "Analyse",
    icon: <ImageIcon className="h-4 w-4" />,
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
};

export const ClientObservationsTab: React.FC<ClientObservationsTabProps> = ({
  clientId,
}) => {
  const [filterType, setFilterType] = useState<ObservationType | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newObservation, setNewObservation] = useState({
    type: "note" as ObservationType,
    title: "",
    content: "",
    isPrivate: false,
  });

  const { data: observations = [], isLoading } = useClientObservations(
    clientId,
    filterType === "all" ? undefined : filterType
  );
  const createObservation = useCreateObservation();
  const deleteObservation = useDeleteObservation();

  const handleCreate = async () => {
    if (!newObservation.content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    try {
      await createObservation.mutateAsync({
        client_id: clientId,
        type: newObservation.type,
        title: newObservation.title || undefined,
        content: newObservation.content,
        metadata: newObservation.isPrivate ? { is_private: true } : {},
      });
      toast.success("Observation ajoutée");
      setIsAddDialogOpen(false);
      setNewObservation({
        type: "note",
        title: "",
        content: "",
        isPrivate: false,
      });
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteObservation.mutateAsync({ id, clientId });
      toast.success("Observation supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-cream/10" />
        <Skeleton className="h-24 w-full bg-cream/10" />
        <Skeleton className="h-24 w-full bg-cream/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and add button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "" : "border-primary/20 text-cream/60 hover:text-cream"}
          >
            Tout
          </Button>
          {(Object.keys(observationTypeConfig) as ObservationType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? "" : "border-primary/20 text-cream/60 hover:text-cream"}
            >
              {observationTypeConfig[type].icon}
              <span className="ml-1.5 hidden sm:inline">{observationTypeConfig[type].label}</span>
            </Button>
          ))}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-noir-light border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-cream">Nouvelle observation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm text-cream/60">Type</label>
                <Select
                  value={newObservation.type}
                  onValueChange={(value) =>
                    setNewObservation((prev) => ({ ...prev, type: value as ObservationType }))
                  }
                >
                  <SelectTrigger className="bg-noir border-primary/20 text-cream">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-noir-light border-primary/20">
                    {(Object.keys(observationTypeConfig) as ObservationType[]).map((type) => (
                      <SelectItem key={type} value={type} className="text-cream">
                        <span className="flex items-center gap-2">
                          {observationTypeConfig[type].icon}
                          {observationTypeConfig[type].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-cream/60">Titre (optionnel)</label>
                <Input
                  value={newObservation.title}
                  onChange={(e) =>
                    setNewObservation((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Titre de l'observation"
                  className="bg-noir border-primary/20 text-cream placeholder:text-cream/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-cream/60">Contenu</label>
                <Textarea
                  value={newObservation.content}
                  onChange={(e) =>
                    setNewObservation((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Décrivez votre observation..."
                  rows={4}
                  className="bg-noir border-primary/20 text-cream placeholder:text-cream/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewObservation((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))
                  }
                  className={`border-primary/20 ${
                    newObservation.isPrivate ? "text-orange-400" : "text-cream/60"
                  }`}
                >
                  {newObservation.isPrivate ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Privée
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Visible client
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-primary/20 text-cream/60"
                >
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={createObservation.isPending}>
                  {createObservation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Observations list */}
      {observations.length === 0 ? (
        <Card className="bg-noir-light border-primary/20 p-8 text-center">
          <StickyNote className="h-12 w-12 mx-auto text-cream/20 mb-4" />
          <p className="text-cream/60">Aucune observation</p>
          <p className="text-cream/40 text-sm mt-1">
            Utilisez le chatbot ou le bouton ci-dessus pour ajouter des observations
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {observations.map((observation) => {
            const config = observationTypeConfig[observation.type as ObservationType];
            const isPrivate = observation.metadata?.is_private === true;

            return (
              <Card
                key={observation.id}
                className="bg-noir-light border-primary/20 p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={config.color}>
                        {config.icon}
                        <span className="ml-1.5">{config.label}</span>
                      </Badge>
                      {isPrivate && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Privée
                        </Badge>
                      )}
                      <span className="text-xs text-cream/40 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(observation.created_at), "d MMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>

                    {observation.title && (
                      <h4 className="font-medium text-cream">{observation.title}</h4>
                    )}

                    <p className="text-cream/80 text-sm whitespace-pre-wrap">
                      {observation.content}
                    </p>

                    {observation.image_url && (
                      <div className="mt-2">
                        <a
                          href={observation.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={observation.image_url}
                            alt="Observation"
                            className="max-w-xs rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                          />
                        </a>
                      </div>
                    )}

                    {observation.metadata &&
                      Object.keys(observation.metadata).filter((k) => k !== "is_private").length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {Object.entries(observation.metadata)
                            .filter(([key]) => key !== "is_private")
                            .map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="bg-cream/5 text-cream/60 border-cream/20 text-xs"
                              >
                                {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </Badge>
                            ))}
                        </div>
                      )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-cream/40 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-noir-light border-primary/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-cream">
                          Supprimer cette observation ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-cream/60">
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-primary/20 text-cream/60">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(observation.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
