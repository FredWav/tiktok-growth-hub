import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const ClientPlan: React.FC = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cream">Plan d'Action</h1>
          <p className="text-cream/60 mt-2">
            Suivez vos tâches et votre progression
          </p>
        </div>

        {/* Tasks list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucune tâche pour le moment</p>
            <p className="text-cream/40 text-sm mt-2">
              Vos tâches apparaîtront ici une fois votre accompagnement démarré
            </p>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientPlan;
