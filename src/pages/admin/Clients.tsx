import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Clients: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream">Clients</h1>
            <p className="text-cream/60 mt-1">Gérez vos clients et leurs accompagnements</p>
          </div>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
            <Input
              placeholder="Rechercher un client..."
              className="pl-10 bg-noir-light border-primary/30 text-cream"
            />
          </div>
        </div>

        {/* Clients list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <p className="text-cream/60">Aucun client pour le moment</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter votre premier client
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Clients;
