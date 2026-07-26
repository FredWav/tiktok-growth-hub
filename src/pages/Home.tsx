import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, AlertTriangle, BarChart3, RefreshCw, MessageSquare, Target, Check, X, Zap, Radio } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { seoFor, HOME_FAQ } from "@/config/seo";
import { ACADEMY_PLANS, ACADEMY_FROM, PREMIUM_DURATION_DAYS } from "@/config/offers";
import { OfferComparison } from "@/components/OfferComparison";
import { WavSocialScanPopup } from "@/components/WavSocialScanPopup";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { TrustedBy } from "@/components/TrustedBy";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { VideoCard } from "@/components/VideoCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const proofStrip = [
  "Témoignages vidéo",
  "Cas clients concrets",
  "Décisions basées sur tes stats",
  "Feedback créateurs",
  "Résultats mesurables",
  "Sans bullshit",
];

const problems = [
  {
    icon: AlertTriangle,
    text: "Tu ne sais pas dire précisément à qui tu parles, ni ce que tu apportes.",
  },
  {
    icon: AlertTriangle,
    text: "Tes premières secondes ne retiennent pas, et l'audience décroche avant le message.",
  },
  {
    icon: AlertTriangle,
    text: "Tes vidéos manquent de rythme et personne ne comprend ce que tu attends à la fin.",
  },
  {
    icon: AlertTriangle,
    text: "Tu regardes tes statistiques sans savoir quoi en faire, donc tu répètes les mêmes erreurs.",
  },
];

// ── Wav Academy : l'offre principale ────────────────────────────────────────
const academyPillars = [
  {
    icon: Zap,
    title: "Un outil qui lit tes vidéos",
    description: "Tu colles le lien d'une vidéo, tu reçois en quelques secondes ce qui cloche et quoi changer.",
  },
  {
    icon: RefreshCw,
    title: "Une action concrète chaque jour",
    description: "Un contenu stratégique applicable le jour même, posté quotidiennement sur le Discord.",
  },
  {
    icon: Radio,
    title: "Un live chaque semaine",
    description: "En direct avec moi : tu poses tes questions, j'analyse des comptes, on décortique ce qui marche.",
  },
  {
    icon: MessageSquare,
    title: "Une communauté privée",
    description: "Les canaux avancés et les autres membres, pour ne jamais rester bloqué seul.",
  },
];

// ── Wav Premium : le haut de gamme, sur candidature ─────────────────────────
const premiumMethod = [
  {
    icon: BarChart3,
    title: "Analyse complète de ton compte",
    description: "On passe en revue ton positionnement, ton référencement et ton marché pour trouver ta place.",
  },
  {
    icon: RefreshCw,
    title: "Un point stratégique chaque semaine",
    description: "On regarde ensemble ce que tes chiffres racontent et on corrige immédiatement.",
  },
  {
    icon: MessageSquare,
    title: "Mes retours entre les sessions",
    description: "Tu me montres tes scripts et tes accroches avant de tourner, je te réponds directement.",
  },
  {
    icon: Target,
    title: "Des objectifs chiffrés",
    description: "Chaque semaine a un résultat attendu, écrit noir sur blanc.",
  },
];

const premiumForYou = [
  "Tu veux faire des formats courts un vrai levier — pour vendre ton offre, ou pour gagner la visibilité qui attire les marques",
  `Tu es prêt à corriger tes vidéos semaine après semaine pendant ${PREMIUM_DURATION_DAYS} jours`,
  "Tu veux des résultats mesurables, pas des conseils génériques",
];

const premiumNotForYou = [
  "Tu cherches une agence pour produire tes contenus à ta place",
  "Tu ne comptes pas publier régulièrement",
  "Tu cherches une recette miracle pour devenir viral sans effort",
];

const premiumDeliverables = [
  "Un plan éditorial complet et une stratégie pour rentabiliser ton audience",
  "La correction de tes scripts, ligne par ligne",
  "Des structures réutilisables : accroches, formats qui retiennent",
  "L'optimisation de ta bio et du parcours de tes abonnés",
  `Un plan pour tenir la croissance après les ${PREMIUM_DURATION_DAYS} jours`,
  "Les rediffusions de toutes les sessions d'analyse",
];

