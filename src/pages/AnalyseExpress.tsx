import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, BarChart3, FileText, TrendingUp, Search } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { trackPostHogEvent } from "@/lib/posthog";
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tiktokExample from "@/assets/tiktok-username-example.png";

const features = [
  { icon: BarChart3, title: "Health Score", description: "Score de santé global de ton compte sur 100" },
  { icon: TrendingUp, title: "Métriques clés", description: "Engagement, croissance, fréquence de publication" },
  { icon: Search, title: "Analyse de persona", description: "Identification de ton audience et positionnement" },
  { icon: FileText, title: "Rapport PDF", description: "Télécharge ton rapport complet en PDF" },
];

export default function AnalyseExpress() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const existingSessionId = localStorage.getItem("express_session_id");

  const cleanUsername = username.trim().replace(/^@/, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanUsername.length < 2) {
      toast.error("Entre un nom d'utilisateur valide");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Entre une adresse email valide");
      return;
    }
    trackPostHogEvent("click_analyse_express_submit", { username: cleanUsername });
    setShowConfirmModal(true);
  };

  const proceedToPayment = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    trackEvent("express_checkout_start", { username: cleanUsername });
    try {
      const { data, error } = await supabase.functions.invoke("create-express-checkout", {
        body: { username: cleanUsername, email: email.trim() },
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

  const handleGoBack = () => {
    setShowConfirmModal(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Layout>
      <SEOHead
        title="Analyse Express – Diagnostic complet en 5 minutes | FredWav"
        description="Obtiens un diagnostic complet de ton compte : health score, métriques, persona et recommandations. Rapport PDF téléchargeable pour 11,90€."
        path="/analyse-express"
        keywords="analyse compte, diagnostic réseaux sociaux, health score, rapport compte, audit compte, métriques"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Analyse Express",
          "description": "Diagnostic complet de ton compte avec health score, métriques clés, analyse de persona et rapport PDF téléchargeable.",
          "offers": {
            "@type": "Offer",
            "price": "11.90",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
          },
        }}
      />

      {/* Hero */}
      <Section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Résultats en moins de 2 minutes
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            <span className="text-gold-gradient">Analyse Express</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
            Entre ton @ TikTok, paye 11,90€, et reçois un diagnostic complet de ton compte avec un rapport PDF téléchargeable.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10">
            Disponible uniquement pour TikTok pour le moment — d'autres plateformes arrivent bientôt.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
              <Input
                ref={inputRef}
                type="text"
                placeholder="ton_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8 h-12 text-base"
                disabled={loading}
              />
            </div>
            <Input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              disabled={loading}
              required
            />
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Redirection..." : "Lancer l'analyse (11,90€)"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation
            </p>
          </form>

          {existingSessionId && (
            <button
              onClick={() => {
                trackPostHogEvent("click_analyse_express_previous");
                navigate(`/analyse-express/result?session_id=${existingSessionId}`);
              }}
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

        {/* Mention Wav Social Scan */}
        <div className="max-w-2xl mx-auto mt-12 bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">
            Tu veux des analyses encore plus poussées et pouvoir analyser tes propres vidéos ?
            Rendez-vous sur{" "}
            <a
              href="https://www.wavsocialscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
            >
              Wav Social Scan
            </a>{" "}
            pour accéder à l'outil complet.
          </p>
        </div>
      </Section>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Vérifie ton nom d'utilisateur</DialogTitle>
            <DialogDescription>
              Attention, entre bien ton <strong>nom d'utilisateur</strong> (le @) et non ton pseudo affiché.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <img
              src={tiktokExample}
              alt="Où trouver le nom d'utilisateur TikTok"
              className="w-full rounded-lg border border-border"
            />

            <p className="text-center text-base">
              Tu as saisi : <span className="font-bold text-primary text-lg">@{cleanUsername}</span>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Email : <span className="font-medium text-foreground">{email.trim()}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={handleGoBack}>
                Ha je me suis trompé !
              </Button>
              <Button variant="hero" className="flex-1" onClick={proceedToPayment}>
                Je valide ✅
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
