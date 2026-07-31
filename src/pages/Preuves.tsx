import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Eye, Check, X, Target, Zap, Crown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { CREATORS_COUNT } from "@/config/offers";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { ClientResults } from "@/components/ClientResults";
import { VideoCard } from "@/components/VideoCard";

// Les légendes (nom + niche + résultat) viennent de src/data/videoTestimonials.ts,
// indexées par ID YouTube. Une vidéo sans fiche reste affichée sans légende.
const videoTestimonials = [
  { id: "LOi7RTx12nE", alt: "Témoignage client - Retour d'expérience récent" },
  { id: "Hgkn3ifjSS0", alt: "Témoignage client - Retour d'expérience récent" },
  { id: "Bzw7nwqB2rQ", alt: "Témoignage client - Nouveau retour d'expérience" },
  { id: "XMMmmLLKue4", alt: "Témoignage client - Nouveau retour d'expérience" },
  { id: "Jh5yrsotoHM", alt: "Témoignage client - Retour d'expérience récent" },
  { id: "p3nCwuBZRGI", alt: "Témoignage client - Nouveau retour d'expérience" },
  { id: "g9QYqO-xiqw", alt: "Témoignage client - Retour d'expérience Wav Premium" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client - Résultats après coaching stratégie de contenu" },
  { id: "hwTyjA6BORY", alt: "Témoignage client - Transformation de présence en ligne" },
  { id: "FrMFqiAqAkU", alt: "Témoignage client - impact sur la stratégie de contenu" },
  { id: "s-VaJvfFqbM", alt: "Témoignage client - Croissance après accompagnement" },
  { id: "wu2CPcqp-yU", alt: "Témoignage client - Avis sur le Wav Premium de Fred Wav" },
];

const caseStudies = [
  {
    category: "Accompagnement Wav Premium",
    title: "Passer du chaos à une stratégie claire",
    before: ["Publications irrégulières", "Aucun système", "Aucune lecture des stats"],
    after: ["Calendrier éditorial structuré", "Hooks retravaillés", "CTA optimisés", "Premières demandes entrantes"],
    resultLabel: "Observé chez des créateurs accompagnés",
    results: [
      "Vidéos qui dépassent régulièrement les 5k-15k vues",
      "1 à 3 prospects qualifiés par semaine",
      "Compréhension réelle des métriques",
    ],
  },
  {
    category: "Accompagnement Business",
    title: "Transformer l'audience en chiffre d'affaires",
    before: ["Des vues", "Peu de conversion", "Positionnement flou"],
    after: ["Offre clarifiée", "CTA stratégique", "Contenu orienté acquisition"],
    resultLabel: "Effet constaté",
    results: [
      "Plus de leads qualifiés",
      "Moins de perte d'audience",
      "Meilleur ratio vues / ventes",
    ],
  },
];

const stats = [
  { icon: Users, value: CREATORS_COUNT, label: "Clients accompagnés" },
  { icon: Eye, value: "10M+", label: "de vues analysées" },
  { icon: TrendingUp, value: "95%", label: "Taux de satisfaction" },
];

const chooseOffers = [
  {
    icon: Crown,
    title: "La Wav Academy",
    description: "L'accompagnement pour ne plus poster seul",
    price: "dès 299 € / 3 mois",
    cta: "Découvrir la Wav Academy",
    href: "/wavacademy",
    trackEvent: "cta_academy_click",
    highlighted: true,
  },
  {
    icon: Target,
    title: "Wav Premium",
    description: "Transformation encadrée sur 30 jours",
    price: null,
    cta: "Voir si ça me correspond",
    href: "/reserverunappel",
    trackEvent: "cta_contact_click",
    highlighted: false,
  },
  {
    icon: Zap,
    title: "Analyse Express",
    description: "Diagnostic rapide de ton compte en 2 min",
    price: null,
    cta: "Lancer mon Analyse Express",
    href: "/analyse-express",
    // Nom d'événement conservé volontairement pour l'historique analytics.
    trackEvent: "cta_45j_click",
    highlighted: false,
  },
];

export default function Preuves() {
  return (
    <Layout>
      <SEOHead {...seoFor("/preuves")} />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Des résultats, <span className="text-gold-gradient">pas des promesses</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Ce que mes clients ont accompli en appliquant la méthode.
            Pas de chiffres gonflés. Juste la réalité.
          </p>
        </div>
      </Section>

      {/* Résultats clients documentés */}
      <Section variant="cream" size="md" className="pt-0">
        <SectionHeader
          title="Des résultats documentés."
          subtitle="Des créateurs réels, des chiffres réels."
        />
        <ClientResults />
      </Section>

      {/* Video Testimonials */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ils témoignent en vidéo"
          subtitle="Des retours authentiques, face caméra."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {videoTestimonials.map((video) => (
            <VideoCard key={video.id} id={video.id} alt={video.alt} location="preuves" />
          ))}
        </div>
      </Section>

      {/* Screenshot Wall */}
      <Section variant="cream" size="lg">
        <ScreenshotWall location="preuves" title="Ce qu'ils en disent" subtitle="Retours directs de clients après leur accompagnement." cols={2} />
      </Section>

      {/* CTA after videos */}
      <div className="px-4 md:px-0">
        <Section variant="dark" size="md" className="rounded-2xl md:rounded-none">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
              Prêt à obtenir les mêmes résultats ?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="lg"
                asChild
                onClick={() => trackEvent("cta_contact_click", { location: "preuves_mid" })}
              >
                <Link to="/reserverunappel">
                  Voir si le Wav Premium me correspond
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="premium"
                size="lg"
                asChild
                onClick={() => trackEvent("cta_analyse_express_click", { location: "preuves_mid" })}
              >
                <Link to="/analyse-express">
                  Analyse Express
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </div>

      {/* Stats */}
      <Section variant="default" size="sm">
        <div className="flex flex-wrap justify-center gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Case Studies */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Études de cas"
          subtitle="Des transformations mesurables et documentées."
        />

        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 md:p-10 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">{study.category}</span>
              <h3 className="font-display text-2xl md:text-3xl font-bold mt-3 mb-8 tracking-tight">
                {study.title}
              </h3>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-destructive/5 rounded-xl p-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-destructive/60 mb-4">Avant</div>
                  <ul className="space-y-3">
                    {study.before.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground line-through decoration-muted-foreground/30">
                        <X className="h-4 w-4 mt-0.5 shrink-0 text-destructive/60" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Après</div>
                  <ul className="space-y-3">
                    {study.after.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{study.resultLabel}</div>
                <ul className="grid md:grid-cols-3 gap-3">
                  {study.results.map((result, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      {result}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Ces résultats sont ceux de créateurs accompagnés. Aucun résultat n'est garanti.
                </p>
              </div>
            </div>
          ))}

          {/* Manifeste Wav Academy */}
          <div className="bg-noir rounded-2xl p-10 md:p-14 text-center border border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">La Wav Academy</span>
            <h3 className="font-display text-2xl md:text-3xl font-bold mt-3 mb-8 tracking-tight text-cream">
              Ne poste plus seul
            </h3>
            <div className="space-y-2 text-cream/70 text-lg max-w-md mx-auto mb-8">
              <p>Un regard régulier sur ton travail.</p>
              <p>Un suivi 5 jours sur 7.</p>
              <p>Un live chaque jeudi, de 14h à 16h.</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary font-semibold">
              <Target className="h-5 w-5" />
              <span>Objectif : comprendre ce qui fonctionne et ce qui ne fonctionne pas et pourquoi.</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Quel accompagnement choisir */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Quel accompagnement choisir ?"
          subtitle="Trois formules selon ton besoin."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {chooseOffers.map((offer) => (
            <div
              key={offer.title}
              className={
                offer.highlighted
                  ? "bg-primary/5 rounded-xl p-6 text-center border border-primary/40 shadow-lg hover:border-primary/60 transition-all"
                  : "bg-muted/50 rounded-xl p-6 text-center border border-border hover:border-primary/30 transition-all"
              }
            >
              {offer.highlighted && (
                <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  L'offre principale
                </span>
              )}
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <offer.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{offer.title}</h3>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{offer.description}</p>
                {offer.price && <p className="mt-1 text-sm font-semibold text-foreground">{offer.price}</p>}
              </div>
              <div className="flex justify-center">
                <Button
                  variant="premium"
                  size="sm"
                  asChild
                  onClick={() => trackEvent(offer.trackEvent, { location: "preuves_bottom" })}
                >
                  <Link to={offer.href}>
                    {offer.cta}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Layout>
  );
}
