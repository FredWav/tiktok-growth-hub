import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Eye, X } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { ClientStatusBadge } from "@/components/admin/ClientStatusBadge";
import { OfferBadge } from "@/components/admin/OfferBadge";
import { ClientProgress } from "@/components/admin/ClientProgress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading, error } = useClients();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [offerFilter, setOfferFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter((client) => {
      // Search filter
      const name = client.profile?.full_name?.toLowerCase() || "";
      const company = client.company?.toLowerCase() || "";
      const matchesSearch = 
        searchQuery === "" ||
        name.includes(searchQuery.toLowerCase()) ||
        company.includes(searchQuery.toLowerCase());

      // Offer filter
      const matchesOffer = offerFilter === "all" || client.offer === offerFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesOffer && matchesStatus;
    });
  }, [clients, searchQuery, offerFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== "" || offerFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setOfferFilter("all");
    setStatusFilter("all");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream">Clients</h1>
            <p className="text-cream/60 mt-1">
              Gérez vos clients et leurs accompagnements
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate("/admin/clients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
            <Input
              placeholder="Rechercher par nom ou entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-noir-light border-primary/30 text-cream"
            />
          </div>
          
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="w-[160px] bg-noir-light border-primary/30 text-cream">
              <SelectValue placeholder="Offre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les offres</SelectItem>
              <SelectItem value="one_shot">One Shot</SelectItem>
              <SelectItem value="45_jours">45 Jours</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-noir-light border-primary/30 text-cream">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-cream/60 hover:text-cream"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>

        {/* Clients table */}
        <Card className="bg-noir-light border-primary/20 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-cream/10" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400">Erreur lors du chargement des clients</p>
              <p className="text-cream/60 text-sm mt-1">{(error as Error).message}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-cream/60">
                {hasActiveFilters
                  ? "Aucun client ne correspond aux filtres"
                  : "Aucun client pour le moment"}
              </p>
              {!hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/admin/clients/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier client
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="text-cream/60">Client</TableHead>
                  <TableHead className="text-cream/60">Offre</TableHead>
                  <TableHead className="text-cream/60">Statut</TableHead>
                  <TableHead className="text-cream/60">Date début</TableHead>
                  <TableHead className="text-cream/60">Prochain RDV</TableHead>
                  <TableHead className="text-cream/60">Progression</TableHead>
                  <TableHead className="text-cream/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-primary/10 hover:bg-primary/5 cursor-pointer"
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-cream">
                          {client.profile?.full_name || "Sans nom"}
                        </p>
                        {client.company && (
                          <p className="text-sm text-cream/60">{client.company}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <OfferBadge offer={client.offer} />
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {client.start_date
                        ? format(new Date(client.start_date), "d MMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {client.next_session
                        ? format(new Date(client.next_session), "d MMM à HH:mm", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <ClientProgress
                        totalTasks={client.total_tasks}
                        doneTasks={client.done_tasks}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/clients/${client.id}`);
                        }}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Stats summary */}
        {clients && clients.length > 0 && (
          <div className="flex gap-4 text-sm text-cream/60">
            <span>{clients.length} client{clients.length > 1 ? "s" : ""} au total</span>
            <span>•</span>
            <span>
              {clients.filter((c) => c.status === "active").length} actif
              {clients.filter((c) => c.status === "active").length > 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <>
                <span>•</span>
                <span>{filteredClients.length} affiché{filteredClients.length > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Clients;
