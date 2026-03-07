import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useWavPremiumApplications, WavPremiumApplication } from "@/hooks/useWavPremiumApplications";
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

const Applications = () => {
  const { data: applications, isLoading } = useWavPremiumApplications();
  const [selected, setSelected] = useState<WavPremiumApplication | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-primary">Candidatures Wav Premium</h1>

        {applications && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{applications.length}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Avec source</p>
              <p className="text-2xl font-bold text-green-400">
                {applications.filter((a) => a.origin_source).length}
              </p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-yellow-400">
                {applications.filter((a) => {
                  const d = new Date(a.created_at);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
        ) : !applications?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune candidature pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Nom</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">TikTok</TableHead>
                  <TableHead className="text-cream/70">Niveau</TableHead>
                  <TableHead className="text-cream/70">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="border-primary/10 cursor-pointer hover:bg-primary/5"
                    onClick={() => setSelected(app)}
                  >
                    <TableCell className="text-cream/80">
                      {format(new Date(app.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-cream font-medium">
                      {app.first_name} {app.last_name}
                    </TableCell>
                    <TableCell className="text-cream/80">{app.email}</TableCell>
                    <TableCell className="text-cream/80">
                      {app.tiktok_username ? `@${app.tiktok_username}` : "-"}
                    </TableCell>
                    <TableCell className="text-cream/80 max-w-[200px] truncate">
                      {app.current_level}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {app.origin_source || "-"}
                    </TableCell>
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
                <DialogTitle className="text-primary text-xl">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
                <DialogDescription className="text-cream/60">
                  Candidature du {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cream/50 text-sm">Email</p>
                    <p>{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">TikTok</p>
                    <p>{selected.tiktok_username ? `@${selected.tiktok_username}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Niveau</p>
                    <p>{selected.current_level}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">CA actuel</p>
                    <p>{selected.current_revenue || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Objectif CA</p>
                    <p>{selected.revenue_goal || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Source</p>
                    <p>{selected.origin_source || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Follower depuis</p>
                    <p>{selected.follower_since || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Points de blocage</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.blockers}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Objectifs</p>
                  <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.goals}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
