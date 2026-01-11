import React from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { CheckSquare, FileText, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ClientDashboard: React.FC = () => {
  return (
    <ClientLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-cream">Bienvenue !</h1>
          <p className="text-cream/60 mt-2">
            Votre espace personnel pour suivre votre accompagnement
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/app/plan">
            <Card className="bg-noir-light border-primary/20 p-6 hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-cream font-medium">Plan d'Action</p>
                  <p className="text-cream/60 text-sm">0 tâches en cours</p>
                </div>
                <ArrowRight className="h-5 w-5 text-cream/40 group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>

          <Link to="/app/deliverables">
            <Card className="bg-noir-light border-primary/20 p-6 hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-cream font-medium">Mes Livrables</p>
                  <p className="text-cream/60 text-sm">0 documents</p>
                </div>
                <ArrowRight className="h-5 w-5 text-cream/40 group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>

          <Link to="/app/sessions">
            <Card className="bg-noir-light border-primary/20 p-6 hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-cream font-medium">Mes RDV</p>
                  <p className="text-cream/60 text-sm">Prochain : —</p>
                </div>
                <ArrowRight className="h-5 w-5 text-cream/40 group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Status card */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <h2 className="font-display text-xl text-cream mb-4">
            Votre accompagnement
          </h2>
          <p className="text-cream/60">
            Votre compte est actif. Les informations sur votre accompagnement
            apparaîtront ici une fois votre offre configurée.
          </p>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
