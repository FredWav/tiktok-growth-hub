import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Eye,
  Gauge,
  Lightbulb,
  Mail,
  Search,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { seoFor } from "@/config/seo";
import { EXPRESS_PRICE_LABEL } from "@/config/offers";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";

const priorityResources = [
  {
    icon: BarChart3,
    href: "/ressources/statistiques-tiktok",
    eyebrow: "Lire les données",
    title: "Statistiques TikTok : les métriques qui changent vraiment une décision",
    description:
      "Temps de visionnage, rétention, complétion, engagement : apprends à les lire dans le bon ordre et à éviter les conclusions trop rapides.",
    duration: "9 min",
  },
  {
    icon: Eye,
    href: "/ressources/vues-tiktok",
    eyebrow: "Diagnostiquer la diffusion",
    title: "Pourquoi mes TikTok font peu de vues ?",
    description:
      "Un diagnostic étape par étape pour séparer problème d’accroche, promesse floue, rétention faible et manque de cohérence éditoriale.",
    duration: "10 min",
  },
  {
    icon: Gauge,
    href: "/ressources/retention-tiktok",
    eyebrow: "Garder l’attention",
    title: "Rétention TikTok : comprendre la courbe et améliorer la vidéo",
    description:
      "Lis les chutes d’audience, distingue le hook du corps de la vidéo et choisis un seul test utile pour ta prochaine publication.",
    duration: "11 min",
  },
];

const method = [
  {
    number: "01",
    title: "Commence par ta vraie question",
    description: "Peu de vues, chute au début, complétion faible : choisis le symptôme que tu veux comprendre, pas une astuce au hasard.",
  },
  {
    number: "02",
    title: "Lis la métrique dans son contexte",
    description: "Durée, sujet, audience et objectif changent complètement le sens d’un chiffre. Compare des contenus comparables.",
  },
  {
    number: "03",
    title: "Modifie une seule variable",
    description: "Hook, rythme, structure ou appel à l’action : un test isolé t’apprend davantage que cinq changements simultanés.",
  },
  {
    number: "04",
    title: "Mesure avant de conclure",
    description: "Une vidéo n’est pas une tendance. Répète le test, note ce qui change et transforme l’observation en méthode.",
  },
];

export default function Ressources() {
  useEffect(() => {
    trackFunnelEvent(FUNNEL_EVENTS.resourceView, {
      source_page: "/ressources",
      position: "page_view",
      content_slug: "ressources_hub",
    });
  }, []);

  return (
    <Layout>
      <SEOHead {...seoFor("/ressources")} />

      <Section variant="cream" size="lg" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
            <BookOpen className="h-3.5 w-3.5" /> Ressources TikTok
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6">
            Comprends tes chiffres avant de chercher une nouvelle astuce.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Des guides concrets pour lire tes statistiques TikTok, diagnostiquer ce qui bloque et décider quoi tester sur ta prochaine vidéo. Pas de secret d’algorithme, pas de promesse de vues.
          </p>
          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() =>
              trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
                source_page: "/ressources",
                position: "hero",
                content_slug: "ressources_hub",
              })
            }
          >
            <Link to="/analyse-express">
              Analyser mon compte — {EXPRESS_PRICE_LABEL}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <SectionHeader
          title="Commence par le blocage que tu observes"
          subtitle="Chaque guide répond à une intention précise. Tu peux les lire séparément, puis les relier pour construire ton diagnostic."
        />
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {priorityResources.map((resource) => (
            <Link
              key={resource.href}
              to={resource.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-background p-7 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <resource.icon className="h-5 w-5 text-primary" />
                </span>
                <span className="text-xs text-muted-foreground">Lecture {resource.duration}</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{resource.eyebrow}</span>
              <h2 className="font-display text-2xl font-semibold text-balance mb-3 group-hover:text-primary transition-colors">
                {resource.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{resource.description}</p>
              <span className="inline-flex items-center text-sm font-semibold mt-auto">
                Lire le guide <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start max-w-6xl mx-auto">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-5">
              <Search className="h-5 w-5 text-primary" />
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-balance mb-4">
              Une méthode de lecture, pas une liste de hacks
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              L’objectif n’est pas d’apprendre des seuils universels. Il est de comparer tes propres contenus, reconnaître un signal et savoir quelle hypothèse tester ensuite.
            </p>
          </div>
          <ol className="grid sm:grid-cols-2 gap-5">
            {method.map((step) => (
              <li key={step.number} className="rounded-2xl border border-border bg-background p-6">
                <span className="font-display text-2xl font-bold text-primary">{step.number}</span>
                <h3 className="font-display text-xl font-semibold mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Link
            to="/hooks-tiktok"
            className="group rounded-2xl bg-noir p-7 text-cream transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Lightbulb className="h-6 w-6 text-primary mb-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Bibliothèque pratique</span>
            <h2 className="font-display text-2xl font-semibold mt-3 mb-3">Hooks TikTok classés par famille</h2>
            <p className="text-sm text-cream/70 leading-relaxed mb-6">
              Des accroches prêtes à adapter, mais aussi ce que chaque famille coûte quand tu en abuses.
            </p>
            <span className="inline-flex items-center text-sm font-semibold">
              Explorer les hooks <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/newsletter"
            className="group rounded-2xl border border-border bg-cream p-7 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Mail className="h-6 w-6 text-primary mb-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Guide gratuit</span>
            <h2 className="font-display text-2xl font-semibold mt-3 mb-3">Reçois le guide complet des hooks</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Les structures d’accroches, les modèles à compléter et mes prochains décryptages directement par email.
            </p>
            <span className="inline-flex items-center text-sm font-semibold">
              Recevoir le guide <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>
        </div>
      </Section>

      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream text-balance mb-4">
            Tu as compris la méthode. Applique-la maintenant à ton compte.
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Commence par un diagnostic TikTok clair. Si tu veux ensuite progresser dans la durée, la Wav Academy prend le relais.
          </p>
          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() =>
              trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
                source_page: "/ressources",
                position: "bottom",
                content_slug: "ressources_hub",
              })
            }
          >
            <Link to="/analyse-express">
              Faire mon Analyse Express — {EXPRESS_PRICE_LABEL}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
