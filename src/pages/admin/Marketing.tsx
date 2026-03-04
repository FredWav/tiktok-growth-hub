import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  date: string;
  name: string;
  offer: string;
  source: string | null;
  follower_since: string | null;
  current_revenue: string | null;
  posthog_id: string | null;
}

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

  // Leads data
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const [appsRes, diagRes] = await Promise.all([
        supabase.from("wav_premium_applications" as any).select("created_at, first_name, last_name, origin_source, follower_since, current_revenue, posthog_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("diagnostic_leads" as any).select("created_at, first_name, last_name, origin_source, follower_since, posthog_id").eq("completed", true).order("created_at", { ascending: false }).limit(50),
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

      return [...apps, ...diags].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{leads.length}</p>
                  <p className="text-xs text-cream/60">Leads totaux</p>
                </div>
                <div className="bg-noir rounded-lg p-4 border border-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{leads.filter((l) => l.source).length}</p>
                  <p className="text-xs text-cream/60">Avec source</p>
                </div>
              </div>
              {(() => {
                const sources = leads.filter((l) => l.source).reduce((acc, l) => {
                  const s = l.source!;
                  acc[s] = (acc[s] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                const top = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 5);
                if (!top.length) return null;
                return (
                  <div>
                    <p className="text-sm font-medium text-cream/70 mb-2">Top sources</p>
                    <div className="space-y-1">
                      {top.map(([s, c]) => (
                        <div key={s} className="flex justify-between text-sm">
                          <span className="text-cream/80">{s}</span>
                          <Badge variant="secondary">{c}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

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
