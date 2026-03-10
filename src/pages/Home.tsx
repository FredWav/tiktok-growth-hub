import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Zap, Target, TrendingUp, AlertTriangle, BarChart3, FileText, Video, Lightbulb, MessageSquare, type LucideIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { WavSocialScanPopup } from "@/components/WavSocialScanPopup";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { TrustedBy } from "@/components/TrustedBy";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const proofStrip = [
  "Témoignages vidéo",
  "Cas clients concrets",
  "Méthode data-driven",
  "Feedback créateurs",
  "Résultats mesurables",
  "Sans bullshit",
];

const problems = [
  {
    icon: AlertTriangle,
    text: "Ton positionnement est bancal et ta proposition de valeur manque de clarté.",
  },
  {
    icon: AlertTriangle,
    text: "Tes hooks sont faibles et la rétention s'effondre dans les premières secondes.",
  },
  {
    icon: AlertTriangle,
    text: "Tes scripts manquent de rythme et tes appels à l'action sont invisibles ou ignorés.",
  },
  {
    icon: AlertTriangle,
    text: "Tu n'arrives pas à identifier les erreurs précises qui limitent ta visibilité.",
  },
];

const deliverables = [
  { icon: BarChart3, text: "Diagnostic complet de ton compte et de ta niche" },
  { icon: FileText, text: "Ressources personnalisées adaptées à ta situation" },
  { icon: Lightbulb, text: "Stratégie de hooks et scripts adaptés à ton secteur" },
  { icon: TrendingUp, text: "Optimisation de ton positionnement et de ta bio" },
  { icon: Video, text: "Replay de la session disponible après" },
  { icon: MessageSquare, text: "Analyse de tes stats et recommandations concrètes" },
];

const offers = [
  {
    icon: Target,
    title: "Wav Premium",
    subtitle: "Transformation guidée",
    description: "Ton copilote stratégique pendant 45 jours. On bâtit ensemble un écosystème scalable, indépendant et haut de gamme.",
    price: null,
    includes: [
      "Clarification de la stratégie globale et refonte de l'architecture de contenu.",
      "Itération rapide basée sur la data et le SEO TikTok.",
      "Optimisation chirurgicale de chaque vidéo (rythme, rétention, conversion).",
      "Suivi rigoureux : zéro bullshit, aucune tolérance pour le flou.",
    ],
    cta: "Réserve un appel stratégique avec Fred Wav",
    href: "/45-jours",
    recommended: true,
    trackEvent: "cta_45j_click",
  },
  {
    icon: Zap,
    title: "One Shot",
    subtitle: "Session stratégique 1h30",
    description: "Un audit chirurgical de 1h30 pour identifier les failles de ton compte et de tes vidéos. Objectif : savoir exactement quoi corriger aujourd'hui.",
    price: "179€",
    includes: [
      "Analyse du positionnement et optimisation de ta bio.",
      "Lecture stratégique de tes contenus pour cibler les faiblesses structurelles.",
      "Diagnostic de tes hooks, estimation des points de décrochage et analyse du CTA.",
      "Script Doctor : recommandations concrètes d'amélioration.",
    ],
    cta: "Réserver mon Analyse Express (1h30)",
    href: "/one-shot",
    recommended: false,
    trackEvent: "cta_one_shot_click",
  },
];

const faqItems = [
  {
    question: "C'est quoi exactement un One Shot ?",
    answer: "C'est une session de 1h30 en visio où je fais un diagnostic complet de ton compte, ta niche et ta stratégie. Tu repars avec un plan d'action concret et personnalisé.",
  },
  {
    question: "Est-ce que le One Shot suffit ou je dois prendre le Wav Premium ?",
    answer: "Le One Shot peut suffire si tu exécutes seul. Si je pense que tu as le profil, je te dirai si le Wav Premium est pertinent. Aucun forcing.",
  },
  {
    question: "Est-ce que ça marche dans ma niche ?",
    answer: "La méthode est basée sur les données et s'adapte à tous les secteurs : coaching, e-commerce, artisanat, services, formation. Si tu vends quelque chose, ça fonctionne.",
  },
  {
    question: "Je débute sur les réseaux, c'est trop tôt ?",
    answer: "Non. Mieux vaut commencer avec une bonne stratégie que de poster 6 mois dans le vide. Le One Shot est justement fait pour poser les bases.",
  },
  {
    question: "Comment se passe le paiement ?",
    answer: "Paiement sécurisé via Stripe. Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.",
  },
  {
    question: "Et si je ne suis pas satisfait ?",
    answer: "Les retours sont excellents parce que la méthode est concrète. Pas de promesse de millions de vues, juste une stratégie qui fait sens pour ton business.",
  },
];

