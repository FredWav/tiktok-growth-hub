import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CircleUserRound,
  Eye,
  Gauge,
  GraduationCap,
  Lightbulb,
  LineChart,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { OfferComparison } from "@/components/OfferComparison";
import { ClientResults } from "@/components/ClientResults";
import { VideoCard } from "@/components/VideoCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { seoFor, HOME_FAQ } from "@/config/seo";
import {
  ACADEMY_ENTRY,
  ACADEMY_FROM,
  CREATORS_COUNT,
  EXPRESS_PRICE_LABEL,
} from "@/config/offers";
import { trackEvent } from "@/lib/tracking";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";

const audiences = [
  {
    icon: CircleUserRound,
    title: "Créateurs",
    description: "Tu publies déjà et tu veux comprendre ce qui mérite d’être répété, corrigé ou abandonné.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Entrepreneurs",
    description: "Tu veux que tes contenus servent une activité réelle : visibilité, crédibilité, prospects ou ventes.",
  },
  {
    icon: GraduationCap,
    title: "Experts",
    description: "Tu maîtrises ton sujet, mais tu veux le rendre plus clair, plus regardé et plus mémorable en vidéo.",
  },
  {
    icon: Store,
    title: "Marques",
    description: "Tu veux tester des formats avec une méthode et relier les décisions créatives à des signaux observables.",
  },
];

const method = [
  {
    icon: Eye,
    title: "Observer",
    description: "On part de tes contenus, de leur contexte et de ce que l’audience fait réellement.",
  },
  {
    icon: BarChart3,
    title: "Comprendre",
    description: "On relie rétention, structure, sujet et objectif au lieu de commenter un chiffre isolé.",
  },
  {
    icon: Lightbulb,
    title: "Décider",
    description: "Chaque analyse se transforme en une hypothèse simple et une prochaine action testable.",
  },
  {
    icon: LineChart,
    title: "Répéter",
    description: "Tu construis progressivement une méthode adaptée à ton audience, pas une dépendance à un hack.",
  },
];

const resources = [
  {
    icon: BarChart3,
    href: "/ressources/statistiques-tiktok",
    title: "Comprendre ses statistiques TikTok",
    description: "Lis rétention, temps de visionnage, complétion et actions dans le bon ordre.",
  },
  {
    icon: Eye,
    href: "/ressources/vues-tiktok",
    title: "Pourquoi mes TikTok font peu de vues ?",
    description: "Remonte du symptôme à une hypothèse vérifiable sans inventer de mythe d’algorithme.",
  },
  {
    icon: Gauge,
    href: "/ressources/retention-tiktok",
    title: "Améliorer sa rétention TikTok",
    description: "Repère la séquence qui perd l’audience et choisis un test précis pour la suivante.",
  },
];

const featuredVideos = [
  { id: "XMMmmLLKue4", alt: "Témoignage de PlotBreaker sur la Wav Academy" },
  { id: "Hgkn3ifjSS0", alt: "Témoignage de Lucille après son accompagnement" },
  { id: "LOi7RTx12nE", alt: "Témoignage de David sur sa stratégie multiréseaux" },
];

