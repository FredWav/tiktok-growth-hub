import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ClientDeliverables: React.FC = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cream">Mes Livrables</h1>
          <p className="text-cream/60 mt-2">
            Retrouvez tous vos documents et ressources
          </p>
        </div>

        {/* Deliverables list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucun livrable pour le moment</p>
            <p className="text-cream/40 text-sm mt-2">
              Vos documents apparaîtront ici une fois disponibles
            </p>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientDeliverables;
