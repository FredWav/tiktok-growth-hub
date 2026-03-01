import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OneShotSubmission = Tables<"oneshot_submissions">;

const Bookings = () => {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["oneshot_submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oneshot_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OneShotSubmission[];
    },
  });

  const [selected, setSelected] = useState<OneShotSubmission | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-primary">Réservations One Shot</h1>

        {submissions && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{submissions.length}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-green-400">
                {submissions.filter((s) => {
                  const d = new Date(s.created_at);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return d >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !submissions?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune réservation pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Nom</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">WhatsApp</TableHead>
                  <TableHead className="text-cream/70">TikTok</TableHead>
                  <TableHead className="text-cream/70">Objectifs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow
                    key={sub.id}
                    className="border-primary/10 cursor-pointer hover:bg-primary/5"
                    onClick={() => setSelected(sub)}
                  >
                    <TableCell className="text-cream/80">
                      {format(new Date(sub.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-cream font-medium">{sub.name}</TableCell>
                    <TableCell className="text-cream/80">{sub.email}</TableCell>
                    <TableCell className="text-cream/80">{sub.whatsapp}</TableCell>
                    <TableCell className="text-cream/80">{sub.tiktok ? `@${sub.tiktok}` : "—"}</TableCell>
                    <TableCell className="text-cream/80 max-w-[200px] truncate">{sub.objectives}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-noir-light border-primary/20 text-cream max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary text-xl">{selected.name}</DialogTitle>
                <DialogDescription className="text-cream/60">
                  Réservation du {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cream/50 text-sm">Email</p>
                    <p>{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">WhatsApp</p>
                    <p>{selected.whatsapp}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">TikTok</p>
                    <p>{selected.tiktok ? `@${selected.tiktok}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Stripe Session</p>
                    <p className="text-xs truncate">{selected.stripe_session_id}</p>
                  </div>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Objectifs</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.objectives}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Bookings;
