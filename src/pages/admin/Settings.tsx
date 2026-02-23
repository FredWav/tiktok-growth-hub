import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Save } from "lucide-react";

const Settings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cream">Paramètres</h1>
          <p className="text-cream/60 mt-1">Configurez votre espace de travail</p>
        </div>

        {/* Availability section */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-cream">Disponibilités</h2>
          </div>
          
          <p className="text-cream/60 text-sm mb-4">
            Définissez vos créneaux de disponibilité pour les rendez-vous
          </p>

          <div className="space-y-4">
            {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map((day) => (
              <div
                key={day}
                className="flex items-center justify-between py-3 border-b border-primary/10 last:border-0"
              >
                <span className="text-cream">{day}</span>
                <div className="flex items-center gap-2 text-cream/60">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Non configuré</span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="mt-6">
            <Save className="h-4 w-4 mr-2" />
            Configurer les créneaux
          </Button>
        </Card>

        {/* Integrations section */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <h2 className="font-display text-xl text-cream mb-4">Intégrations</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-primary/10">
              <div>
                <p className="text-cream">Stripe</p>
                <p className="text-cream/60 text-sm">Paiements en ligne</p>
              </div>
              <span className="text-cream/40 text-sm">Non connecté</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-primary/10">
              <div>
                <p className="text-cream">Google Calendar</p>
                <p className="text-cream/60 text-sm">Synchronisation des RDV</p>
              </div>
              <span className="text-cream/40 text-sm">Non connecté</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-cream">OVH Mail</p>
                <p className="text-cream/60 text-sm">Envoi d'emails (SMTP)</p>
              </div>
              <span className="text-cream/40 text-sm">Non connecté</span>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Settings;
