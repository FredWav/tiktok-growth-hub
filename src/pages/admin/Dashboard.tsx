import React from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, AlertTriangle, CreditCard, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useClients } from "@/hooks/useClients";
import { useOverdueTasks } from "@/hooks/useTasks";
import { OfferBadge } from "@/components/admin/OfferBadge";
import { SessionStatusBadge } from "@/components/admin/SessionStatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: upcomingSessions, isLoading: sessionsLoading } = useUpcomingSessions(7);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: overdueTasks, isLoading: overdueLoading } = useOverdueTasks();

  // Calculate clients with alerts (overdue tasks)
  const clientsWithAlerts = React.useMemo(() => {
    if (!overdueTasks || !clients) return [];
    
    const clientOverdueMap = new Map<string, number>();
    overdueTasks.forEach(task => {
      const count = clientOverdueMap.get(task.client_id) || 0;
      clientOverdueMap.set(task.client_id, count + 1);
    });

    return clients
      .filter(client => clientOverdueMap.has(client.id))
      .map(client => ({
        ...client,
        overdueCount: clientOverdueMap.get(client.id) || 0
      }))
      .sort((a, b) => b.overdueCount - a.overdueCount)
      .slice(0, 5);
  }, [overdueTasks, clients]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-cream">Dashboard</h1>
          <p className="text-cream/60 mt-2">Vue d'ensemble de votre activité</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Clients actifs</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 bg-cream/10" />
                ) : (
                  <p className="text-2xl font-bold text-cream">{stats?.activeClients || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">RDV cette semaine</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 bg-cream/10" />
                ) : (
                  <p className="text-2xl font-bold text-cream">{stats?.upcomingSessions || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Tâches en retard</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 bg-cream/10" />
                ) : (
                  <p className="text-2xl font-bold text-cream">{stats?.overdueTasks || 0}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Revenus du mois</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 bg-cream/10" />
                ) : (
                  <p className="text-2xl font-bold text-cream">
                    {((stats?.monthlyRevenue || 0) / 100).toLocaleString('fr-FR')} €
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-cream">Prochains RDV</h2>
              <Link to="/admin/sessions">
                <Button variant="ghost" size="sm" className="text-cream/60 hover:text-cream">
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 bg-cream/10" />
                ))}
              </div>
            ) : upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-noir rounded-lg border border-cream/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-cream font-medium">
                          {session.clientName}
                        </p>
                        <p className="text-cream/60 text-sm">
                          {format(new Date(session.scheduled_at), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SessionStatusBadge status={session.status} />
                      {session.meeting_link && (
                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-cream/60 hover:text-cream">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Link to={`/admin/clients/${session.client_id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-cream/60 hover:text-cream">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-cream/20 mx-auto mb-3" />
                <p className="text-cream/60 text-sm">Aucun rendez-vous prévu cette semaine</p>
              </div>
            )}
          </Card>

          {/* Clients with Alerts */}
          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-cream">Clients en alerte</h2>
              <Link to="/admin/clients">
                <Button variant="ghost" size="sm" className="text-cream/60 hover:text-cream">
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {clientsLoading || overdueLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 bg-cream/10" />
                ))}
              </div>
            ) : clientsWithAlerts.length > 0 ? (
              <div className="space-y-3">
                {clientsWithAlerts.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-noir rounded-lg border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-cream font-medium">
                          {client.profile?.full_name || 'Client inconnu'}
                        </p>
                        <p className="text-red-400 text-sm">
                          {client.overdueCount} tâche{client.overdueCount > 1 ? 's' : ''} en retard
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <OfferBadge offer={client.offer} />
                      <Link to={`/admin/clients/${client.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-cream/60 hover:text-cream">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-cream/20 mx-auto mb-3" />
                <p className="text-cream/60 text-sm">Aucun client en alerte</p>
                <p className="text-green-400 text-sm mt-1">Tout est à jour ! ✓</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
