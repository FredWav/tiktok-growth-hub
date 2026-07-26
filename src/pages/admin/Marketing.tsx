import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, startOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, ExternalLink, TrendingUp, PieChart, BarChart3, Percent, DollarSign, Eye, Clock, Filter, Globe } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BUDGET_LABELS, ACADEMY_PLANS, EXPRESS_PRICE } from "@/config/offers";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart as RechartsPie, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar,
} from "recharts";

interface Lead {
  date: string;
  name: string;
  offer: string;
  source: string | null;
  follower_since: string | null;
  budget: string | null;
  posthog_id: string | null;
  email: string | null;
  /** Nombre de touchpoints de cette personne (dédup par email). */
  touchpoints?: number;
  /** Toutes les offres vues par cette personne (parcours multi-produits). */
  offers?: string[];
}

const budgetLabels: Record<string, string> = {
  // Grille actuelle — dérivée de config/offers.ts pour qu'aucune tranche ne
  // s'affiche jamais en code brut dans l'admin.
  ...BUDGET_LABELS,
  // Anciennes valeurs (candidatures historiques)
  "10_a_100": "De 10€ à 100€",
  "1000_plus": "1000€ et +",
};

const OFFER_PRIORITY: Record<string, number> = {
  "Wav Premium": 1,
  "Analyse Express": 2,
  "Diagnostic": 3,
};

const CHART_COLORS = [
  "hsl(43, 74%, 49%)",
  "hsl(43, 74%, 65%)",
  "hsl(43, 50%, 35%)",
  "hsl(30, 50%, 50%)",
  "hsl(43, 30%, 55%)",
];

// Étapes réelles du tunnel /start, alignées sur les current_step écrits par
// DiagnosticStart.saveLead : 1 Identité, 2 Niveau, 3 Objectif, 4 Budget, 5 Temps,
// 6 Email, puis `completed=true` au blocage final. Les anciens libellés étaient
// décalés (« Blocage » mesurait en fait Budget).
type DiagStep = { current_step?: number | null; completed?: boolean | null };
const FUNNEL_STEPS: { label: string; reached: (d: DiagStep) => boolean }[] = [
  { label: "Démarré", reached: () => true },
  { label: "Identité", reached: (d) => d.current_step >= 1 },
  { label: "Niveau", reached: (d) => d.current_step >= 2 },
  { label: "Objectif", reached: (d) => d.current_step >= 3 },
  { label: "Budget", reached: (d) => d.current_step >= 4 },
  { label: "Temps", reached: (d) => d.current_step >= 5 },
  { label: "Email", reached: (d) => d.current_step >= 6 },
  { label: "Complété", reached: (d) => d.completed === true },
];

// Prix Academy par durée d'accès (access_months), pour dériver le CA.
const ACADEMY_PRICE_BY_MONTHS: Record<number, number> = Object.fromEntries(
  ACADEMY_PLANS.map((p) => [p.months, p.total]),
);

