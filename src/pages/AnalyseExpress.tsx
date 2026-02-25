import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, BarChart3, FileText, TrendingUp, Search } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const features = [
  { icon: BarChart3, title: "Health Score", description: "Score de santé global de ton compte sur 100" },
  { icon: TrendingUp, title: "Métriques clés", description: "Engagement, croissance, fréquence de publication" },
  { icon: Search, title: "Analyse de persona", description: "Identification de ton audience et positionnement" },
  { icon: FileText, title: "Rapport PDF", description: "Télécharge ton rapport complet en PDF" },
];

export default function AnalyseExpress() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing session
  const existingSessionId = localStorage.getItem("express_session_id");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean.length < 2) {
      toast.error("Entre un nom d'utilisateur TikTok valide");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-express-checkout", {
        body: { username: clean },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Erreur lors de la création du paiement");
      }

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Analyse Express TikTok – Diagnostic complet en 5 minutes | FredWav"
        description="Obtiens un diagnostic complet de ton compte TikTok : health score, métriques, persona et recommandations. Rapport PDF téléchargeable pour 11,90€."
        path="/analyse-express"
      />

      {/* Hero */}
      <Section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Résultats en moins de 2 minutes
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Analyse Express{" "}
            <span className="text-gold-gradient">TikTok</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Entre ton @ TikTok, paye 11,90€, et reçois un diagnostic complet de ton compte avec un rapport PDF téléchargeable.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
              <Input
                type="text"
                placeholder="ton_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8 h-12 text-base"
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Redirection..." : "Lancer l'analyse (11,90€)"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation
            </p>
          </form>

          {existingSessionId && (
            <button
              onClick={() => navigate(`/analyse-express/result?session_id=${existingSessionId}`)}
              className="mt-4 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Retrouver mon analyse précédente
            </button>
          )}
        </div>
      </Section>

      {/* Features */}
      <Section className="pb-20">
        <SectionHeader
          title="Ce que tu obtiens"
          subtitle="Un diagnostic complet de ton compte TikTok, généré automatiquement"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </Section>
    </Layout>
  );
}
