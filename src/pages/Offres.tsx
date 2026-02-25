import { Link } from "react-router-dom";
import { ArrowRight, Check, Zap, Target, Crown, Clock, Users, TrendingUp } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";

const profileSelector = [
  { label: "Un diagnostic clair", target: "one-shot", icon: Zap },
  { label: "Une transformation encadrée", target: "wav-premium", icon: Target },
  { label: "Un cadre continu", target: "vip", icon: Crown },
];

const offers = [
  {
    id: "one-shot",
    icon: Zap,
    title: "One Shot",
    subtitle: "La clarté en 1h30",
    description: "Une session intensive pour repartir avec un diagnostic clair et des recommandations actionnables.",
    price: "179€",
    priceNote: "Paiement unique",
    duration: "1h30",
    forWho: [
      "Tu débutes sur TikTok et tu veux partir sur de bonnes bases",
      "Tu postes mais tu n'as pas de stratégie claire",
      "Tu veux un regard extérieur expert",
    ],
    notForWho: [
      "Tu cherches quelqu'un pour faire le travail à ta place",
      "Tu n'es pas prêt à appliquer les conseils",
    ],
    includes: [
      "Diagnostic complet de ton compte",
      "Analyse de ton marché et ta niche",
      "Recommandations personnalisées",
      "Ressources adaptées à ta situation",
      "Replay de la session",
    ],
    cta: "Réserver mon One Shot (179€)",
    href: "/one-shot",
    trackEvent: "cta_one_shot_click",
    variant: "hero" as const,
    recommended: true,
  },
  {
    id: "wav-premium",
    icon: Target,
    title: "Wav Premium",
    subtitle: "Transformation guidée",
    description: "45 jours pour transformer ta présence TikTok. Suivi hebdomadaire et accès direct.",
    price: "Sur candidature",
    priceNote: "Appel de qualification requis",
    duration: "45 jours",
    forWho: [
      "Tu veux des résultats rapides et mesurables",
      "Tu es prêt à t'investir sérieusement",
      "Tu veux un accompagnement personnalisé",
    ],
    notForWho: [
      "Tu n'as pas le temps de créer du contenu",
      "Tu cherches une solution miracle sans effort",
    ],
    includes: [
      "Onboarding complet avec stratégie sur mesure",
      "Appels hebdomadaires de suivi",
      "Review de tous tes contenus",
      "Accès messagerie prioritaire",
      "Templates et ressources exclusives",
      "Optimisation continue de ta stratégie",
    ],
    cta: "Candidater au Wav Premium",
    href: "/45-jours",
    trackEvent: "cta_45j_click",
    variant: "premium" as const,
    recommended: false,
  },
  {
    id: "vip",
    icon: Crown,
    title: "VIP",
    subtitle: "Progresser dans la durée",
    description: "L'environnement structuré et exigeant qui transforme un créateur motivé en créateur stratège. Pas un groupe motivation - un hub performance.",
    price: "99€/mois",
    priceNote: "3 mois minimum",
    duration: "3, 6 ou 12 mois",
    forWho: [
      "Tu es bloqué en croissance et tu ne comprends pas pourquoi",
      "Tu es débutant ambitieux et tu veux partir avec les bonnes bases",
      "Tu es intermédiaire et tu veux scaler proprement",
    ],
    notForWho: [
      "Tu cherches de la motivation sans passer à l'action",
      "Tu n'es pas prêt à remettre en question ta méthode",
    ],
    includes: [
      "1 live par semaine en petit comité avec les membres VIP",
      "Feedback sur tes hooks, scripts et positionnement",
      "Éducation avancée : hook engineering, CTA stratégique, lecture analytique des stats",
      "Ressources nombreuses et régulièrement mises à jour",
      "Réponses et feedback 5/7 sur le serveur Discord",
      "Environnement exigeant orienté performance",
    ],
    cta: "Rejoindre le VIP",
    href: "/offres/vip",
    trackEvent: "cta_vip_click",
    variant: "premium" as const,
    recommended: false,
  },
];

const stats = [
  { icon: Users, value: "100+", label: "Créateurs accompagnés" },
  { icon: TrendingUp, value: "10M+", label: "Vues générées" },
  { icon: Clock, value: "3 ans", label: "D'expertise TikTok" },
];

const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function Offres() {
  return (
    <Layout>
      <SEOHead title="Offres et Tarifs - Fred Wav | Coaching TikTok" description="Découvre les offres d'accompagnement TikTok : One Shot (179€), Wav Premium et VIP. Trouve la formule adaptée à tes besoins." path="/offres" keywords="tarifs coaching tiktok, offres tiktok, one shot, wav premium, vip, accompagnement créateur" />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Trouve l'accompagnement <span className="text-gold-gradient">adapté à tes besoins</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Trois niveaux d'engagement pour trois types de profils.
            Pas de formule standard : chaque accompagnement est personnalisé.
          </p>

          {/* Profile Selector */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <span className="text-sm text-muted-foreground self-center mr-2">Je veux :</span>
            {profileSelector.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-background text-sm font-medium hover:border-primary hover:text-primary transition-all"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section variant="dark" size="sm">
        <div className="flex flex-wrap justify-center gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-semibold text-cream">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Offers Detail */}
      <Section variant="default" size="xl">
        <div className="space-y-16 md:space-y-24">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              id={offer.id}
              className="scroll-mt-24"
            >
              {offer.recommended && (
                <div className="text-center mb-6">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                    Recommandé pour commencer
                  </span>
                </div>
              )}

              <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-start ${
                index % 2 === 1 ? "lg:direction-rtl" : ""
              }`}>
                {/* Info */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${offer.recommended ? "bg-primary/10" : "bg-muted"}`}>
                      <offer.icon className={`h-5 w-5 ${offer.recommended ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className="text-sm text-primary font-medium">{offer.subtitle}</span>
                  </div>

                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                    {offer.title}
                  </h2>

                  <p className="text-lg text-muted-foreground mb-6">
                    {offer.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold">{offer.price}</span>
                    <span className="text-muted-foreground">{offer.priceNote}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {offer.duration}
                    </span>
                  </div>

                  <Button
                    variant={offer.recommended ? "hero" : "premium"}
                    size="lg"
                    asChild
                    onClick={() => trackEvent(offer.trackEvent, { location: "offres_detail" })}
                  >
                    <Link to={offer.href}>
                      {offer.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.
                  </p>
                </div>

                {/* Details */}
                <div className={`space-y-6 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  {/* Includes */}
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Ce qui est inclus</h3>
                    <ul className="space-y-3">
                      {offer.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* For Who */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-accent/50 rounded-xl p-5">
                      <h4 className="font-medium mb-3">Pour toi si...</h4>
                      <ul className="space-y-2">
                        {offer.forWho.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-destructive/5 rounded-xl p-5">
                      <h4 className="font-medium mb-3">Pas pour toi si...</h4>
                      <ul className="space-y-2">
                        {offer.notForWho.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="h-4 w-4 mt-0.5 shrink-0 text-center text-destructive">✕</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold mb-4">
            Tu ne sais pas quelle offre choisir ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Commence par un One Shot. On fera le point ensemble et je te conseillerai la suite adaptée à ta situation.
          </p>
          <Button
            variant="hero"
            size="lg"
            asChild
            onClick={() => trackEvent("cta_one_shot_click", { location: "offres_bottom" })}
          >
            <Link to="/one-shot">
              Réserver mon One Shot (179€)
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
