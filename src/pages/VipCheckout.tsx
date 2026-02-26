import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown, Check, PartyPopper, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/tracking";
import { identifyUser } from "@/lib/posthog";
import { SEOHead } from "@/components/SEOHead";
import { stripePrices } from "@/config/stripe-prices";

const DISCORD_INVITE_URL = "https://discord.gg/KUgFunVhKY";

const VIP_PLANS = [
  { months: 3, priceId: stripePrices.vip_3_months, total: 297, monthly: 99, savings: null, label: "3 mois" },
  { months: 6, priceId: stripePrices.vip_6_months, total: 495, monthly: 82.5, savings: "1 mois offert", label: "6 mois" },
  { months: 12, priceId: stripePrices.vip_12_months, total: 891, monthly: 74.25, savings: "3 mois offerts", label: "12 mois", featured: true },
];

const VIP_BENEFITS = [
  "1 live par semaine en petit comité avec les membres VIP",
  "Feedback sur tes hooks, scripts et positionnement",
  "Éducation avancée : hook engineering, CTA stratégique, lecture analytique des stats",
  "Ressources nombreuses et régulièrement mises à jour",
  "Réponses et feedback 5/7 sur le serveur Discord",
  "Environnement exigeant orienté performance",
];

function VipSuccessView() {
  return (
    <Layout>
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Bienvenue dans le club VIP ! 🎉
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Ton paiement a bien été confirmé. Rejoins le serveur Discord via le lien ci-dessous pour obtenir ton accès VIP.
          </p>

          <div className="bg-muted/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">Ce qui t'attend</h3>
            <ul className="space-y-3">
              {VIP_BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button variant="hero" size="xl" className="w-full mb-4" asChild>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
              Rejoindre le serveur Discord
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>

          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </Section>
    </Layout>
  );
}

function VipCheckoutForm() {
  const [selectedPlan, setSelectedPlan] = useState(2);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const plan = VIP_PLANS[selectedPlan];

  // Pre-fill email if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    });
  }, []);

  const handlePayment = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: "Email requis", description: "Entre ton email pour continuer.", variant: "destructive" });
      return;
    }

    setLoading(true);
    trackEvent("vip_checkout_start", { plan: plan.label });
    identifyUser(email);

    try {
      const { data, error } = await supabase.functions.invoke("create-vip-checkout", {
        body: { priceId: plan.priceId, durationMonths: plan.months, email },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead title="VIP - Accompagnement Continu | Fred Wav" description="Rejoins le hub VIP : lives hebdo, feedback Discord 5/7, ressources exclusives. À partir de 99€/mois." path="/offres/vip" keywords="vip formats courts, accompagnement continu, discord créateurs, lives hebdo, feedback créateur" schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "VIP - Accompagnement Continu",
        "description": "Accompagnement continu avec lives hebdomadaires, feedback Discord 5/7, ressources exclusives. Environnement structuré orienté performance.",
        "provider": { "@type": "Person", "name": "Fred Wav", "url": "https://fredwav.com" },
        "offers": { "@type": "AggregateOffer", "lowPrice": "74.25", "highPrice": "99", "priceCurrency": "EUR", "offerCount": "3" },
      }} />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <Link to="/offres#vip" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour aux offres
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10"><Crown className="h-6 w-6 text-primary" /></div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold">VIP</h1>
              <p className="text-muted-foreground">Le hub stratégique des créateurs ambitieux</p>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl p-5 mb-8">
            <p className="text-base font-medium mb-1">Ce n'est pas un serveur motivation. Ce n'est pas un groupe d'entraide flou.</p>
            <p className="text-sm text-muted-foreground">C'est un environnement structuré, orienté performance - pour les créateurs qui veulent <strong className="text-foreground">réfléchir comme des stratèges, pas comme des amateurs</strong>.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {VIP_PLANS.map((p, i) => {
              const isFeatured = (p as any).featured;
              return (
                <button key={p.months} onClick={() => { setSelectedPlan(i); trackEvent("vip_plan_select", { plan: p.label }); }} className={`relative rounded-xl p-4 text-center border-2 transition-all ${isFeatured ? "scale-105 z-10" : ""} ${selectedPlan === i ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30" : isFeatured ? "border-primary/40 bg-primary/5 hover:border-primary" : "border-border bg-background hover:border-primary/50"}`}>
                  {p.savings && <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${isFeatured ? "bg-primary text-primary-foreground px-3 py-1 text-sm shadow-lg" : "bg-primary text-primary-foreground"}`}>{p.savings}</span>}
                  <div className="font-semibold text-lg">{p.label}</div>
                  <div className="text-2xl font-bold mt-1">{p.total}€</div>
                  <div className="text-xs text-muted-foreground">soit {p.monthly.toFixed(p.monthly % 1 === 0 ? 0 : 1)}€/mois</div>
                </button>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Ce qui est inclus</h3>
            <ul className="space-y-3">
              {VIP_BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Email field - no login required */}
          <div className="mb-6">
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Ton email pour recevoir l'accès
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Button variant="hero" size="xl" className="w-full" onClick={handlePayment} disabled={loading || !email}>
            {loading ? "Redirection..." : `Rejoindre le VIP - ${plan.total}€ (${plan.label})`}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">Paiement sécurisé via Stripe. Tu seras redirigé vers la page de paiement.</p>
          <p className="text-xs text-center text-muted-foreground mt-1">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
        </div>
      </Section>
    </Layout>
  );
}

export default function VipCheckout() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isSuccess = searchParams.get("success") === "true";
  const isCancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    if (isCancelled) {
      toast({ title: "Paiement annulé", description: "Tu peux réessayer quand tu veux." });
    }
  }, [isCancelled]);

  if (isSuccess) return <VipSuccessView />;
  return <VipCheckoutForm />;
}
