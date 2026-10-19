import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { seoFor } from "@/config/seo";
import type { Theme } from "@/config/themes";
import { EXPRESS_PRICE_LABEL, VIDEO_ANALYSIS_PRICE_LABEL } from "@/config/offers";
import { resourcesOfTheme } from "@/content/articles";
import { trackCtaClick } from "@/lib/funnel-events";

const TOOL = {
  express: {
    text: "Pour savoir ce qui se passe sur ton compte, l’Analyse Express lit tes vidéos publiques et te donne tes priorités.",
    href: "/analyse-express",
    label: `Analyser mon compte : ${EXPRESS_PRICE_LABEL}`,
  },
  video: {
    text: "Pour comprendre une vidéo précise, l’Analyse vidéo passe au crible son accroche, sa structure et sa rétention.",
    href: "/analyse-video",
    label: `Analyser ma vidéo : ${VIDEO_ANALYSIS_PRICE_LABEL}`,
  },
} as const;

/** Page guide d'un thème : présentation, ressources du thème, outil associé. */
export default function RessourceTheme({ theme }: { theme: Theme }) {
  const path = `/ressources/${theme.slug}`;
  const resources = resourcesOfTheme(theme.slug);
  const tool = TOOL[theme.tool];
  return (
    <Layout>
      <SEOHead {...seoFor(path)} />
      <Section variant="cream" size="lg">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Fil d’Ariane" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" to="/">Accueil</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link className="hover:text-primary transition-colors" to="/ressources">Ressources</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground font-medium">{theme.name}</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-5">
            <BookOpen className="h-3.5 w-3.5" /> Guide · {theme.name}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance mb-6">{theme.title}</h1>
          <p className="max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed">{theme.description}</p>
        </div>
      </Section>

      <Section variant="default" size="lg">
        <div className="max-w-4xl mx-auto grid gap-5">
          {resources.map((r) => (
            <Link
              key={r.path}
              to={r.path}
              className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <h2 className="font-display text-xl md:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{r.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{r.description}</p>
              <span className="inline-flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock3 className="h-4 w-4" /> {r.readingMinutes} min</span>
                <span className="inline-flex items-center font-semibold">Lire <ArrowRight className="ml-2 h-4 w-4" /></span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section variant="dark" size="md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-cream/80 text-lg leading-relaxed mb-6">{tool.text}</p>
          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() => trackCtaClick(tool.href, "theme_guide", theme.slug)}
          >
            <Link to={tool.href}>{tool.label}<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <p className="mt-6 text-sm">
            <Link to="/ressources" className="text-primary underline underline-offset-4">Tous les thèmes et ressources</Link>
          </p>
        </div>
      </Section>
    </Layout>
  );
}
