import { Link } from "react-router-dom";
import { ArrowRight, Check, X, BarChart3, Repeat, Target, Radio } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor, PILIER_FAQ } from "@/config/seo";
import { CREATORS_COUNT } from "@/config/offers";
import { OfferComparison } from "@/components/OfferComparison";
import { trackEvent } from "@/lib/tracking";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─────────────────────────────────────────────────────────────────────────────
// Texte relu et corrigé par Fred. Rien n'est inventé : tout vient de sa matière
// réelle (wavacademy_content.txt), de pages existantes, ou de ses corrections directes.
// Cadrage validé : organique au cœur, TikTok Shop exclu, publicité possible selon le
// profil ; objectif = clients OU visibilité/marques ; aucune mention CPF/Qualiopi.
// ─────────────────────────────────────────────────────────────────────────────

// La logique formats courts, identique quelle que soit la plateforme.
const method = [
  {
    icon: Target,
    title: "L'accroche",
    description: "Les 2-3 premières secondes décident si on te regarde ou si on scrolle. Même règle sur TikTok, Reels et Shorts.",
  },
  {
    icon: BarChart3,
    title: "La rétention",
    description: "Là où l'audience décroche, ta vidéo te le dit. On lit le moment exact et on corrige ce paramètre-là, pas tout le reste.",
  },
  {
    icon: Repeat,
    title: "L'appel à l'action",
    description: "Des vues qui ne ramènent personne en DM, c'est un problème de CTA, pas de montage. On le traite pour ce qu'il est.",
  },
  {
    icon: Radio,
    title: "La lecture des stats",
    description: "Le contenu, c'est une partie du résultat. Le reste, c'est savoir lire les signaux que l'appli t'envoie après chaque vidéo.",
  },
];

// Sous-blocs par plateforme. Formulation corrigée par Fred : la méthode se transpose
// partout, mais TikTok est la plateforme aux stats les plus lisibles et précises —
// ailleurs on lit les grandes lignes. L'outil auto reste TikTok pour l'instant.
const platforms = [
  {
    name: "TikTok",
    body: "Le cœur du travail : hooks, watch time, taux de complétion. C'est aussi la seule plateforme couverte par mon outil de diagnostic automatisé pour l'instant.",
    href: "/accompagnement-tiktok",
    hrefLabel: "L'accompagnement TikTok en détail",
  },
  {
    name: "Instagram Reels",
    body: "La même méthode s'applique. Les statistiques y sont moins détaillées que sur TikTok, donc on travaille sur les grandes tendances plutôt que sur la seconde près.",
    href: null,
    hrefLabel: null,
  },
  {
    name: "YouTube Shorts",
    body: "La porte d'entrée vers ta chaîne : un Short qui accroche amène vers des formats plus longs. Même logique d'accroche et de rétention, lecture plus large des stats.",
    href: null,
    hrefLabel: null,
  },
];

const forYou = [
  "Tu es créateur, entrepreneur ou marque personnelle et tu veux faire des formats courts un vrai levier — pour attirer des clients, ou simplement pour gagner en visibilité et intéresser des marques",
  "Tu veux apprendre à lire tes propres stats et devenir autonome, pas dépendre de quelqu'un à vie",
  "Tu publies (ou tu es prêt à publier) régulièrement et à corriger vidéo après vidéo",
];

const notForYou = [
  "Tu cherches une agence qui poste à ta place — je t'apprends à le faire, je ne le fais pas pour toi",
  "Tu viens surtout pour vendre via TikTok Shop : ce n'est pas mon terrain",
  "Tu veux des résultats sans publier régulièrement ni appliquer ce qu'on met en place",
];