export default function Home() {
  return (
    <Layout>
      <SEOHead {...seoFor("/")} />

      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Stratégie TikTok et formats courts
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-balance">
            Arrête de poster seul. <span className="text-gold-gradient">Tes statistiques TikTok disent déjà ce qui bloque.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Pas de hack ni de promesse de viralité. Tu apprends à lire tes contenus, comprendre ce qui retient vraiment l’attention et décider quoi tester sur la vidéo suivante.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Button
              variant="hero"
              size="xl"
              asChild
              onClick={() =>
                trackFunnelEvent(FUNNEL_EVENTS.academyCtaClick, {
                  source_page: "/",
                  position: "hero_primary",
                })
              }
            >
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              asChild
              onClick={() =>
                trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
                  source_page: "/",
                  position: "hero_secondary",
                })
              }
            >
              <Link to="/analyse-express">Commencer par l’Analyse Express — {EXPRESS_PRICE_LABEL}</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Academy dès {ACADEMY_FROM} € pour {ACADEMY_ENTRY.duration} — paiement unique, sans reconduction.
          </p>
        </div>
      </Section>

      <Section variant="dark" size="sm">
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            [CREATORS_COUNT, "créateurs accompagnés"],
            ["Paiement unique", "aucun abonnement ni reconduction"],
            ["Cas contextualisés", "des résultats, jamais une garantie"],
          ].map(([value, label]) => (
            <div key={value} className="text-center sm:text-left sm:border-l sm:border-cream/15 sm:pl-6 first:border-l-0 first:pl-0">
              <p className="font-display text-2xl font-semibold text-primary mb-1">{value}</p>
              <p className="text-sm text-cream/65">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Pour celles et ceux qui publient vraiment"
          subtitle="Tu n’as pas besoin d’être influenceur. Tu as besoin d’un objectif clair, de contenus à observer et de l’envie de tester."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {audiences.map((audience) => (
            <div key={audience.title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <audience.icon className="h-5 w-5 text-primary" />
              </span>
              <h2 className="font-display text-xl font-semibold mb-2">{audience.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader
          title="Trois besoins. Trois façons d’avancer."
          subtitle="L’Analyse Express pose le diagnostic, la Wav Academy installe un cadre régulier, le Wav Premium traite une stratégie individuelle."
        />
        <OfferComparison location="home" />
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Pas des promesses. Des résultats documentés."
          subtitle="Des chiffres replacés dans leur contexte et les mots des personnes accompagnées. Aucun résultat n’est présenté comme une garantie."
        />
        <ClientResults limit={3} />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
          {featuredVideos.map((video) => (
            <VideoCard key={video.id} id={video.id} alt={video.alt} location="home" />
          ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild onClick={() => trackEvent("proofs_cta_click", { source_page: "/", position: "results" })}>
            <Link to="/preuves">
              Voir les résultats et leur contexte
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="relative">
            <img
              src="/fred-wav.webp"
              alt="Fred Wav, consultant en stratégie TikTok et formats courts"
              width="896"
              height="962"
              loading="lazy"
              className="aspect-square w-full rounded-2xl border border-border object-cover shadow-lg"
            />
            <div className="absolute -bottom-5 -right-2 md:right-6 rounded-xl border border-primary/20 bg-background p-4 shadow-lg">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">La méthode</p>
              <p className="font-display text-lg font-semibold">Comprendre avant de répéter</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Travailler avec Fred</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-balance mt-3 mb-5">
              Une méthode fondée sur tes contenus, pas sur une théorie d’algorithme.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Mon rôle n’est pas de décider à ta place pour toujours. Il est de t’aider à relier tes statistiques, ton positionnement et tes objectifs jusqu’à ce que tu puisses prendre de meilleures décisions seul.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {method.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="lg" asChild>
              <Link to="/a-propos">
                Découvrir mon parcours
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Commence par comprendre ton blocage TikTok"
          subtitle="Trois guides pour passer d’un symptôme à une hypothèse, puis à un test concret sur ta prochaine vidéo."
        />
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {resources.map((resource) => (
            <Link
              key={resource.href}
              to={resource.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-background p-7 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-5">
                <resource.icon className="h-5 w-5 text-primary" />
              </span>
              <h2 className="font-display text-2xl font-semibold text-balance mb-3 group-hover:text-primary transition-colors">
                {resource.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{resource.description}</p>
              <span className="inline-flex items-center text-sm font-semibold mt-auto">
                Lire le guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-9">
          <Button variant="outline" size="lg" asChild>
            <Link to="/ressources">
              <BookOpen className="mr-2 h-4 w-4" /> Toutes les ressources
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/hooks-tiktok">Voir les hooks TikTok</Link>
          </Button>
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader title="Questions fréquentes" />
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {HOME_FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger
                  className="text-left font-medium"
                  onClick={() => trackEvent("faq_open", { source_page: "/", question: item.question })}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <Section variant="dark" size="lg">
        <div className="max-w-4xl mx-auto text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold-light/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-light">
            <ShieldCheck className="h-3.5 w-3.5" /> Sans abonnement
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream text-balance">
            Ne reste plus seul face à tes contenus et à tes statistiques.
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Rejoins un cadre régulier pour analyser, décider et progresser avec du feedback.
          </p>
          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() =>
              trackFunnelEvent(FUNNEL_EVENTS.academyCtaClick, {
                source_page: "/",
                position: "bottom_primary",
              })
            }
          >
            <Link to="/wavacademy">
              Rejoindre la Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-cream/50 mt-4">
            {ACADEMY_ENTRY.duration} dès {ACADEMY_FROM} € — paiement unique — aucune reconduction automatique.
          </p>
          <div className="mt-8 pt-8 border-t border-cream/10">
            <p className="text-sm text-cream/60 mb-3">Tu préfères commencer par un diagnostic de ton compte TikTok ?</p>
            <Button
              variant="hero-outline"
              size="lg"
              className="border-gold-light text-gold-light hover:bg-gold-light hover:text-noir"
              asChild
              onClick={() =>
                trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
                  source_page: "/",
                  position: "bottom_secondary",
                })
              }
            >
              <Link to="/analyse-express">Faire mon Analyse Express — {EXPRESS_PRICE_LABEL}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
