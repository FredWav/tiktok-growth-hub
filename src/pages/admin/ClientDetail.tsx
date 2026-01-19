import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Phone, Globe, Instagram, Calendar, FileText, CheckSquare, AlertTriangle, Eye } from "lucide-react";
import { useClient, useUpdateClient } from "@/hooks/useClients";
import { useClientTasks } from "@/hooks/useTasks";
import { useClientSessions } from "@/hooks/useSessions";
import { useClientDeliverables } from "@/hooks/useDeliverables";
import { useClientObservations } from "@/hooks/useObservations";
import { ClientStatusBadge } from "@/components/admin/ClientStatusBadge";
import { OfferBadge } from "@/components/admin/OfferBadge";
import { ClientProgress } from "@/components/admin/ClientProgress";
import { ClientOverviewTab } from "@/components/admin/client-detail/ClientOverviewTab";
import { ClientTasksTab } from "@/components/admin/client-detail/ClientTasksTab";
import { ClientSessionsTab } from "@/components/admin/client-detail/ClientSessionsTab";
import { ClientDeliverablesTab } from "@/components/admin/client-detail/ClientDeliverablesTab";
import { ClientNotesTab } from "@/components/admin/client-detail/ClientNotesTab";
import { ClientObservationsTab } from "@/components/admin/client-detail/ClientObservationsTab";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id);
  const { data: tasks = [], isLoading: tasksLoading } = useClientTasks(id);
  const { data: sessions = [], isLoading: sessionsLoading } = useClientSessions(id);
  const { data: deliverables = [], isLoading: deliverablesLoading } = useClientDeliverables(id);
  const { data: observations = [] } = useClientObservations(id);
  const updateClient = useUpdateClient();

  if (clientLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-cream/10" />
          <Skeleton className="h-32 w-full bg-cream/10" />
          <Skeleton className="h-96 w-full bg-cream/10" />
        </div>
      </AdminLayout>
    );
  }

  if (clientError || !client) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-400">Client non trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/admin/clients")}
          >
            Retour à la liste
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  ).length;

  const nextSession = sessions.find(
    (s) => s.status === "scheduled" && new Date(s.scheduled_at) > new Date()
  );

  const lastDeliverable = deliverables[0];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/clients")}
          className="text-cream/60 hover:text-cream -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>

        {/* Client header */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl lg:text-3xl text-cream">
                  {client.profile?.full_name || "Sans nom"}
                </h1>
                <OfferBadge offer={client.offer} />
                <ClientStatusBadge status={client.status} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-cream/60">
                {client.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {client.company}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Site web
                  </a>
                )}
                {client.instagram && (
                  <a
                    href={`https://instagram.com/${client.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    {client.instagram}
                  </a>
                )}
              </div>

              <div className="flex gap-6 text-sm">
                {client.start_date && (
                  <div>
                    <span className="text-cream/40">Début:</span>{" "}
                    <span className="text-cream/80">
                      {format(new Date(client.start_date), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {client.end_date && (
                  <div>
                    <span className="text-cream/40">Fin:</span>{" "}
                    <span className="text-cream/80">
                      {format(new Date(client.end_date), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4">
              <div className="text-right">
                <p className="text-cream/40 text-sm mb-1">Progression globale</p>
                <div className="w-48">
                  <ClientProgress totalTasks={tasks.length} doneTasks={doneTasks} />
                </div>
              </div>
              {overdueTasks > 0 && (
                <div className="flex items-center gap-2 text-orange-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {overdueTasks} tâche{overdueTasks > 1 ? "s" : ""} en retard
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-noir-light border border-primary/20 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Tâches ({tasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Rendez-vous ({sessions.length})
            </TabsTrigger>
            <TabsTrigger
              value="deliverables"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Livrables ({deliverables.length})
            </TabsTrigger>
            <TabsTrigger
              value="observations"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Observations ({observations.length})
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Notes internes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClientOverviewTab
              client={client}
              todoTasks={todoTasks}
              inProgressTasks={inProgressTasks}
              doneTasks={doneTasks}
              overdueTasks={overdueTasks}
              nextSession={nextSession}
              lastDeliverable={lastDeliverable}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <ClientTasksTab
              clientId={client.id}
              tasks={tasks}
              isLoading={tasksLoading}
            />
          </TabsContent>

          <TabsContent value="sessions">
            <ClientSessionsTab
              clientId={client.id}
              sessions={sessions}
              isLoading={sessionsLoading}
            />
          </TabsContent>

          <TabsContent value="deliverables">
            <ClientDeliverablesTab
              clientId={client.id}
              deliverables={deliverables}
              isLoading={deliverablesLoading}
            />
          </TabsContent>

          <TabsContent value="observations">
            <ClientObservationsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="notes">
            <ClientNotesTab
              clientId={client.id}
              initialNotes={client.internal_notes || ""}
              onSave={(notes) =>
                updateClient.mutate({ id: client.id, internal_notes: notes })
              }
              isSaving={updateClient.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ClientDetail;
