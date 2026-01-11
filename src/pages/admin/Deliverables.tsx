import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

const Deliverables: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream">Livrables</h1>
            <p className="text-cream/60 mt-1">Gérez les documents et fichiers clients</p>
          </div>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un livrable
          </Button>
        </div>

        {/* Deliverables list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucun livrable pour le moment</p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Deliverables;
