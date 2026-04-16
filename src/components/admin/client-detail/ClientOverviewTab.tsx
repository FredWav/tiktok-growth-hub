import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, CheckSquare, Clock, AlertTriangle, Play } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

interface ClientOverviewTabProps {
  client: Tables<"clients"> & { profile?: { full_name: string | null; avatar_url?: string | null } | null };
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  nextSession?: Tables<"sessions">;
  lastDeliverable?: Tables<"deliverables">;
}

export const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({
  client,
  todoTasks,
  inProgressTasks,
  doneTasks,
  overdueTasks,
  nextSession,
  lastDeliverable,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Info + Quick stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Task counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-noir-light border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CheckSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cream">{todoTasks}</p>
                <p className="text-xs text-cream/60">À faire</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Play className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cream">{inProgressTasks}</p>
                <p className="text-xs text-cream/60">En cours</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cream">{doneTasks}</p>
                <p className="text-xs text-cream/60">Terminées</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cream">{overdueTasks}</p>
                <p className="text-xs text-cream/60">En retard</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact info */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <h3 className="font-display text-lg text-cream mb-4">Informations de contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-cream/40">Entreprise</p>
              <p className="text-cream">{client.company || "-"}</p>
            </div>
            <div>
              <p className="text-cream/40">Téléphone</p>
              <p className="text-cream">{client.phone || "-"}</p>
            </div>
            <div>
              <p className="text-cream/40">Site web</p>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.website}
                </a>
              ) : (
                <p className="text-cream">-</p>
              )}
            </div>
            <div>
              <p className="text-cream/40">Instagram</p>
              {client.instagram ? (
                <a
                  href={`https://instagram.com/${client.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.instagram}
                </a>
              ) : (
                <p className="text-cream">-</p>
              )}
            </div>
          </div>
          {client.tags && client.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-cream/40 text-sm mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right column - Next session + Last deliverable */}
      <div className="space-y-6">
        {/* Next session */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-display text-lg text-cream">Prochain RDV</h3>
          </div>
          {nextSession ? (
            <div className="space-y-2">
              <p className="text-cream font-medium">
                {format(new Date(nextSession.scheduled_at), "EEEE d MMMM", { locale: fr })}
              </p>
              <p className="text-cream/60">
                à {format(new Date(nextSession.scheduled_at), "HH:mm", { locale: fr })}
              </p>
              <p className="text-sm text-cream/40">
                {nextSession.type === "closing_45j" && "Closing Wav Premium"}
                {nextSession.type === "suivi" && "Suivi"}
                {nextSession.type === "closing_vip" && "Closing VIP (archivé)"}
                {nextSession.type === "one_shot" && "One Shot (archivé)"}
              </p>
              {nextSession.meeting_link && (
                <a
                  href={nextSession.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-primary text-sm hover:underline"
                >
                  Rejoindre la réunion →
                </a>
              )}
            </div>
          ) : (
            <p className="text-cream/60 text-sm">Aucun rendez-vous programmé</p>
          )}
        </Card>

        {/* Last deliverable */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-display text-lg text-cream">Dernier livrable</h3>
          </div>
          {lastDeliverable ? (
            <div className="space-y-2">
              <p className="text-cream font-medium">{lastDeliverable.title}</p>
              <p className="text-sm text-cream/60">
                {format(new Date(lastDeliverable.created_at), "d MMMM yyyy", { locale: fr })}
              </p>
              {lastDeliverable.file_url && (
                <a
                  href={lastDeliverable.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-primary text-sm hover:underline"
                >
                  Voir le fichier →
                </a>
              )}
            </div>
          ) : (
            <p className="text-cream/60 text-sm">Aucun livrable envoyé</p>
          )}
        </Card>
      </div>
    </div>
  );
};
