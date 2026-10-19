import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { commerceCall, money } from "@/lib/commerce";
import { monthName, type Places } from "@/lib/places";

type Overview = {
  month_start: string;
  sales: { express: number; video: number; accompagnements: { total: number } };
  todo: Record<
    | "applications" | "orders_awaiting_payment" | "orders_to_reschedule" | "activation_errors"
    | "unmatched_payments" | "failed_mail" | "express_incidents" | "video_incidents",
    number
  >;
  places: Places;
};

// Ce qui demande une action, avec la rubrique où la traiter.
const TODO: { key: keyof Overview["todo"]; label: string; href: string; urgent?: boolean }[] = [
  { key: "express_incidents", label: "Analyses Express à vérifier", href: "/admin/analyses", urgent: true },
  { key: "video_incidents", label: "Analyses vidéo à vérifier", href: "/admin/analyses", urgent: true },
  { key: "unmatched_payments", label: "Paiements à rapprocher", href: "/admin/clients", urgent: true },
  { key: "activation_errors", label: "Activations en erreur", href: "/admin/clients", urgent: true },
  { key: "failed_mail", label: "E-mails en échec", href: "/admin/clients", urgent: true },
  { key: "applications", label: "Demandes d'accompagnement à lire", href: "/admin/clients" },
  { key: "orders_to_reschedule", label: "Dates à reconvenir", href: "/admin/clients" },
  { key: "orders_awaiting_payment", label: "Propositions en attente de paiement", href: "/admin/clients" },
];

const OFFER_NAMES = { one_shot: "One Shot", academy: "Wav Academy", premium: "Wav Premium" } as const;

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setData(await commerceCall<Overview>("commerce-admin", { action: "overview" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const pending = data ? TODO.filter((t) => data.todo[t.key] > 0) : [];
  const month = data ? monthName(data.month_start.slice(0, 10)) : "";

  return (
    <AdminLayout>
      <div className="space-y-8 text-cream max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Vue d'ensemble</h1>
          <Button variant="outline" onClick={() => void load()}>Actualiser</Button>
        </div>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {!data && !error && <p role="status">Chargement…</p>}
        {data && (
          <>
            <section>
              <h2 className="font-display text-xl mb-3">À traiter</h2>
              {pending.length === 0
                ? <p className="rounded-xl border border-primary/20 p-4">Rien à traiter pour le moment.</p>
                : (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {pending.map((t) => (
                      <li key={t.key}>
                        <Link
                          to={t.href}
                          className={`flex min-h-11 items-center justify-between rounded-xl border p-4 hover:bg-primary/10 ${
                            t.urgent ? "border-red-400/50" : "border-primary/30"
                          }`}
                        >
                          <span>{t.label}</span>
                          <span className={`font-semibold text-lg ${t.urgent ? "text-red-300" : "text-primary"}`}>
                            {data.todo[t.key]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
            </section>

            <section>
              <h2 className="font-display text-xl mb-3">Ventes de {month}</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-primary/20 p-4">
                  <p className="text-cream/60 text-sm">Analyses Express</p>
                  <p className="text-2xl font-semibold">{data.sales.express}</p>
                </div>
                <div className="rounded-xl border border-primary/20 p-4">
                  <p className="text-cream/60 text-sm">Analyses vidéo</p>
                  <p className="text-2xl font-semibold">{data.sales.video}</p>
                </div>
                <div className="rounded-xl border border-primary/20 p-4">
                  <p className="text-cream/60 text-sm">Accompagnements encaissés</p>
                  <p className="text-2xl font-semibold">{money(Math.round(Number(data.sales.accompagnements.total) * 100))}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl mb-3">Places</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {(Object.keys(OFFER_NAMES) as (keyof typeof OFFER_NAMES)[]).map((id) => (
                  <div key={id} className="rounded-xl border border-primary/20 p-4">
                    <p className="font-semibold mb-1">{OFFER_NAMES[id]}</p>
                    {data.places[id]?.months.map((m) => (
                      <p key={m.month} className="text-sm">
                        {monthName(m.month)} : {m.capacity - m.remaining} / {m.capacity}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <Link to="/admin/contenus/offres" className="inline-flex min-h-11 items-center text-primary underline">
                Modifier les places d'un mois
              </Link>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
