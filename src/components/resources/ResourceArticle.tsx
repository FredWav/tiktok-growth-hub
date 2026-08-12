import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { seoFor } from "@/config/seo";
import { EXPRESS_PRICE_LABEL } from "@/config/offers";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/funnel-events";

export type ResourceFaqItem = {
  question: string;
  answer: string;
};

export type RelatedResource = {
  href: string;
  title: string;
  description: string;
  label?: string;
};

type ResourceArticleProps = {
  path: string;
  slug: string;
  eyebrow: string;
  title: string;
  introduction: string;
  readingTime: string;
  experienceNote: string;
  children: ReactNode;
  faq: ResourceFaqItem[];
  related: RelatedResource[];
};

export function ResourceArticle({
  path,
  slug,
  eyebrow,
  title,
  introduction,
  readingTime,
  experienceNote,
  children,
  faq,
  related,
}: ResourceArticleProps) {
  useEffect(() => {
    trackFunnelEvent(FUNNEL_EVENTS.resourceView, {
      source_page: path,
      position: "page_view",
      content_slug: slug,
    });
  }, [path, slug]);

  return (
    <Layout>
      <SEOHead {...seoFor(path)} />
      <article>
        <Section variant="cream" size="lg">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Fil d’Ariane" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Accueil
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link className="hover:text-primary transition-colors" to="/ressources">
                    Ressources
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground font-medium">
                  {eyebrow}
                </li>
              </ol>
            </nav>

            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
              <BookOpen className="h-3.5 w-3.5" />
              Guide TikTok
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6">
              {title}
            </h1>
            <p className="max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-7">
              {introduction}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground border-t border-border pt-5">
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Par Fred Wav
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Mis à jour le 11 août 2026
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" /> {readingTime}
              </span>
            </div>
          </div>
        </Section>

        <Section variant="default" size="sm">
          <aside className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Retour d'expérience de Fred</p>
            <p className="mt-3 leading-relaxed text-foreground/85">{experienceNote}</p>
          </aside>
        </Section>

        <Section variant="cream" size="sm">
          <figure className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <img
              src="/ressources/extrait-rapport-analyse-express.png"
              alt="Extrait anonymisé d'un rapport Analyse Express montrant les scores et métriques TikTok"
              width="910"
              height="1287"
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
            <figcaption className="border-t border-border p-5 text-sm leading-relaxed text-muted-foreground md:p-6">
              Extrait anonymisé du rapport de démonstration généré sur le compte de Fred Wav le 4 août 2026.
              Ces chiffres montrent la présentation d'un audit réel&nbsp;: ils ne constituent ni un seuil TikTok,
              ni une promesse de résultat.{" "}
              <a
                href="/exemple-rapport-analyse-express.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Voir le rapport de démonstration complet (PDF)
              </a>
              .
            </figcaption>
          </figure>
        </Section>

        {children}

        <Section variant="cream" size="lg">
          <SectionHeader
            title="Continue ton diagnostic"
            subtitle="Ces ressources se complètent : chacune répond à une question précise, sans te faire repartir de zéro."
          />
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {related.map((resource) => (
              <Link
                key={resource.href}
                to={resource.href}
                className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {resource.label ?? "À lire ensuite"}
                </span>
                <h2 className="font-display text-xl font-semibold mt-3 mb-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {resource.description}
                </p>
                <span className="inline-flex items-center text-sm font-semibold">
                  Lire la ressource <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-7">
            Tu peux aussi consulter les <Link to="/preuves" className="text-primary underline underline-offset-4 hover:no-underline">résultats documentés</Link> avant de choisir une offre.
          </p>
        </Section>

        <Section variant="default" size="lg">
          <div className="max-w-3xl mx-auto">
            <SectionHeader title={`Questions fréquentes : ${eyebrow.toLowerCase()}`} />
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
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
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Prochaine étape
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream text-balance mb-4">
              Tes statistiques ont besoin de contexte, pas d’une règle magique.
            </h2>
            <p className="text-cream/70 text-lg leading-relaxed mb-8">
              L’Analyse Express lit ton compte TikTok, fait ressortir les signaux utiles et te donne un plan d’action clair.
            </p>
            <Button
              variant="hero"
              size="xl"
              asChild
              onClick={() =>
                trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
                  source_page: path,
                  position: "bottom",
                  content_slug: slug,
                })
              }
            >
              <Link to="/analyse-express">
                Analyser mon compte — {EXPRESS_PRICE_LABEL}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs text-cream/50 mt-4">Paiement unique. Rapport disponible après l’analyse.</p>
            <div className="mt-8 border-t border-cream/10 pt-6">
              <p className="mb-3 text-sm text-cream/60">
                Après le diagnostic, la Wav Academy est le cadre pour tester, relire les résultats et progresser dans la durée.
              </p>
              <Link
                to="/wavacademy"
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() =>
                  trackFunnelEvent(FUNNEL_EVENTS.academyCtaClick, {
                    source_page: path,
                    position: "post_express_continuation",
                    content_slug: slug,
                  })
                }
              >
                Découvrir la Wav Academy <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>
      </article>
    </Layout>
  );
}