export default function Home() {
  return (
    <Layout>
      <WavSocialScanPopup />
      <ExitIntentPopup />
      <SEOHead title="Fred Wav - Expert Stratégie Formats Courts | Coaching et Accompagnement" description="Transforme tes réseaux en machine à clients. Diagnostic, stratégie de contenu et plan d'action avec Fred Wav, expert formats courts." path="/" keywords="stratégie formats courts, coaching réseaux sociaux, expert formats courts, plan action contenu, Fred Wav, audience réseaux, monétiser contenu" schema={[
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer,
            },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://fredwav.com/" },
            { "@type": "ListItem", "position": 2, "name": "Accompagnements", "item": "https://fredwav.com/offres" },
            { "@type": "ListItem", "position": 3, "name": "One Shot", "item": "https://fredwav.com/one-shot" },
            { "@type": "ListItem", "position": 4, "name": "Wav Premium", "item": "https://fredwav.com/45-jours" },
            { "@type": "ListItem", "position": 5, "name": "Témoignages", "item": "https://fredwav.com/preuves" },
          ],
        },
      ]} />
      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 animate-fade-in">
            Arrête de naviguer à vue.{" "}
            <span className="text-gold-gradient">Structure ta stratégie TikTok et explose tes conversions.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Ta visibilité stagne et ton audience ne convertit pas. Remplace le ressenti par un diagnostic précis et une architecture de contenu pensée pour l'acquisition.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_diagnostic_click", { location: "hero" })}>
              <Link to="/45-jours">
                Réserve un appel stratégique avec Fred Wav
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ===== Proof strip ===== */}
      <div className="px-4 md:px-0">
        <Section variant="dark" size="sm" className="rounded-2xl md:rounded-none mx-0 md:mx-0">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {proofStrip.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-cream/80">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ===== Problème ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Tu produis du contenu, mais ton acquisition est bloquée."
          subtitle="Faire des vues pour faire des vues ne sert à rien si ton tunnel est vide. Si ta stratégie n'est pas millimétrée, tu perds des prospects qualifiés à chaque post."
        />

        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-3xl mx-auto">
          {problems.map((problem, index) => (
            <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
              <problem.icon className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <span className="text-sm">{problem.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== Trusted By ===== */}
      <Section variant="default" size="sm">
        <TrustedBy />
      </Section>

      {/* ===== Ce que tu obtiens en One Shot ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ce que tu obtiens en One Shot"
          subtitle="1h30 de session. Un plan d'action complet. Zéro blabla."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          {deliverables.map((item) => (
            <div key={item.text} className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
              <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-noir/5 border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Ce que ce n'est PAS :</strong> Pas un coaching motivation. Pas quelqu'un qui poste à ta place. C'est une session stratégique, concrète, orientée résultats.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mt-8">
          <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_one_shot_click", { location: "body" })}>
            <Link to="/one-shot">
              Réserver mon Analyse Express (1h30)
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
        </div>
      </Section>

      {/* ===== Preuves sociales ===== */}
      <Section variant="default" size="lg">
        <ScreenshotWall location="home" title="Ils étaient là où tu es maintenant" subtitle="Créateurs et entrepreneurs qui ont clarifié leur stratégie." />
        <div className="text-center mt-10">
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("click_proof_strip", { location: "home" })}>
            <Link to="/preuves">
              Voir toutes les preuves
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== Accompagnements ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Accompagnements"
          subtitle="Deux formules, deux niveaux d'engagement."
        />

        <div className="flex flex-col md:flex-row md:items-stretch gap-6 lg:gap-8 max-w-4xl mx-auto">
          {offers.map((offer) => (
            <Card
              key={offer.title}
              className={`relative flex flex-col flex-1 basis-0 min-w-0 transition-all duration-300 hover:shadow-lg ${
                offer.recommended
                  ? "border-primary shadow-gold"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {offer.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Recommandé
                  </span>
                </div>
              )}

              <CardHeader className="text-center pt-8 pb-4">
                <div className={`mx-auto mb-4 p-3 rounded-full ${offer.recommended ? "bg-primary/10" : "bg-muted"}`}>
                  <offer.icon className={`h-6 w-6 ${offer.recommended ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="font-display text-2xl">{offer.title}</CardTitle>
                <p className="text-primary font-medium text-sm">{offer.subtitle}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-muted-foreground text-center mb-4 text-sm">{offer.description}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {offer.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {offer.price && (
                    <div className="text-center mb-6">
                      <span className="text-2xl font-semibold">{offer.price}</span>
                    </div>
                  )}

                  <Button
                    variant={offer.recommended ? "hero" : "premium"}
                    size="lg"
                    className="w-full"
                    asChild
                    onClick={() => trackEvent(offer.trackEvent, { location: "choose_section" })}
                  >
                    <Link to={offer.href}>
                      {offer.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ===== FAQ ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Questions fréquentes"
        />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-medium" onClick={() => trackEvent("faq_open", { question: item.question })}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
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
            Prêt à passer à l'action ?
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Commence par un One Shot. 1h30 pour clarifier ta stratégie, sans engagement sur la suite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_one_shot_click", { location: "bottom" })}>
              <Link to="/one-shot">
                Réserver mon Analyse Express (1h30)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-cream/50 mt-4">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
        </div>
      </Section>
    </Layout>
  );
}