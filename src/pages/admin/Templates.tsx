import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";

const Templates: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream">Templates Email</h1>
            <p className="text-cream/60 mt-1">Gérez vos modèles d'emails automatisés</p>
          </div>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>

        {/* Templates list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucun template pour le moment</p>
            <p className="text-cream/40 text-sm mt-2">
              Créez des templates pour confirmation, rappel, livraison...
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Templates;