export function ArticleSection({
  title,
  intro,
  children,
  variant = "default",
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  variant?: "default" | "cream";
}) {
  return (
    <Section variant={variant} size="lg">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance mb-4">
          {title}
        </h2>
        {intro && <p className="text-lg text-muted-foreground leading-relaxed mb-8">{intro}</p>}
        <div className="space-y-5 text-foreground/85 leading-relaxed">{children}</div>
      </div>
    </Section>
  );
}

export function DiagnosticGrid({
  items,
}: {
  items: Array<{ title: string; description: string; signal?: string }>;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 my-8">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          {item.signal && (
            <p className="mt-4 pt-4 border-t border-border text-sm">
              <strong className="text-primary">Signal à regarder :</strong> {item.signal}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function NumberedSteps({
  items,
}: {
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <ol className="space-y-5 my-8">
      {items.map((item, index) => (
        <li key={item.title} className="flex items-start gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {index + 1}
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function InlineExpressCta({
  sourcePage,
  contentSlug,
}: {
  sourcePage: string;
  contentSlug: string;
}) {
  return (
    <aside className="my-10 rounded-2xl border border-primary/30 bg-primary/10 p-6 md:p-8" aria-label="Analyse Express">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Besoin d’un diagnostic sur ton compte ?</p>
          <h3 className="font-display text-2xl font-semibold mb-2">Passe de la lecture à tes propres chiffres.</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            L’Analyse Express transforme les données publiques de ton compte TikTok en priorités concrètes, sans promesse de viralité.
          </p>
        </div>
        <Button
          variant="hero"
          size="lg"
          className="shrink-0"
          asChild
          onClick={() =>
            trackFunnelEvent(FUNNEL_EVENTS.expressCtaClick, {
              source_page: sourcePage,
              position: "after_first_diagnostic",
              content_slug: contentSlug,
            })
          }
        >
          <Link to="/analyse-express">
            Faire mon analyse — {EXPRESS_PRICE_LABEL}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}

export function ExampleDataChart({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: Array<{ label: string; value: number }>;
}) {
  return (
    <figure className="my-8 rounded-2xl border border-border bg-background p-6 md:p-8" aria-label={`${title}. ${description}`}>
      <figcaption className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Exemple pédagogique — données fictives
        </span>
        <h3 className="font-display text-xl md:text-2xl font-semibold mt-2 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </figcaption>
      <div className="flex h-52 items-end gap-3 sm:gap-5 border-b border-border px-1 pt-5" role="img" aria-label={points.map((point) => `${point.label} : ${point.value} %`).join(", ")}>
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center justify-end h-full gap-2">
            <span className="text-xs font-semibold text-foreground">{point.value} %</span>
            <div
              className="w-full max-w-16 rounded-t-md bg-gradient-to-t from-primary to-gold-light"
              style={{ height: `${Math.max(point.value, 6)}%` }}
              aria-hidden="true"
            />
            <span className="min-h-10 text-center text-[11px] sm:text-xs text-muted-foreground leading-tight">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Ce schéma illustre une méthode de lecture. Il ne représente ni un client, ni un seuil de performance TikTok.
      </p>
    </figure>
  );
}
