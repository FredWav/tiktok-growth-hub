import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Zap, Target, Crown, TrendingUp, TrendingDown, Eye, FileText, Video, BarChart3, Lightbulb, MessageSquare, type LucideIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { WavSocialScanPopup } from "@/components/WavSocialScanPopup";
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

const profiles: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: TrendingDown,
    title: "Tu postes, ça ne décolle pas",
    description: "Tu fais des efforts mais tes vidéos stagnent à 200 vues. Tu ne sais pas ce qui cloche.",
  },
  {
    icon: Eye,
    title: "Tu as des vues mais pas de clients",
    description: "L'algo te pousse mais personne n'achète. Ton contenu divertit au lieu de convertir.",
  },
  {
    icon: Target,
    title: "Tu veux structurer ton contenu pour vendre",
    description: "Tu sais que les réseaux peuvent rapporter, tu veux juste la bonne méthode pour y arriver.",
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
    icon: Crown,
    title: "VIP",
    subtitle: "Progresser dans la durée",
    description: "Lives hebdo, feedback Discord 5/7, ressources exclusives. Le cadre continu des créateurs ambitieux.",
    price: "À partir de 99€/mois",
    cta: "Rejoindre le VIP",
    href: "/offres/vip",
    recommended: false,
    trackEvent: "cta_vip_click",
  },
  {
    icon: Zap,
    title: "One Shot",
    subtitle: "Diagnostic + plan d'action",
    description: "1h30 pour comprendre ce qui bloque et repartir avec une stratégie claire. L'entrée la plus directe.",
    price: "179€",
    cta: "Réserver mon One Shot (179€)",
    href: "/one-shot",
    recommended: true,
    trackEvent: "cta_one_shot_click",
  },
  {
    icon: Target,
    title: "Wav Premium",
    subtitle: "Transformation guidée",
    description: "Pour ceux qui veulent une transformation encadrée sur 45 jours. Suivi, livrables, résultats.",
    price: "Sur candidature",
    cta: "Candidater au Wav Premium",
    href: "/45-jours",
    recommended: false,
    trackEvent: "cta_45j_click",
  }
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
            { "@type": "ListItem", "position": 2, "name": "Offres", "item": "https://fredwav.com/offres" },
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
            Clarifie ta stratégie.{" "}
            <span className="text-gold-gradient">Augmente ta visibilité.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            J'aide les créateurs et entrepreneurs à passer de "je poste au hasard" à "chaque vidéo a un objectif". Diagnostic, stratégie, plan d'action.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_diagnostic_click", { location: "hero" })}>
              <Link to="/start?go=1">
                Réserve un appel stratégique avec moi
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

      {/* ===== À qui ça s'adresse ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="À qui ça s'adresse"
          subtitle="Tu te reconnais dans une de ces situations ?"
        />

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {profiles.map((profile) => (
            <Card key={profile.title} className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                  <profile.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-display text-xl">{profile.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-sm">{profile.description}</p>
              </CardContent>
            </Card>
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
              Réserver mon One Shot (179€)
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
        </div>
      </Section>

      {/* ===== Preuves ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ils étaient là où tu es maintenant"
          subtitle="Créateurs et entrepreneurs qui ont clarifié leur stratégie."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          {homeTestimonials.map((t) => (
            <Card key={t.name} className="border-border">
              <CardContent className="pt-6 flex flex-col h-full">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-sm text-muted-foreground mb-4 flex-1">"{t.content}"</p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{t.result}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("click_proof_strip", { location: "home" })}>
            <Link to="/preuves">
              Voir toutes les preuves
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== Captures clients ===== */}
      <Section variant="cream" size="lg">
        <ScreenshotWall location="home" title="Leurs messages" subtitle="Des retours authentiques, sans filtre." />
      </Section>

      {/* ===== Comment choisir ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Comment choisir"
          subtitle="Trois formules, trois niveaux d'engagement."
        />

        <div className="flex flex-col md:flex-row md:items-stretch gap-6 lg:gap-8 max-w-5xl mx-auto">
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
                <p className="text-muted-foreground text-center mb-6 text-sm flex-1">{offer.description}</p>

                <div className="mt-auto">
                  <div className="text-center mb-6">
                    <span className="text-2xl font-semibold">{offer.price}</span>
                  </div>

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
                Réserver mon One Shot (179€)
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