export default function AccompagnementReseauxSociaux() {
  return (
    <Layout>
      <SEOHead {...seoFor("/accompagnement-reseaux-sociaux")} />

      {/* ===== Hero + qualification ===== */}
      <Section variant="cream" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            Accompagnement réseaux sociaux :{" "}
            <span className="text-gold-gradient">une méthode formats courts, multi-plateforme.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Un seul accompagnement, orienté créateur, pour TikTok, Reels et Shorts. Tu apprends à lire tes vraies stats et à corriger tes vidéos — pas à déléguer tes comptes.
          </p>
          {/* Ligne de qualification — cadrage validé par Fred. */}
          <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto mb-8">
            Croissance organique, hors TikTok Shop. Un accompagnement, pas une formation figée ni une agence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "pilier_hero" })}>
              <Link to="/wavacademy">
                Voir comment on travaille
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild onClick={() => trackEvent("cta_express_click", { location: "pilier_hero" })}>
              <Link to="/analyse-express">Commencer par un audit TikTok</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ===== Thèse : un accompagnement, pas quatre formations ===== */}
      {/* Thèse de fond : un accompagnement multi-plateforme, pas quatre formations. */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Un accompagnement, pas quatre formations."
            subtitle="On ne t'apprend pas « TikTok », puis « Instagram », puis « YouTube » comme trois matières séparées. C'est la même logique partout."
          />
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Une accroche qui retient, une rétention qu'on sait lire, un appel à l'action qui fait réagir : ces règles ne changent pas d'une plateforme à l'autre. Ce qui change, c'est la finesse des statistiques. TikTok est de loin la plateforme la plus lisible et la plus précise — ailleurs, tu lis les grandes lignes plutôt que le détail.
            </p>
            <p>
              C'est pour ça qu'un accompagnement multi-plateforme a du sens là où quatre formations séparées n'en auraient aucun : tu apprends <strong className="text-foreground">une</strong> méthode, tu l'appliques partout où tu publies. Le contenu, c'est une partie du résultat. Le reste, c'est savoir quel paramètre corriger après chaque vidéo — un seul à la fois, mesuré, puis le suivant.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== La méthode (4 piliers, plateforme-agnostiques) ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="La même méthode, quelle que soit la plateforme"
          subtitle="Quatre choses à regarder après chaque vidéo. Elles valent pour tes TikTok, tes Reels et tes Shorts."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {method.map((item) => (
            <div key={item.title} className="bg-background border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== Les 3 plateformes ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="TikTok, Reels, Shorts : ce qui change vraiment"
          subtitle="La méthode se transpose partout. Ce qui varie, c'est la précision des statistiques que la plateforme te donne pour corriger."
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {platforms.map((p) => (
            <div key={p.name} className="bg-background border border-border rounded-xl p-6 flex flex-col">
              <h3 className="font-display text-lg font-semibold mb-3">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.body}</p>
              {p.href && p.hrefLabel && (
                <Link to={p.href} className="text-sm text-primary underline hover:no-underline mt-4 inline-flex items-center gap-1">
                  {p.hrefLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ===== Pour qui / pas pour qui ===== */}
      {/* Listes de qualification — validées par Fred. */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background rounded-xl p-8 border border-border">
              <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                C'est pour toi si...
              </h3>
              <ul className="space-y-3">
                {forYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-destructive/5 rounded-xl p-8 border border-destructive/10">
              <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                Ce n'est PAS pour toi si...
              </h3>
              <ul className="space-y-3">
                {notForYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== Comment on bosse ensemble : routage vers les 3 offres ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Comment on travaille ensemble"
          subtitle="Trois portes d'entrée selon là où tu en es. La même méthode derrière."
        />
        <OfferComparison location="pilier" />
      </Section>

      {/* ===== Preuves ===== */}
      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong className="text-foreground">{CREATORS_COUNT}</strong> créateurs et entrepreneurs accompagnés, tous secteurs confondus : coaching, e-commerce, artisanat, formation, services. Des résultats documentés, pas des chiffres gonflés.
          </p>
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("click_proof_strip", { location: "pilier" })}>
            <Link to="/preuves">
              Voir les témoignages et résultats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== FAQ ===== */}
      <Section variant="default" size="lg">
        <div className="max-w-2xl mx-auto">
          <SectionHeader title="Les questions que tu te poses." />
          <Accordion type="single" collapsible className="w-full">
            {PILIER_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium" onClick={() => trackEvent("faq_open", { question: item.question, location: "pilier" })}>
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

      {/* ===== CTA final ===== */}
      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream">
            Prêt à arrêter de poster à l'aveugle ?
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Une méthode, toutes tes plateformes. Commence là où tu es.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "pilier_bottom" })}>
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