const featuredVideos = [
  { id: "g9QYqO-xiqw", alt: "Témoignage client - Retour d'expérience Wav Premium" },
  { id: "wu2CPcqp-yU", alt: "Témoignage client - Avis sur le Wav Premium" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client - Résultats après coaching stratégie de contenu" },
];

export default function Home() {
  return (
    <Layout>
      <WavSocialScanPopup />
      <ExitIntentPopup />
      <SEOHead {...seoFor("/")} />

      {/* ===== Hero ===== */}
      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-primary/5 -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 animate-fade-in">
            Arrête de poster à l'aveugle.{" "}
            <span className="text-gold-gradient">Tes stats disent déjà pourquoi tu plafonnes en vues.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Pas d'astuces d'algorithme, pas de promesses. Tu apprends à lire tes vraies données, à repérer ce qui bloque et à corriger vidéo après vidéo. <Link to="/a-propos" className="text-primary underline hover:no-underline">Découvre mon approche</Link>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "hero" })}>
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild onClick={() => trackEvent("cta_express_click", { location: "hero" })}>
              <Link to="/analyse-express">Analyser mon compte d'abord</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Dès {ACADEMY_FROM} € · paiement unique, sans abonnement.
          </p>
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
          title="Tu publies, mais tu ne sais pas pourquoi ça ne décolle pas."
          subtitle="Le contenu, c'est une partie du résultat. Le reste, c'est savoir lire tes chiffres et corriger le bon paramètre — c'est exactement ce qui ne s'apprend pas tout seul."
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

      {/* ===== Wav Academy : l'offre principale ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="La Wav Academy : apprends à corriger tes vidéos, sans rester seul"
          subtitle="Tu veux progresser avec un cadre régulier, sans passer par un accompagnement individuel. Tu diagnostiques chaque vidéo, tu corriges, tu recommences — et tu trouves ton format en quelques semaines au lieu de quelques mois."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {academyPillars.map((item) => (
            <div
              key={item.title}
              className="bg-background border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Les 3 Pass */}
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {ACADEMY_PLANS.map((plan) => (
              <div
                key={plan.term}
                className={`rounded-xl bg-background p-5 text-center ${
                  plan.highlight ? "border-2 border-primary" : "border border-border"
                }`}
              >
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">{plan.label}</p>
                <p className="font-display text-3xl font-bold mb-1">{plan.total} €</p>
                <p className="text-xs text-muted-foreground">accès {plan.duration}</p>
                {plan.save && (
                  <p className="text-xs font-semibold text-emerald-600 mt-2">{plan.save}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Paiement unique. Aucun abonnement, aucun prélèvement récurrent, aucune reconduction.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "academy_section" })}>
            <Link to="/wavacademy">
              Découvrir la Wav Academy
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Jusqu'à 4× sans frais avec PayPal et 3× sans frais avec Klarna, sous réserve d'acceptation.</p>
        </div>
      </Section>

      {/* ===== Comparateur des 3 offres ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Trois façons de travailler ensemble"
          subtitle="Choisis selon là où tu en es, pas selon ton budget."
        />
        <OfferComparison location="home" />
      </Section>

      {/* ===== Wav Premium : le haut de gamme ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title={`Wav Premium : ${PREMIUM_DURATION_DAYS} jours en individuel avec moi`}
          subtitle="L'option la plus intensive, sur candidature. On travaille directement sur ton compte, chaque semaine, jusqu'à ce que chaque vidéo ait un objectif clair."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {premiumMethod.map((item) => (
            <div
              key={item.title}
              className="bg-background border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Pour toi / Pas pour toi */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background rounded-xl p-8 border border-border">
              <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                C'est pour toi si...
              </h3>
              <ul className="space-y-3">
                {premiumForYou.map((item, i) => (
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
                {premiumNotForYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Livrables */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Ce que tu intègres dans ton business</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumDeliverables.map((item, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
                <Check className="h-5 w-5 text-primary mb-3" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <Button variant="premium" size="xl" asChild onClick={() => trackEvent("cta_premium_click", { location: "premium_section" })}>
            <Link to="/reserverunappel">
              Voir si le Wav Premium me correspond
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Accès sur candidature : un formulaire court, puis un échange écrit avant tout appel.</p>
        </div>
      </Section>

      {/* ===== Témoignages ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Basé sur tes données, validé par le terrain."
          subtitle="Chaque recommandation vient de l'analyse de centaines de vidéos, pas de tendances éphémères."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {featuredVideos.map((video) => (
            <VideoCard key={video.id} id={video.id} alt={video.alt} location="home" />
          ))}
        </div>

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

      {/* ===== FAQ ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Questions fréquentes"
        />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {HOME_FAQ.map((item, index) => (
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
          <p className="text-sm text-muted-foreground text-center mt-6">
            Tu as d'autres questions ? <Link to="/contact" className="text-primary underline hover:no-underline">Contacte-moi directement</Link>.
          </p>
        </div>
      </Section>

      {/* ===== Guide gratuit ===== */}
      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">GUIDE GRATUIT</span>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            Reçois mon guide des hooks gratuitement
          </h2>
          <p className="text-muted-foreground mb-6">
            120+ structures d'accroches classées par objectif, testées sur des millions de vues, et les erreurs qui tuent ta rétention dès la première seconde.
          </p>
          <Button variant="hero" size="lg" asChild onClick={() => trackEvent("cta_guide_click", { location: "home" })}>
            <Link to="/newsletter">
              Recevoir mon guide gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== CTA final ===== */}
      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream">
            Prêt à casser ton plafond de vues ?
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Rejoins la Wav Academy, diagnostique ta prochaine vidéo dès cette semaine et arrête de poster à l'aveugle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_academy_click", { location: "bottom" })}>
              <Link to="/wavacademy">
                Rejoindre la Wav Academy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-cream/50 mt-4">Dès {ACADEMY_FROM} € · paiement unique · jusqu'à 4× sans frais avec PayPal.</p>
          <p className="text-sm text-cream/50 mt-6">
            Pas encore prêt ? <Link to="/analyse-express" className="text-primary underline hover:no-underline">Commence par une Analyse Express</Link> pour un premier diagnostic de ton compte.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
