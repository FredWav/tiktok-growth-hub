import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const ClientSessions: React.FC = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cream">Mes Rendez-vous</h1>
          <p className="text-cream/60 mt-2">
            Consultez et gérez vos rendez-vous
          </p>
        </div>

        {/* Sessions list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucun rendez-vous planifié</p>
            <p className="text-cream/40 text-sm mt-2">
              Vos rendez-vous apparaîtront ici une fois programmés
            </p>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientSessions;
