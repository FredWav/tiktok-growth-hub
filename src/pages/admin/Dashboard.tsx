import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Users, Calendar, CreditCard, CheckSquare } from "lucide-react";

const Dashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-cream">Dashboard</h1>
          <p className="text-cream/60 mt-2">Vue d'ensemble de votre activité</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Clients actifs</p>
                <p className="text-2xl font-bold text-cream">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">RDV cette semaine</p>
                <p className="text-2xl font-bold text-cream">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Revenus du mois</p>
                <p className="text-2xl font-bold text-cream">0 €</p>
              </div>
            </div>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-cream/60 text-sm">Tâches en cours</p>
                <p className="text-2xl font-bold text-cream">0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-noir-light border-primary/20 p-6">
            <h2 className="font-display text-xl text-cream mb-4">Prochains RDV</h2>
            <p className="text-cream/60 text-sm">Aucun rendez-vous prévu</p>
          </Card>

          <Card className="bg-noir-light border-primary/20 p-6">
            <h2 className="font-display text-xl text-cream mb-4">Activité récente</h2>
            <p className="text-cream/60 text-sm">Aucune activité récente</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
