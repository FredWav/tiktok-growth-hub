import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useSalesOrders, useUpdateSalesOrderNotes, SalesOrder } from "@/hooks/useSalesOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Download, Search } from "lucide-react";

const productLabel: Record<SalesOrder["product_type"], string> = {
  one_shot: "One Shot",
  wav_premium: "Wav Premium",
};

const statusVariant: Record<
  SalesOrder["payment_status"],
  { label: string; cls: string }
> = {
  awaiting_payment: { label: "En attente", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  paid: { label: "Payé", cls: "bg-green-500/20 text-green-300 border-green-500/40" },
  failed: { label: "Échec", cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  refunded: { label: "Remboursé", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  cancelled: { label: "Annulé", cls: "bg-gray-500/20 text-gray-300 border-gray-500/40" },
};

function formatMoney(cents: number | null, currency: string) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCsv(orders: SalesOrder[]) {
  const headers = [
    "id",
    "created_at",
    "product_type",
    "payment_status",
    "amount_cents",
    "currency",
    "first_name",
    "last_name",
    "email",
    "whatsapp",
    "billing_address_line1",
    "billing_address_line2",
    "billing_postal_code",
    "billing_city",
    "billing_country",
    "consent_cgv_at",
    "consent_cgv_version",
    "consent_renonciation_at",
    "consent_rgpd_at",
    "ip_address",
    "stripe_session_id",
    "stripe_payment_intent_id",
    "paid_at",
  ];
  const rows = orders.map((o) => headers.map((h) => escapeCsv((o as unknown as Record<string, unknown>)[h] as string)).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventes-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Ventes() {
  const { data: orders, isLoading } = useSalesOrders();
  const [productFilter, setProductFilter] = useState<"all" | SalesOrder["product_type"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SalesOrder["payment_status"]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SalesOrder | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const updateNotes = useUpdateSalesOrderNotes();

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (productFilter !== "all" && o.product_type !== productFilter) return false;
      if (statusFilter !== "all" && o.payment_status !== statusFilter) return false;
      if (q) {
        const hay = `${o.first_name} ${o.last_name} ${o.email} ${o.whatsapp} ${o.billing_city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, productFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const paid = list.filter((o) => o.payment_status === "paid");
    const sum = paid.reduce((acc, o) => acc + (o.amount_cents ?? 0), 0);
    return {
      total: list.length,
      paid: paid.length,
      awaiting: list.filter((o) => o.payment_status === "awaiting_payment").length,
      revenue_cents: sum,
    };
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-primary">Ventes</h1>
          <Button
            variant="outline"
            size="sm"
            disabled={!orders?.length}
            onClick={() => orders && exportCsv(filtered.length ? filtered : orders)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
            <p className="text-cream/60 text-sm">Total</p>
            <p className="text-2xl font-bold text-cream">{stats.total}</p>
          </div>
          <div className="bg-noir-light border border-green-500/20 rounded-lg p-4">
            <p className="text-cream/60 text-sm">Payées</p>
            <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
          </div>
          <div className="bg-noir-light border border-yellow-500/20 rounded-lg p-4">
            <p className="text-cream/60 text-sm">En attente</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.awaiting}</p>
          </div>
          <div className="bg-noir-light border border-primary/20 rounded-lg p-4">
            <p className="text-cream/60 text-sm">CA encaissé</p>
            <p className="text-2xl font-bold text-primary">{formatMoney(stats.revenue_cents, "EUR")}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, ville, WhatsApp)…"
              className="pl-9"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value as typeof productFilter)}
            className="bg-noir-light border border-primary/20 rounded-md px-3 py-2 text-sm text-cream"
          >
            <option value="all">Tous produits</option>
            <option value="one_shot">One Shot</option>
            <option value="wav_premium">Wav Premium</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-noir-light border border-primary/20 rounded-md px-3 py-2 text-sm text-cream"
          >
            <option value="all">Tous statuts</option>
            <option value="awaiting_payment">En attente</option>
            <option value="paid">Payé</option>
            <option value="failed">Échec</option>
            <option value="refunded">Remboursé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-cream/60">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Chargement…
          </div>
        ) : (
          <div className="bg-noir-light border border-primary/20 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-cream/40 py-8">
                      Aucune commande
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => {
                    const s = statusVariant[o.payment_status];
                    return (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-primary/5"
                        onClick={() => {
                          setSelected(o);
                          setNoteDraft(o.admin_notes ?? "");
                        }}
                      >
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(o.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>{productLabel[o.product_type]}</TableCell>
                        <TableCell>
                          {o.first_name} {o.last_name}
                        </TableCell>
                        <TableCell className="text-sm">{o.email}</TableCell>
                        <TableCell>{formatMoney(o.amount_cents, o.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={s.cls}>
                            {s.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Commande {productLabel[selected.product_type]} — {selected.first_name}{" "}
                  {selected.last_name}
                </DialogTitle>
                <DialogDescription>
                  Créée le {format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-cream/60 mb-2">
                    Identité & contact
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-cream/40 text-xs">Nom complet</p>
                      <p>
                        {selected.first_name} {selected.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-cream/40 text-xs">Email</p>
                      <p className="break-all">{selected.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-cream/40 text-xs">WhatsApp</p>
                      <p>
                        <a
                          href={`https://wa.me/${selected.whatsapp.replace(/[^0-9+]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selected.whatsapp}
                        </a>
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-cream/60 mb-2">
                    Adresse de facturation
                  </h4>
                  <p>{selected.billing_address_line1}</p>
                  {selected.billing_address_line2 && <p>{selected.billing_address_line2}</p>}
                  <p>
                    {selected.billing_postal_code} {selected.billing_city}
                  </p>
                  <p>{selected.billing_country}</p>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-cream/60 mb-2">Paiement</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-cream/40 text-xs">Montant</p>
                      <p>{formatMoney(selected.amount_cents, selected.currency)}</p>
                    </div>
                    <div>
                      <p className="text-cream/40 text-xs">Statut</p>
                      <Badge
                        variant="outline"
                        className={statusVariant[selected.payment_status].cls}
                      >
                        {statusVariant[selected.payment_status].label}
                      </Badge>
                    </div>
                    {selected.paid_at && (
                      <div className="col-span-2">
                        <p className="text-cream/40 text-xs">Payé le</p>
                        <p>{format(new Date(selected.paid_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
                      </div>
                    )}
                    {selected.stripe_session_id && (
                      <div className="col-span-2">
                        <p className="text-cream/40 text-xs">Stripe session</p>
                        <p className="font-mono text-xs break-all">{selected.stripe_session_id}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-cream/60 mb-2">
                    Consentements (preuves légales)
                  </h4>
                  <ul className="space-y-1">
                    <li>
                      <span className="text-cream/40">CGV ({selected.consent_cgv_version}) :</span>{" "}
                      {format(new Date(selected.consent_cgv_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </li>
                    <li>
                      <span className="text-cream/40">Renonciation rétractation (L221-28) :</span>{" "}
                      {format(new Date(selected.consent_renonciation_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </li>
                    <li>
                      <span className="text-cream/40">RGPD :</span>{" "}
                      {format(new Date(selected.consent_rgpd_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </li>
                    {selected.ip_address && (
                      <li>
                        <span className="text-cream/40">IP :</span>{" "}
                        <span className="font-mono">{selected.ip_address}</span>
                      </li>
                    )}
                    {selected.user_agent && (
                      <li>
                        <span className="text-cream/40">User-Agent :</span>{" "}
                        <span className="text-xs break-all">{selected.user_agent}</span>
                      </li>
                    )}
                  </ul>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-cream/60 mb-2">
                    Notes admin (privées)
                  </h4>
                  <Textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    placeholder="Notes internes…"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      disabled={
                        updateNotes.isPending || noteDraft === (selected.admin_notes ?? "")
                      }
                      onClick={() => updateNotes.mutate({ id: selected.id, notes: noteDraft })}
                    >
                      {updateNotes.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Enregistrer
                    </Button>
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
