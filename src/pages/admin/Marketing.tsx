import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, ExternalLink, TrendingUp, PieChart, BarChart3, Percent, DollarSign } from "lucide-react";
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
  current_revenue: string | null;
  posthog_id: string | null;
}

const CHART_COLORS = [
  "hsl(43, 74%, 49%)",   // primary / gold
  "hsl(43, 74%, 65%)",   // lighter gold
  "hsl(43, 50%, 35%)",   // darker gold
  "hsl(30, 50%, 50%)",   // warm amber
  "hsl(43, 30%, 55%)",   // muted gold
];

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

  // Leads data — fetch all three sources
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const [appsRes, diagRes, oneshotRes] = await Promise.all([
        supabase.from("wav_premium_applications" as any).select("created_at, first_name, last_name, origin_source, follower_since, current_revenue, posthog_id").order("created_at", { ascending: false }).limit(200),
        supabase.from("diagnostic_leads" as any).select("created_at, first_name, last_name, origin_source, follower_since, posthog_id").eq("completed", true).order("created_at", { ascending: false }).limit(200),
        supabase.from("oneshot_submissions" as any).select("created_at, name, origin_source, posthog_id").order("created_at", { ascending: false }).limit(200),
      ]);

      const apps: Lead[] = ((appsRes.data as any[]) || []).map((a: any) => ({
        date: a.created_at,
        name: `${a.first_name} ${a.last_name}`,
        offer: "Wav Premium",
        source: a.origin_source,
        follower_since: a.follower_since,
        current_revenue: a.current_revenue,
        posthog_id: a.posthog_id,
      }));

      const diags: Lead[] = ((diagRes.data as any[]) || []).map((d: any) => ({
        date: d.created_at,
        name: [d.first_name, d.last_name].filter(Boolean).join(" ") || "—",
        offer: "Diagnostic",
        source: d.origin_source,
        follower_since: d.follower_since,
        current_revenue: null,
        posthog_id: d.posthog_id,
      }));

      const oneshots: Lead[] = ((oneshotRes.data as any[]) || []).map((o: any) => ({
        date: o.created_at,
        name: o.name || "—",
        offer: "One Shot",
        source: o.origin_source,
        follower_since: null,
        current_revenue: null,
        posthog_id: o.posthog_id,
      }));

      return [...apps, ...diags, ...oneshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  // ---- Computed analytics ----

  // 1. Line chart: leads over last 30 days
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

  // 2. Donut chart: source distribution
  const donutData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const s = l.source || "Non tracké";
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    return Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  // 3. Bar chart: by offer
  const barData = useMemo(() => {
    const offerCounts: Record<string, number> = {};
    leads.forEach((l) => {
      offerCounts[l.offer] = (offerCounts[l.offer] || 0) + 1;
    });
    return Object.entries(offerCounts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // KPIs
  const trackingRate = useMemo(() => {
    if (!leads.length) return 0;
    return Math.round((leads.filter((l) => l.source).length / leads.length) * 100);
  }, [leads]);

  const pipelineValue = useMemo(() => {
    let total = 0;
    leads.forEach((l) => {
      if (l.current_revenue) {
        const num = parseInt(l.current_revenue.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num)) total += num;
      }
    });
    return total;
  }, [leads]);

  const lineChartConfig = { leads: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const barChartConfig = { value: { label: "Leads", color: "hsl(43, 74%, 49%)" } };
  const donutChartConfig = { value: { label: "Leads", color: "hsl(43, 74%, 49%)" } };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-primary">Marketing</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* UTM Generator */}
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream">Générateur UTM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-cream/70">URL de destination</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} className="bg-noir border-primary/20 text-cream" />
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

          {/* Stats summary */}
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream">Résumé</CardTitle>
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
                    <p className="text-2xl font-bold text-primary">{pipelineValue > 0 ? `${pipelineValue.toLocaleString("fr-FR")} €` : "—"}</p>
                  </div>
                  <p className="text-xs text-cream/60">Pipeline estimé (CA déclaré)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart — Acquisition over time */}
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
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(43, 74%, 49%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "hsl(43, 74%, 49%)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Donut Chart — Source distribution */}
          <Card className="bg-noir-light border-primary/20">
            <CardHeader>
              <CardTitle className="text-cream flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center">
                {donutData.length > 0 ? (
                  <ChartContainer config={donutChartConfig} className="h-[280px] w-full">
                    <RechartsPie>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
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

        {/* Bar Chart — By offer */}
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
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(45, 30%, 80% / 0.6)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="hsl(43, 74%, 49%)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Leads table */}
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
                      <TableHead className="text-cream/70">CA actuel</TableHead>
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
                          <Badge variant={lead.offer === "Wav Premium" ? "default" : "secondary"}>
                            {lead.offer}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.source || "—"}</TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.follower_since || "—"}</TableCell>
                        <TableCell className="text-cream/70 text-sm">{lead.current_revenue || "—"}</TableCell>
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
                            <span className="text-cream/40 text-sm">—</span>
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
