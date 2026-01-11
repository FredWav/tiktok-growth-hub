import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Zap, Target, Crown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const offers = [
  {
    icon: Zap,
    title: "One Shot",
    subtitle: "Session unique",
    description: "1h30 de diagnostic + plan d'action concret. Tu repars avec une stratégie claire.",
    price: "179€",
    cta: "Réserver maintenant",
    href: "/one-shot",
    variant: "default" as const,
  },
  {
    icon: Target,
    title: "45 Jours",
    subtitle: "Accompagnement intensif",
    description: "Transformation complète de ta stratégie TikTok sur 45 jours. Suivi personnalisé.",
    price: "Sur candidature",
    cta: "Réserver un appel",
    href: "/offres/45-jours",
    variant: "premium" as const,
    featured: true,
  },
  {
    icon: Crown,
    title: "VIP à Vie",
    subtitle: "Accès illimité",
    description: "Accompagnement premium sans limite de durée. Pour ceux qui veulent le meilleur.",
    price: "Sur candidature",
    cta: "Candidater",
    href: "/offres/vip",
    variant: "premium" as const,
  },
];

const benefits = [
  "Stratégie adaptée à ton secteur",
  "Focus sur les résultats, pas les vanity metrics",
  "Méthodes testées sur +100 créateurs",
  "Pas de bullshit, du concret",
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 animate-fade-in">
            Ta stratégie TikTok.{" "}
            <span className="text-gold-gradient">Clarifiée.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            J'aide les créateurs et entrepreneurs à développer une présence TikTok 
            qui génère des résultats concrets. Pas des likes. Des clients.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/one-shot">
                Réserver un One Shot
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/offres">Voir les accompagnements</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Benefits Bar */}
      <Section variant="dark" size="sm">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-cream/80">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Offers Section */}
      <Section variant="default" size="xl">
        <SectionHeader
          title="Choisis ton niveau"
          subtitle="Trois formules pour trois niveaux d'engagement. À toi de voir où tu en es."
        />

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {offers.map((offer, index) => (
            <Card
              key={offer.title}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                offer.featured
                  ? "border-primary shadow-gold md:-mt-4 md:mb-4"
                  : "border-border hover:border-primary/50"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {offer.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 p-3 rounded-full ${offer.featured ? "bg-primary/10" : "bg-muted"}`}>
                  <offer.icon className={`h-6 w-6 ${offer.featured ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="font-display text-2xl">{offer.title}</CardTitle>
                <CardDescription className="text-primary font-medium">
                  {offer.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-muted-foreground text-center mb-6 flex-1">
                  {offer.description}
                </p>
                
                <div className="text-center mb-6">
                  <span className="text-2xl font-semibold">{offer.price}</span>
                </div>

                <Button
                  variant={offer.featured ? "hero" : "premium"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to={offer.href}>
                    {offer.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Tu veux savoir si on peut travailler ensemble ?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Commence par un One Shot. 1h30 pour clarifier ta stratégie, 
            sans engagement sur la suite.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/one-shot">
              Réserver mon One Shot — 179€
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
