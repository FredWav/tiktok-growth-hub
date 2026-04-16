import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDiagnosticLeads, DiagnosticLead } from "@/hooks/useDiagnosticLeads";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const stepLabels: Record<number, string> = {
  0: "Accueil",
  1: "Identité",
  2: "Audience",
  3: "Objectif",
  4: "Budget",
  5: "Temps",
  6: "Email",
  7: "Blocage",
};

const budgetLabels: Record<string, string> = {
  "0": "0 €",
  "1-200": "1-200 €",
  "200-500": "200-500 €",
  "500+": "500 € +",
  none: "Aucun",
  low: "< 200 €",
  mid: "200-500 €",
  high: "500-1000 €+",
};

const offerLabels: Record<string, string> = {
  express: "Analyse Express",
  premium: "Wav Premium",
  wav_premium: "Wav Premium",
  // Legacy values kept for historical rows
  one_shot: "One Shot (archivé)",
  one_shot_plus_premium: "One Shot + Premium (archivé)",
  discord: "Discord",
  vip: "VIP (archivé)",
};

const escapeCsv = (val: string | null | undefined) => {
  if (!val) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
};

const Diagnostics = () => {
  const { data: leads, isLoading } = useDiagnosticLeads();
  const [selected, setSelected] = useState<DiagnosticLead | null>(null);

  const handleExportCsv = () => {
    if (!leads?.length) return;
    const headers = ["Date", "Prénom", "Nom", "Email", "TikTok", "Niveau", "Objectif", "Blocage", "Budget", "Temps", "Offre recommandée", "Étape", "Statut"];
    const rows = leads.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      escapeCsv(l.first_name),
      escapeCsv(l.last_name),
      escapeCsv(l.email),
      escapeCsv(l.tiktok),
      escapeCsv(l.level),
      escapeCsv(l.objective),
      escapeCsv(l.blocker),
      l.budget ? budgetLabels[l.budget] || l.budget : "",
      escapeCsv(l.temps),
      l.recommended_offer ? offerLabels[l.recommended_offer] || l.recommended_offer : "",
      stepLabels[l.current_step] || String(l.current_step),
      l.completed ? "Complet" : "Incomplet",
    ].join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostics-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-primary">Diagnostics</h1>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!leads?.length}>
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
        </div>

        {leads && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total leads</p>
              <p className="text-2xl font-bold text-cream">{leads.length}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Complétés</p>
              <p className="text-2xl font-bold text-green-400">
                {leads.filter((l) => l.completed).length}
              </p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-yellow-400">
                {leads.filter((l) => {
                  const d = new Date(l.created_at);
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
        ) : !leads?.length ? (
          <p className="text-cream/60 text-center py-12">Aucun lead pour le moment.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Nom</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">TikTok</TableHead>
                  <TableHead className="text-cream/70">Étape</TableHead>
                  <TableHead className="text-cream/70">Budget</TableHead>
                  <TableHead className="text-cream/70">Temps</TableHead>
                  <TableHead className="text-cream/70">Offre</TableHead>
                  <TableHead className="text-cream/70">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-primary/10 cursor-pointer hover:bg-primary/5"
                    onClick={() => setSelected(lead)}
                  >
                    <TableCell className="text-cream/80">
                      {format(new Date(lead.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-cream font-medium">
                      {lead.first_name || ""} {lead.last_name || ""}
                    </TableCell>
                    <TableCell className="text-cream/80">{lead.email || "-"}</TableCell>
                    <TableCell className="text-cream/80">{lead.tiktok || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-cream/70 border-cream/20">
                        {stepLabels[lead.current_step] || `${lead.current_step}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {lead.budget ? budgetLabels[lead.budget] || lead.budget : "-"}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {lead.temps || "-"}
                    </TableCell>
                    <TableCell className="text-cream/80">
                      {lead.recommended_offer ? offerLabels[lead.recommended_offer] || lead.recommended_offer : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.completed ? "default" : "destructive"}>
                        {lead.completed ? "Complet" : "Incomplet"}
                      </Badge>
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
                  {selected.first_name || ""} {selected.last_name || ""}
                </DialogTitle>
                <DialogDescription className="text-cream/60">
                  Lead du {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cream/50 text-sm">Email</p>
                    <p>{selected.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">TikTok</p>
                    <p>{selected.tiktok || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Niveau (audience)</p>
                    <p>{selected.level || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Objectif</p>
                    <p>{selected.objective || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Budget</p>
                    <p>{selected.budget ? budgetLabels[selected.budget] || selected.budget : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Temps/semaine</p>
                    <p>{selected.temps || "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Offre recommandée</p>
                    <p>{selected.recommended_offer ? offerLabels[selected.recommended_offer] || selected.recommended_offer : "-"}</p>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Étape atteinte</p>
                    <Badge variant="outline" className="text-cream/70 border-cream/20">
                      {stepLabels[selected.current_step] || `${selected.current_step}`}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-cream/50 text-sm">Statut</p>
                    <Badge variant={selected.completed ? "default" : "destructive"}>
                      {selected.completed ? "Complet" : "Incomplet"}
                    </Badge>
                  </div>
                </div>
                {selected.blocker && (
                  <div>
                    <p className="text-cream/50 text-sm mb-1">Point de blocage</p>
                    <p className="bg-noir rounded-lg p-3 whitespace-pre-wrap text-sm">{selected.blocker}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Diagnostics;