export default function AdminMarketing() {
  // UTM Generator state
  const [url, setUrl] = useState("https://fredwav.com");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    try {
      const u = new URL(url);
      if (source) u.searchParams.set("utm_source", source);
      if (medium) u.searchParams.set("utm_medium", medium);
      if (campaign) u.searchParams.set("utm_campaign", campaign);
      return u.toString();
    } catch {
      return url;
    }
  }, [url, source, medium, campaign]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- Page views data ----
  const { data: pageViews = [] } = useQuery({
    queryKey: ["page-views-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("page_views" as any)
        .select("*")
        .gte("entered_at", thirtyDaysAgo)
        .order("entered_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // ---- Diagnostic funnel data ----
  const { data: diagnosticLeads = [] } = useQuery({
    queryKey: ["diagnostic-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_leads" as any)
        .select("current_step, completed")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // ---- Top pages ----
  // Durée moyenne calculée seulement sur les vues avec durée > 0 (cohérent avec le KPI global),
  // sinon les vues « just arrived » à 0 s tirent la moyenne vers le bas.
  const topPages = useMemo(() => {
    const grouped: Record<string, { views: number; totalDuration: number; durationCount: number }> = {};
    pageViews.forEach((pv: any) => {
      const path = pv.path || "/";
      if (!grouped[path]) grouped[path] = { views: 0, totalDuration: 0, durationCount: 0 };
      grouped[path].views++;
      if (pv.duration_seconds > 0) {
        grouped[path].totalDuration += pv.duration_seconds;
        grouped[path].durationCount++;
      }
    });
    return Object.entries(grouped)
      .map(([path, { views, totalDuration, durationCount }]) => ({
        path,
        views,
        avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [pageViews]);

  // ---- Visit sources (from page_views) ----
  // Comptées en VISITEURS uniques par source (visitor_id distinct), pas en pages vues :
  // un visiteur qui voit 5 pages ne doit compter qu'une fois. Fallback compteur brut
  // pour les rares lignes sans visitor_id.
  const visitSources = useMemo(() => {
    const bySource: Record<string, Set<string>> = {};
    const anon: Record<string, number> = {};
    pageViews.forEach((pv: any) => {
      let src = pv.utm_source || "";
      if (!src && pv.referrer) {
        try {
          src = new URL(pv.referrer).hostname;
        } catch {
          src = pv.referrer;
        }
      }
      if (!src) src = "Direct";
      if (pv.visitor_id) {
        (bySource[src] ??= new Set<string>()).add(pv.visitor_id);
      } else {
        anon[src] = (anon[src] || 0) + 1;
      }
    });
    const names = new Set([...Object.keys(bySource), ...Object.keys(anon)]);
    return [...names]
      .map((name) => ({ name, value: (bySource[name]?.size || 0) + (anon[name] || 0) }))
      .sort((a, b) => b.value - a.value);
  }, [pageViews]);

  // ---- Average duration KPI ----
  const avgDuration = useMemo(() => {
    const withDuration = pageViews.filter((pv: any) => pv.duration_seconds > 0);
    if (!withDuration.length) return 0;
    const total = withDuration.reduce((sum: number, pv: any) => sum + pv.duration_seconds, 0);
    return Math.round(total / withDuration.length);
  }, [pageViews]);

  // ---- Unique visitors ----
  const uniqueVisitors = useMemo(() => {
    const set = new Set(pageViews.map((pv: any) => pv.visitor_id).filter(Boolean));
    return set.size;
  }, [pageViews]);

  // ---- Funnel data ----
  const funnelData = useMemo(() => {
    const total = diagnosticLeads.length;
    if (!total) return [];

    return FUNNEL_STEPS.map(({ label, reached }) => {
      const count = diagnosticLeads.filter((d) => reached(d)).length;
      const rate = total > 0 ? Math.round((count / total) * 100) : 0;
      return { step: label, count, rate };
    });
  }, [diagnosticLeads]);

  // ---- UTM breakdown: source / medium / campaign ----
  const utmBreakdown = useMemo(() => {
    const aggregate = (key: "utm_source" | "utm_medium" | "utm_campaign") => {
      const grouped: Record<string, { views: number; visitors: Set<string>; totalDuration: number; durationCount: number }> = {};
      pageViews.forEach((pv: any) => {
        const val = pv[key];
        if (!val) return;
        if (!grouped[val]) grouped[val] = { views: 0, visitors: new Set(), totalDuration: 0, durationCount: 0 };
        grouped[val].views++;
        if (pv.visitor_id) grouped[val].visitors.add(pv.visitor_id);
        if (pv.duration_seconds > 0) {
          grouped[val].totalDuration += pv.duration_seconds;
          grouped[val].durationCount++;
        }
      });
      return Object.entries(grouped)
        .map(([name, { views, visitors, totalDuration, durationCount }]) => ({
          name,
          views,
          uniqueVisitors: visitors.size,
          avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
        }))
        .sort((a, b) => b.views - a.views);
    };
    return {
      sources: aggregate("utm_source"),
      mediums: aggregate("utm_medium"),
      campaigns: aggregate("utm_campaign"),
    };
  }, [pageViews]);

  // ---- CA du mois (dérivé de la base, à recouper avec Stripe) ----
  // Interim : la vérité financière doit venir de Stripe. En attendant, on additionne
  //  - bookings payés (legacy)
  //  - Academy : 1 abonnement actif créé ce mois = 1 achat, prix selon access_months
  //  - Express confirmés : lignes avec un stripe_session_id (exclut les lancements manuels admin)
  const { data: revenue = { total: 0, bookings: 0, academy: 0, express: 0 } } = useQuery({
    queryKey: ["marketing-real-revenue"],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date()).toISOString();
      const [bookingsRes, academyRes, expressRes] = await Promise.all([
        supabase.from("bookings").select("amount_cents").eq("payment_status", "paid").gte("paid_at", monthStart),
        supabase.from("wavacademy_subscriptions" as any).select("access_months").eq("status", "active").gte("created_at", monthStart),
        supabase.from("express_analyses").select("id", { count: "exact", head: true }).not("stripe_session_id", "is", null).gte("created_at", monthStart),
      ]);
      const bookings = ((bookingsRes.data as unknown as { amount_cents: number | null }[]) || []).reduce((s, b) => s + (b.amount_cents || 0), 0) / 100;
      const academy = ((academyRes.data as unknown as { access_months: number | null }[]) || []).reduce((s, r) => s + (ACADEMY_PRICE_BY_MONTHS[r.access_months ?? 0] || 0), 0);
      const express = (expressRes.count || 0) * EXPRESS_PRICE;
      return { total: bookings + academy + express, bookings, academy, express };
    },
  });

  // ---- Existing leads query ----
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const [appsRes, diagRes, expressRes] = await Promise.all([
        supabase.from("wav_premium_applications" as any).select("created_at, first_name, last_name, email, origin_source, follower_since, budget, posthog_id").order("created_at", { ascending: false }).limit(2000),
        supabase.from("diagnostic_leads" as any).select("created_at, first_name, last_name, email, origin_source, follower_since, posthog_id").eq("completed", true).order("created_at", { ascending: false }).limit(2000),
        supabase.from("express_analyses").select("created_at, tiktok_username, email, status").order("created_at", { ascending: false }).limit(2000),
      ]);

      const apps: Lead[] = ((appsRes.data as any[]) || []).map((a: any) => ({
        date: a.created_at, name: `${a.first_name} ${a.last_name}`, offer: "Wav Premium",
        source: a.origin_source, follower_since: a.follower_since, budget: a.budget,
        posthog_id: a.posthog_id, email: a.email || null,
      }));
      const diags: Lead[] = ((diagRes.data as any[]) || []).map((d: any) => ({
        date: d.created_at, name: [d.first_name, d.last_name].filter(Boolean).join(" ") || "-",
        offer: "Diagnostic", source: d.origin_source, follower_since: d.follower_since,
        budget: null, posthog_id: d.posthog_id, email: d.email || null,
      }));
      const express: Lead[] = ((expressRes.data as any[]) || []).map((e: any) => ({
        date: e.created_at, name: e.tiktok_username || e.email || "-", offer: "Analyse Express",
        source: null, follower_since: null, budget: null, posthog_id: null, email: e.email || null,
      }));

      const allLeads = [...apps, ...diags, ...express];
      const byEmail = new Map<string, Lead>();
      const noEmail: Lead[] = [];
      for (const lead of allLeads) {
        if (!lead.email) { noEmail.push({ ...lead, touchpoints: 1 }); continue; }
        const key = lead.email.toLowerCase().trim();
        const existing = byEmail.get(key);
        if (!existing) {
          // Personne unique : on garde l'offre la plus haute mais on compte les parcours
          // et on mémorise les offres vues, pour ne plus masquer les parcours multi-produits.
          byEmail.set(key, { ...lead, touchpoints: 1, offers: [lead.offer] });
        } else {
          const offers = existing.offers?.includes(lead.offer) ? existing.offers : [...(existing.offers ?? []), lead.offer];
          const keepLead = (OFFER_PRIORITY[lead.offer] ?? 99) < (OFFER_PRIORITY[existing.offer] ?? 99) ? lead : existing;
          byEmail.set(key, { ...keepLead, touchpoints: (existing.touchpoints ?? 1) + 1, offers });
        }
      }
      return [...byEmail.values(), ...noEmail].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  // ---- Computed analytics (existing) ----
  const lineData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 29);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const counts: Record<string, number> = {};
    days.forEach((d) => { counts[format(d, "yyyy-MM-dd")] = 0; });
    leads.forEach((l) => {
      const key = format(new Date(l.date), "yyyy-MM-dd");
      if (counts[key] !== undefined) counts[key]++;
    });
    return days.map((d) => ({
      date: format(d, "dd/MM", { locale: fr }),
      leads: counts[format(d, "yyyy-MM-dd")] || 0,
    }));
  }, [leads]);

  const donutData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const s = l.source || "Non tracké";
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    return Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const barData = useMemo(() => {
    const offerCounts: Record<string, number> = {};
    leads.forEach((l) => { offerCounts[l.offer] = (offerCounts[l.offer] || 0) + 1; });
    return Object.entries(offerCounts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const trackingRate = useMemo(() => {
    if (!leads.length) return 0;
    return Math.round((leads.filter((l) => l.source).length / leads.length) * 100);
  }, [leads]);

  // pipelineValue removed - now using monthlyRevenue from bookings query

  const lineChartConfig = { leads: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const barChartConfig = { value: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const donutChartConfig = { value: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const funnelChartConfig = { count: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const visitSourceChartConfig = { value: { label: "Visites", color: "hsl(43, 74%, 49%)" } };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m${secs > 0 ? ` ${secs}s` : ""}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-primary">Marketing</h1>

        {/* ===== NEW: Analytics KPIs ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-noir-light border-primary/20">
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{pageViews.length}</p>
              <p className="text-xs text-cream/60">Pages vues (30j)</p>
            </CardContent>
          </Card>
          <Card className="bg-noir-light border-primary/20">
            <CardContent className="p-4 text-center">
              <Globe className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{uniqueVisitors}</p>
              <p className="text-xs text-cream/60">Visiteurs uniques</p>
            </CardContent>
          </Card>
          <Card className="bg-noir-light border-primary/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{formatDuration(avgDuration)}</p>
              <p className="text-xs text-cream/60">Durée moy. / page</p>
            </CardContent>
          </Card>
          <Card className="bg-noir-light border-primary/20">
            <CardContent className="p-4 text-center">
              <Filter className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{diagnosticLeads.length}</p>
              <p className="text-xs text-cream/60">Diagnostics démarrés</p>
            </CardContent>
          </Card>
        </div>

        {/* ===== NEW: Funnel diagnostic + Visit sources ===== */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Funnel diagnostic */}
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Funnel diagnostic
              </CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <div className="space-y-2">
                  {funnelData.map((step, i) => (
                    <div key={step.step} className="flex items-center gap-3">
                      <span className="text-cream/70 text-sm w-20 shrink-0 truncate">{step.step}</span>
                      <div className="flex-1 bg-noir rounded-full h-6 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${step.rate}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                            minWidth: step.count > 0 ? "2rem" : "0",
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-cream">
                          {step.count} ({step.rate}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cream/40 text-sm text-center py-8">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Visit sources (from page_views) */}
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Sources de visites (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitSources.length > 0 ? (
                <>
                  <ChartContainer config={visitSourceChartConfig} className="h-[200px] w-full">
                    <RechartsPie>
                      <Pie
                        data={visitSources.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {visitSources.slice(0, 6).map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    </RechartsPie>
                  </ChartContainer>
                  <div className="space-y-1.5 mt-3">
                    {visitSources.slice(0, 6).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-cream/70 truncate max-w-[140px]">{d.name}</span>
                        </div>
                        <span className="text-cream font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-cream/40 text-sm text-center py-8">Les données s'accumuleront après déploiement</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== NEW: Top pages ===== */}
        <Card className="bg-noir-light border-primary/20">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Pages les plus visitées (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20">
                    <TableHead className="text-cream/70">Page</TableHead>
                    <TableHead className="text-cream/70 text-right">Vues</TableHead>
                    <TableHead className="text-cream/70 text-right">Durée moy.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map((p) => (
                    <TableRow key={p.path} className="border-primary/10">
                      <TableCell className="text-cream font-mono text-sm">{p.path}</TableCell>
                      <TableCell className="text-cream/80 text-right">{p.views}</TableCell>
                      <TableCell className="text-cream/80 text-right">{formatDuration(p.avgDuration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-cream/40 text-sm text-center py-8">Les données s'accumuleront après déploiement</p>
            )}
          </CardContent>
        </Card>

        {/* ===== NEW: UTM Breakdown (Sources / Médias / Campagnes) ===== */}
        {(utmBreakdown.sources.length > 0 || utmBreakdown.mediums.length > 0 || utmBreakdown.campaigns.length > 0) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { title: "Sources UTM", data: utmBreakdown.sources },
              { title: "Médias UTM", data: utmBreakdown.mediums },
              { title: "Campagnes UTM", data: utmBreakdown.campaigns },
            ].map(({ title, data }) => (
              <Card key={title} className="bg-noir-light border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-cream text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-primary/20">
                          <TableHead className="text-cream/70 text-xs">Nom</TableHead>
                          <TableHead className="text-cream/70 text-xs text-right">Vues</TableHead>
                          <TableHead className="text-cream/70 text-xs text-right">Uniques</TableHead>
                          <TableHead className="text-cream/70 text-xs text-right">Durée</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 8).map((row) => (
                          <TableRow key={row.name} className="border-primary/10">
                            <TableCell className="text-cream text-sm font-medium truncate max-w-[120px]">{row.name}</TableCell>
                            <TableCell className="text-cream/80 text-sm text-right">{row.views}</TableCell>
                            <TableCell className="text-cream/80 text-sm text-right">{row.uniqueVisitors}</TableCell>
                            <TableCell className="text-cream/80 text-sm text-right">{formatDuration(row.avgDuration)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-cream/40 text-sm text-center py-4">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== EXISTING: UTM + Summary ===== */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream">Générateur UTM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-cream/70">Page de destination</Label>
                <select
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex h-10 w-full rounded-md border bg-noir border-primary/20 text-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="https://fredwav.com">Accueil</option>
                  <option value="https://fredwav.com/start">Diagnostic (/start)</option>
                  <option value="https://fredwav.com/analyse-express">Analyse Express</option>
                  <option value="https://fredwav.com/reserverunappel">Réserver un appel</option>
                  <option value="https://fredwav.com/wavacademy">Wav Academy</option>
                  <option value="https://fredwav.com/preuves">Témoignages</option>
                  <option value="https://fredwav.com/a-propos">À Propos</option>
                  <option value="https://fredwav.com/contact">Contact</option>
                  <option value="https://fredwav.com/newsletter">Newsletter</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-cream/70">Source</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="tiktok" className="bg-noir border-primary/20 text-cream" />
                </div>
                <div>
                  <Label className="text-cream/70">Medium</Label>
                  <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="social" className="bg-noir border-primary/20 text-cream" />
                </div>
                <div>
                  <Label className="text-cream/70">Campagne</Label>
                  <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="launch-q1" className="bg-noir border-primary/20 text-cream" />
                </div>
              </div>
              <div className="bg-noir rounded-lg p-3 border border-primary/10">
                <p className="text-xs text-cream/50 mb-1">Lien généré</p>
                <p className="text-sm text-cream break-all font-mono">{generatedUrl}</p>
              </div>
              <Button onClick={handleCopy} className="w-full" variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copié !" : "Copier le lien"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream">Résumé leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{leads.length}</p>
                  <p className="text-xs text-cream/60">Leads totaux</p>
                </div>
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{leads.filter((l) => l.source).length}</p>
                  <p className="text-xs text-cream/60">Avec source</p>
                </div>
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Percent className="h-4 w-4 text-primary" />
                    <p className="text-2xl font-bold text-primary">{trackingRate}%</p>
                  </div>
                  <p className="text-xs text-cream/60">Taux de tracking</p>
                </div>
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="text-2xl font-bold text-primary">{revenue.total > 0 ? `${revenue.total.toLocaleString("fr-FR")} €` : "-"}</p>
                  </div>
                  <p className="text-xs text-cream/60">CA du mois (à recouper Stripe)</p>
                  {revenue.total > 0 && (
                    <p className="text-[10px] text-cream/40 mt-1">
                      Academy {revenue.academy.toLocaleString("fr-FR")} € · Express {revenue.express.toLocaleString("fr-FR")} € · Bookings {revenue.bookings.toLocaleString("fr-FR")} €
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== EXISTING: Charts ===== */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-noir-light border-primary/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-cream flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Évolution de l'acquisition (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(43, 74%, 49% / 0.1)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="leads" stroke="hsl(43, 74%, 49%)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "hsl(43, 74%, 49%)" }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Sources (leads)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center">
                {donutData.length > 0 ? (
                  <ChartContainer config={donutChartConfig} className="h-[280px] w-full">
                    <RechartsPie>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                        {donutData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    </RechartsPie>
                  </ChartContainer>
                ) : (
                  <p className="text-cream/40 text-sm">Aucune donnée</p>
                )}
              </div>
              {donutData.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {donutData.slice(0, 5).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-cream/70 truncate max-w-[120px]">{d.name}</span>
                      </div>
                      <span className="text-cream font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-noir-light border-primary/20">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Répartition par offre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[250px] w-full">
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(43, 74%, 49% / 0.1)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(43, 74%, 49%)" radius={[6, 6, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ===== EXISTING: Leads table ===== */}
        <Card className="bg-noir-light border-primary/20">
          <CardHeader>
            <CardTitle className="text-cream">Derniers leads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-cream/60 text-center py-8">Chargement…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20">
                      <TableHead className="text-cream/70">Date</TableHead>
                      <TableHead className="text-cream/70">Nom</TableHead>
                      <TableHead className="text-cream/70">Offre</TableHead>
                      <TableHead className="text-cream/70">Source</TableHead>
                      <TableHead className="text-cream/70">Follower depuis</TableHead>
                      <TableHead className="text-cream/70">Budget</TableHead>
                      <TableHead className="text-cream/70">PostHog</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, i) => (
                      <TableRow key={i} className="border-primary/10">
                        <TableCell className="text-cream/80 text-sm">
                          {format(new Date(lead.date), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-cream font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              lead.offer === "Wav Premium"
                                ? "bg-primary/20 text-primary border-primary/30"
                                : lead.offer === "Analyse Express"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-violet-500/20 text-violet-400 border-violet-500/30"
                            }
                          >
                            {lead.offer}
                          </Badge>
                          {lead.touchpoints && lead.touchpoints > 1 && (
                            <span
                              className="ml-1.5 text-[10px] text-cream/50"
                              title={`Parcours multi-produits : ${lead.offers?.join(" → ") ?? ""}`}
                            >
                              +{lead.touchpoints - 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.source || "-"}</TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.follower_since || "-"}</TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.budget ? (budgetLabels[lead.budget] ?? lead.budget) : "-"}</TableCell>
                        <TableCell>
                          {lead.posthog_id ? (
                            <a
                              href={`https://us.posthog.com/person/${lead.posthog_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                            >
                              Voir <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-cream/40 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {leads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-cream/50 py-8">
                          Aucun lead pour le moment
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
