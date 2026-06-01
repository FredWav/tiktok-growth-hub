import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useWavAcademyConsents, WavAcademyConsent } from "@/hooks/useWavAcademyConsents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toCSV, downloadCSV, CsvColumn } from "@/lib/csv-export";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Download, Check, X, Search } from "lucide-react";

const formuleLabel = (c: WavAcademyConsent): string => {
  switch (c.access_months) {
    case 1: return "1 mois";
    case 3: return "3 mois";
    case 6: return "6 mois";
    default: return c.access_months ? `${c.access_months} mois` : "—";
  }
};

// Colonnes du CSV de preuve légale (toutes les données du consentement).
const CSV_COLUMNS: CsvColumn<WavAcademyConsent>[] = [
  { key: "id", label: "id" },
  { key: "created_at", label: "date_consentement" },
  { key: "email", label: "email" },
  { key: "plan_type", label: "plan_type" },
  { label: "formule", format: formuleLabel },
  { key: "consent_cgv", label: "consent_cgv" },
  { key: "consent_renonciation", label: "consent_renonciation" },
  { key: "cgv_version", label: "cgv_version" },
  { key: "ip_address", label: "ip_address" },
  { key: "user_agent", label: "user_agent" },
  { key: "stripe_session_id", label: "stripe_session_id" },
  { label: "paye", format: (c) => (c.stripe_session_id ? "oui" : "non") },
];

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
const today = () => new Date().toISOString().slice(0, 10);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-cream/50 text-sm">{label}</p>
    <p className="break-all">{value}</p>
  </div>
);

const Bool = ({ value }: { value: boolean }) =>
  value ? (
    <Check className="h-4 w-4 text-green-400 inline" />
  ) : (
    <X className="h-4 w-4 text-red-400 inline" />
  );

const WavAcademyConsents = () => {
  const { data: consents, isLoading } = useWavAcademyConsents();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<WavAcademyConsent | null>(null);

  const filtered = useMemo(() => {
    if (!consents) return [];
    const q = search.trim().toLowerCase();
    return q ? consents.filter((c) => c.email.toLowerCase().includes(q)) : consents;
  }, [consents, search]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportRows = (rows: WavAcademyConsent[], suffix: string) => {
    if (!rows.length) return;
    downloadCSV(`consentements-wavacademy-${suffix}-${today()}.csv`, toCSV(rows, CSV_COLUMNS));
  };

  const selectedRows = (consents ?? []).filter((c) => selectedIds.has(c.id));
  const paidCount = (consents ?? []).filter((c) => c.stripe_session_id).length;
  const weekCount = (consents ?? []).filter((c) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(c.created_at) >= weekAgo;
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl text-primary">Consentements Wav Academy</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedRows.length}
              onClick={() => exportRows(selectedRows, `selection-${selectedRows.length}`)}
              className="border-primary/40 text-cream hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter la sélection ({selectedRows.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!consents?.length}
              onClick={() => exportRows(consents ?? [], "tout")}
              className="border-primary/40 text-cream hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Tout exporter
            </Button>
          </div>
        </div>

        {consents && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Total</p>
              <p className="text-2xl font-bold text-cream">{consents.length}</p>
            </div>
            <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Payés</p>
              <p className="text-2xl font-bold text-green-400">{paidCount}</p>
            </div>
            <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
              <p className="text-cream/60 text-sm">Cette semaine</p>
              <p className="text-2xl font-bold text-yellow-400">{weekCount}</p>
            </div>
          </div>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
          <Input
            placeholder="Rechercher par email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-noir-light border-primary/20 text-cream"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filtered.length ? (
          <p className="text-cream/60 text-center py-12">Aucun consentement.</p>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
                  </TableHead>
                  <TableHead className="text-cream/70">Date</TableHead>
                  <TableHead className="text-cream/70">Email</TableHead>
                  <TableHead className="text-cream/70">Formule</TableHead>
                  <TableHead className="text-cream/70 text-center">CGV</TableHead>
                  <TableHead className="text-cream/70 text-center">Renonc.</TableHead>
                  <TableHead className="text-cream/70 text-center">Version</TableHead>
                  <TableHead className="text-cream/70 text-center">Payé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-primary/10 cursor-pointer hover:bg-primary/5"
                    onClick={() => setSelected(c)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => toggleOne(c.id)}
                        aria-label={`Sélectionner ${c.email}`}
                      />
                    </TableCell>
                    <TableCell className="text-cream/80 whitespace-nowrap">
                      {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-cream font-medium">{c.email}</TableCell>
                    <TableCell className="text-cream/80">{formuleLabel(c)}</TableCell>
                    <TableCell className="text-center"><Bool value={c.consent_cgv} /></TableCell>
                    <TableCell className="text-center"><Bool value={c.consent_renonciation} /></TableCell>
                    <TableCell className="text-center text-cream/70">{c.cgv_version}</TableCell>
                    <TableCell className="text-center">
                      {c.stripe_session_id ? (
                        <span className="text-green-400 text-xs font-semibold">Payé</span>
                      ) : (
                        <span className="text-cream/40 text-xs">—</span>
                      )}
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
                <DialogTitle className="text-primary text-xl">Consentement — {selected.email}</DialogTitle>
                <DialogDescription className="text-cream/60">
                  {format(new Date(selected.created_at), "dd MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" value={selected.email} />
                  <Field label="Formule" value={formuleLabel(selected)} />
                  <Field label="Acceptation CGV" value={selected.consent_cgv ? "Oui" : "Non"} />
                  <Field label="Renonciation rétractation" value={selected.consent_renonciation ? "Oui" : "Non"} />
                  <Field label="Version CGV" value={selected.cgv_version} />
                  <Field label="Statut paiement" value={selected.stripe_session_id ? "Payé" : "Non finalisé"} />
                  <Field label="Adresse IP" value={selected.ip_address ?? "—"} />
                  <Field label="ID session Stripe" value={selected.stripe_session_id ?? "—"} />
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">User-agent</p>
                  <p className="bg-noir rounded-lg p-3 break-all text-xs">{selected.user_agent ?? "—"}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">Horodatage (ISO)</p>
                  <p className="bg-noir rounded-lg p-3 text-xs">{selected.created_at}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-sm mb-1">ID consentement</p>
                  <p className="bg-noir rounded-lg p-3 break-all text-xs">{selected.id}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-primary/40 text-cream hover:bg-primary/10"
                  onClick={() => exportRows([selected], slug(selected.email))}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter ce consentement (CSV)
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default WavAcademyConsents;
