import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { commerceCall, money } from "@/lib/commerce";

/**
 * Statistiques : ventes confirmées (base, tous les acheteurs) et audience du site
 * (PostHog, visiteurs ayant accepté les cookies). Une donnée qui n'a pas pu être
 * lue est affichée « indisponible », jamais 0.
 */

type Rows = Record<string, string | number | null>[];
// Bloc lu (rows) ou indisponible (reason).
type Block = { available: boolean; rows?: Rows; reason?: string };
type Sales = {
  analyses: { express: number; video: number };
  accompagnements: Record<"one_shot" | "academy" | "premium", { orders: number; revenue_cents: number }>;
  applications: Record<"one_shot" | "academy" | "premium" | "conseil", number>;
  daily: { day: string; express: number; video: number; revenue_cents: number }[];
};
type Stats = {
  range: { from: string; to: string };
  sales: Sales;
  site: Record<"audience" | "daily" | "pages" | "sources" | "campaigns" | "funnel" | "friction" | "articles", Block>;
  site_fetched_at: string | null;
};

const OFFERS = [
  { id: "express", name: "Analyse Express" },
  { id: "video", name: "Analyse vidéo" },
  { id: "one_shot", name: "One Shot" },
  { id: "academy", name: "Wav Academy" },
  { id: "premium", name: "Wav Premium" },
  { id: "conseil", name: "Demande de conseil" },
] as const;
type OfferKey = (typeof OFFERS)[number]["id"];

const STEPS = [
  { id: "offer_view", label: "Page de l'offre vue" },
  { id: "cta_click", label: "Clic vers l'offre" },
  { id: "form_start", label: "Formulaire commencé" },
  { id: "application_submit", label: "Demande envoyée" },
  { id: "checkout_start", label: "Départ au paiement" },
] as const;

const FRICTION_NAMES: Record<string, string> = {
  form_abandon: "Formulaire abandonné",
  form_error: "Erreur affichée",
  checkout_back: "Revenu de Stripe sans payer",
};
const OFFER_NAMES: Record<string, string> = Object.fromEntries(
  [["express", "Analyse Express"], ["video", "Analyse vidéo"], ["one_shot", "One Shot"], ["academy", "Wav Academy"],
    ["premium", "Wav Premium"], ["conseil", "Demande de conseil"]],
);

const nf = new Intl.NumberFormat("fr-FR");
const n = (value: unknown) => nf.format(Number(value ?? 0));

function todayInParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}
function shift(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function presets() {
  const today = todayInParis();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = shift(monthStart, -1);
  return [
    { label: "7 jours", from: shift(today, -6), to: today },
    { label: "30 jours", from: shift(today, -29), to: today },
    { label: "Ce mois-ci", from: monthStart, to: today },
    { label: "Mois dernier", from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd },
    { label: "90 jours", from: shift(today, -89), to: today },
  ];
}
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const SOURCE_NAMES: Record<string, string> = { $direct: "Accès direct ou application" };

function Unavailable({ reason }: { reason: string }) {
  return (
    <p className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm text-amber-200">
      Indisponible : {reason}
    </p>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {note && <p className="text-sm text-cream/60">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Figure({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/20 p-4">
      <p className="text-cream/60 text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {detail && <p className="text-sm text-cream/60">{detail}</p>}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="rounded-xl border border-primary/20 p-4 text-sm text-cream/60">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-primary/20">
      <table className="w-full text-sm">
        <thead className="text-left text-cream/60">
          <tr>
            {head.map((h, i) => <th key={h} scope="col" className={`p-3 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} className="border-t border-primary/10">
              {cells.map((c, i) => <td key={i} className={`p-3 ${i > 0 ? "text-right tabular-nums" : "break-all"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Contenu d'un bloc PostHog, ou la raison de son absence. */
function BlockView({ block, children }: { block: Block; children: (rows: Rows) => ReactNode }) {
  return block.available ? <>{children(block.rows ?? [])}</> : <Unavailable reason={block.reason ?? "erreur inconnue"} />;
}

const visitorsChart = { visitors: { label: "Visiteurs", color: "hsl(var(--primary))" } } satisfies ChartConfig;
const salesChart = {
  express: { label: "Analyses Express", color: "hsl(var(--primary))" },
  video: { label: "Analyses vidéo", color: "hsl(var(--gold-light))" },
} satisfies ChartConfig;

export default function AdminStatistiques() {
  const [range, setRange] = useState(() => presets()[1]);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError("");
    try {
      setData(await commerceCall<Stats>("admin-stats", { from: range.from, to: range.to, refresh }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);
  useEffect(() => {
    void load();
  }, [load]);

  const funnelCell = (offer: OfferKey, step: string): ReactNode => {
    const block = data?.site.funnel;
    if (!block?.available) return "indisponible";
    const row = (block.rows ?? []).find((r) => r.offer === offer && r.step === step);
    return n(row?.people ?? 0);
  };
  const salesOf = (offer: OfferKey): ReactNode => {
    if (!data) return "";
    const s = data.sales;
    if (offer === "express" || offer === "video") return n(s.analyses[offer]);
    if (offer === "conseil") return "—";
    const a = s.accompagnements[offer];
    return <>{n(a.orders)}<span className="block text-xs text-cream/60">{money(a.revenue_cents)}</span></>;
  };
  const applicationsOf = (offer: OfferKey): number | null =>
    data && offer !== "express" && offer !== "video" ? data.sales.applications[offer] : null;

  const revenue = data ? Object.values(data.sales.accompagnements).reduce((sum, a) => sum + a.revenue_cents, 0) : 0;
  const audience = data?.site.audience;
  const a = audience?.available ? audience.rows?.[0] ?? {} : null;

  return (
    <AdminLayout>
      <div className="space-y-10 text-cream max-w-6xl">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl">Statistiques</h1>
            <Button variant="outline" disabled={loading} onClick={() => void load(true)}>
              {loading ? "Lecture…" : "Actualiser"}
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {presets().map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={p.from === range.from && p.to === range.to ? "default" : "outline"}
                onClick={() => setRange(p)}
              >
                {p.label}
              </Button>
            ))}
            <label className="flex flex-col text-xs text-cream/60">
              Du
              <input
                type="date"
                className="min-h-10 rounded-md border border-primary/30 bg-transparent px-2 text-sm text-cream"
                value={range.from}
                max={range.to}
                onChange={(e) => e.target.value && setRange({ label: "", from: e.target.value, to: range.to })}
              />
            </label>
            <label className="flex flex-col text-xs text-cream/60">
              Au
              <input
                type="date"
                className="min-h-10 rounded-md border border-primary/30 bg-transparent px-2 text-sm text-cream"
                value={range.to}
                min={range.from}
                max={todayInParis()}
                onChange={(e) => e.target.value && setRange({ label: "", from: range.from, to: e.target.value })}
              />
            </label>
          </div>
          <p className="text-sm text-cream/60">
            Ventes : paiements confirmés par Stripe, tous les acheteurs. Audience et parcours : visiteurs qui ont accepté
            les cookies (PostHog), donc une partie seulement des visiteurs réels.
          </p>
        </div>

        {error && <p role="alert" className="text-red-300">{error}</p>}
        {!data && !error && <p role="status">Chargement…</p>}

        {data && (
          <>
            <Panel title="Ventes" note={`Du ${shortDay(data.range.from)} au ${shortDay(data.range.to)}, heure de Paris.`}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Figure label="Analyses Express" value={n(data.sales.analyses.express)} />
                <Figure label="Analyses vidéo" value={n(data.sales.analyses.video)} />
                <Figure
                  label="Accompagnements encaissés"
                  value={money(revenue)}
                  detail="Remboursements déduits"
                />
                <Figure
                  label="Demandes d'accompagnement"
                  value={n(Object.values(data.sales.applications).reduce((s, v) => s + v, 0))}
                />
              </div>
              <p className="text-xs text-cream/60">
                Le montant payé pour une analyse n'est pas enregistré en base : seul leur nombre est affiché.
              </p>
              {data.sales.daily.length > 1 && (
                <ChartContainer config={salesChart} className="h-[220px] w-full">
                  <BarChart data={data.sales.daily}>
                    <CartesianGrid vertical={false} strokeOpacity={0.15} />
                    <XAxis dataKey="day" tickFormatter={shortDay} tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => shortDay(String(v))} />} />
                    <Bar dataKey="express" stackId="s" fill="var(--color-express)" />
                    <Bar dataKey="video" stackId="s" fill="var(--color-video)" />
                  </BarChart>
                </ChartContainer>
              )}
            </Panel>

            <Panel title="Audience du site">
              {audience && !audience.available ? <Unavailable reason={audience.reason ?? "erreur inconnue"} /> : a && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Figure label="Visiteurs" value={n(a.visitors)} />
                  <Figure label="Visites" value={n(a.sessions)} />
                  <Figure label="Pages vues" value={n(a.pageviews)} />
                </div>
              )}
              <BlockView block={data.site.daily}>
                {(rows) => rows.length > 1 && (
                  <ChartContainer config={visitorsChart} className="h-[220px] w-full">
                    <AreaChart data={rows}>
                      <CartesianGrid vertical={false} strokeOpacity={0.15} />
                      <XAxis dataKey="day" tickFormatter={(v) => shortDay(String(v))} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => shortDay(String(v))} />} />
                      <Area dataKey="visitors" type="monotone" stroke="var(--color-visitors)" fill="var(--color-visitors)" fillOpacity={0.2} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </BlockView>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Pages les plus vues</h3>
                  <BlockView block={data.site.pages}>
                    {(rows) => (
                      <Table
                        head={["Page", "Vues", "Visiteurs"]}
                        rows={rows.map((r) => [String(r.path || "(inconnue)"), n(r.pageviews), n(r.visitors)])}
                        empty="Aucune page vue sur la période."
                      />
                    )}
                  </BlockView>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">D'où viennent les visites</h3>
                  <BlockView block={data.site.sources}>
                    {(rows) => (
                      <Table
                        head={["Origine", "Visites"]}
                        rows={rows.map((r) => [SOURCE_NAMES[String(r.source)] ?? String(r.source || "(inconnue)"), n(r.sessions)])}
                        empty="Aucune visite sur la période."
                      />
                    )}
                  </BlockView>
                  <h3 className="font-semibold pt-2">Campagnes (liens avec utm_source)</h3>
                  <BlockView block={data.site.campaigns}>
                    {(rows) => (
                      <Table
                        head={["Campagne", "Visites"]}
                        rows={rows.map((r) => [String(r.campaign), n(r.sessions)])}
                        empty="Aucune visite venue d'un lien de campagne."
                      />
                    )}
                  </BlockView>
                </div>
              </div>
            </Panel>

            <Panel
              title="Parcours par offre"
              note="Nombre de personnes à chaque étape (PostHog), puis ventes et demandes confirmées en base. Les deux sources ne couvrent pas les mêmes visiteurs : ne pas en tirer de taux de conversion."
            >
              <Table
                head={["Offre", ...STEPS.map((s) => s.label), "Demandes (base)", "Ventes (base)"]}
                rows={OFFERS.map((o) => [
                  o.name,
                  ...STEPS.map((s) => funnelCell(o.id, s.id)),
                  applicationsOf(o.id) === null ? "—" : n(applicationsOf(o.id)),
                  salesOf(o.id),
                ])}
                empty=""
              />
            </Panel>

            <Panel
              title="Points de blocage"
              note="Où les visiteurs abandonnent : dernier champ touché avant de quitter un formulaire, erreurs affichées, retours depuis la page de paiement sans payer. Les enregistrements de sessions et cartes de chaleur se consultent dans PostHog."
            >
              <BlockView block={data.site.friction}>
                {(rows) => (
                  <Table
                    head={["Blocage", "Offre", "Détail", "Fois", "Personnes"]}
                    rows={rows.map((r) => [
                      FRICTION_NAMES[String(r.event)] ?? String(r.event),
                      OFFER_NAMES[String(r.offer)] ?? String(r.offer || "—"),
                      String(r.detail || "—"),
                      n(r.events),
                      n(r.people),
                    ])}
                    empty="Aucun blocage relevé sur la période."
                  />
                )}
              </BlockView>
            </Panel>

            <Panel title="Articles et ressources" note="Lectures et clics vers une offre depuis chaque article.">
              <BlockView block={data.site.articles}>
                {(rows) => (
                  <Table
                    head={["Article", "Lectures", "Lecteurs", "Clics vers une offre"]}
                    rows={rows.map((r) => [String(r.slug), n(r.views), n(r.readers), n(r.clicks)])}
                    empty="Aucune lecture d'article sur la période."
                  />
                )}
              </BlockView>
            </Panel>

            {data.site_fetched_at && (
              <p className="text-xs text-cream/60">
                Données PostHog lues le {new Date(data.site_fetched_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.
              </p>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
