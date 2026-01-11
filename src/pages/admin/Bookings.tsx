import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const Bookings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cream">Réservations</h1>
          <p className="text-cream/60 mt-1">Suivez vos paiements et réservations</p>
        </div>

        {/* Bookings list */}
        <Card className="bg-noir-light border-primary/20 p-6">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <p className="text-cream/60">Aucune réservation pour le moment</p>
            <p className="text-cream/40 text-sm mt-2">
              Les réservations apparaîtront ici après intégration de Stripe
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Bookings;
