import { AdminLayout } from "@/components/layout/AdminLayout";
import { useExpressAnalyses } from "@/hooks/useExpressAnalyses";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "outline" },
  processing: { label: "En cours", variant: "secondary" },
  complete: { label: "Terminée", variant: "default" },
  failed: { label: "Échouée", variant: "destructive" },
};

const ExpressAnalyses = () => {
  const { data: analyses, isLoading } = useExpressAnalyses();

  const stats = analyses
    ? {
        total: analyses.length,
        complete: analyses.filter((a) => a.status === "complete").length,
        failed: analyses.filter((a) => a.status === "failed").length,
        processing: analyses.filter((a) => a.status === "processing" || a.status === "pending").length,
      }
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-primary">Analyses Express</h1>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{stats.total}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Réussies</p>
              <p className="text-2xl font-bold text-green-400">{stats.complete}</p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">En cours</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.processing}</p>
            </div>
            <div className="bg-noir-light border border-red-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Échouées</p>
              <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !analyses?.length ? (
          <p className="text-cream/60 text-center py-12">Aucune analyse express pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Username</TableHead>
                  <TableHead className="text-cream/70">Statut</TableHead>
                  <TableHead className="text-cream/70">Health Score</TableHead>
                  <TableHead className="text-cream/70">Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => {
                  const config = statusConfig[analysis.status] || statusConfig.pending;
                  return (
                    <TableRow key={analysis.id} className="border-primary/10">
                      <TableCell className="text-cream/80">
                        {format(new Date(analysis.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-cream font-medium">
                        @{analysis.tiktok_username}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-cream/80">
                        {analysis.health_score != null ? `${analysis.health_score}/100` : "—"}
                      </TableCell>
                      <TableCell className="text-red-400 text-sm max-w-[200px] truncate">
                        {analysis.error_message || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExpressAnalyses;
