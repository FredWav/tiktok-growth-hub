import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, AlertTriangle, BarChart3, RefreshCw, MessageSquare, Target, Check, X, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
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

const method = [
  {
    icon: BarChart3,
    title: "Audit algorithmique",
    description: "Analyse de ton compte, de ton SEO et des failles de ton marché pour définir un positionnement d'autorité.",
  },
  {
    icon: RefreshCw,
    title: "Sprints hebdomadaires",
    description: "Sessions régulières pour analyser tes métriques de rétention et corriger le tir immédiatement.",
  },
  {
    icon: MessageSquare,
    title: "Accès asynchrone direct",
    description: "Messagerie prioritaire pour valider tes scripts et tes hooks avant même de tourner.",
  },
  {
    icon: Target,
    title: "KPI structurés",
    description: "Chaque semaine a un objectif mesurable. Aucun flou toléré.",
  },
];

const forYou = [
  "Tu as une offre validée et tu veux faire des formats courts un vrai levier pour transformer tes abonnés en clients",
  "Tu es prêt à itérer rapidement sur la structure de tes vidéos pendant 45 jours",
  "Tu exiges des résultats mesurables, pas des conseils génériques",
];

const notForYou = [
  "Tu cherches une agence pour déléguer ta production à ta place",
  "Tu espères percer avec du contenu pauvre et sans effort",
  "Tu vises la vanité des vues au lieu de la monétisation de ton audience",
];

const premiumDeliverables = [
  "Architecture éditoriale complète et plan de monétisation",
  "Script Doctoring : corrections ligne par ligne de tes contenus",
  "Frameworks de production (structures de rétention, bibliothèques de hooks)",
  "Optimisation de ta bio et de ton parcours abonné",
  "Plan d'action pour maintenir ta croissance post-45 jours",
  "Replays de toutes les sessions d'analyse",
];

const process = [
  {
    step: "1",
    title: "Filtrage",
    description: "Tu remplis un court formulaire de qualification technique.",
  },
  {
    step: "2",
    title: "Audit de viabilité",
    description: "Call de 15 min pour valider que la méthode s'applique à ton modèle.",
  },
  {
    step: "3",
    title: "Kickoff stratégique",
    description: "Onboarding immédiat et lancement du premier sprint.",
  },
];

const featuredVideos = [
  { id: "g9QYqO-xiqw", alt: "Témoignage client - Retour d'expérience Wav Premium" },
  { id: "wu2CPcqp-yU", alt: "Témoignage client - Avis sur le Wav Premium" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client - Résultats après coaching stratégie de contenu" },
];

const faqItems = [
  {
    question: "Comment se passe la sélection des candidatures ?",
    answer: "Tu remplis un court formulaire, puis on fait un appel de 15 minutes. Si ton profil correspond, on démarre. Sinon, je te redirige vers l'offre la plus adaptée.",
  },
  {
    question: "Est-ce que ça marche dans ma niche ?",
    answer: "La méthode est basée sur les données et s'adapte à tous les secteurs : coaching, e-commerce, artisanat, services, formation. Si tu vends quelque chose, ça fonctionne.",
  },
  {
    question: "Quelle est la charge de travail hebdomadaire requise ?",
    answer: "Compte environ 3 à 5 heures par semaine pour créer du contenu et appliquer les recommandations. Les sessions de suivi durent 30 à 45 minutes.",
  },
  {
    question: "Comment se passe le paiement ?",
    answer: "Paiement sécurisé via Stripe. Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.",
  },
  {
    question: "Comment fonctionne la garantie d'exécution ?",
    answer: "L'accompagnement est basé sur l'exécution. Si tu appliques la méthode, les résultats suivent. C'est pour ça qu'il y a un process de sélection.",
  },
  {
    question: "Je débute sur les réseaux, c'est trop tôt ?",
    answer: "Non. Mieux vaut commencer avec une bonne stratégie que de poster 6 mois dans le vide. Le Wav Premium est justement fait pour poser les bases solides dès le départ.",
  },
];

export default function Home() {
  return (
    <Layout>
      <WavSocialScanPopup />
      <ExitIntentPopup />
      <SEOHead title="Fred Wav - Expert Stratégie Formats Courts | Coaching et Accompagnement" description="Transforme tes réseaux en machine à clients. Stratégie de contenu, coaching intensif 45 jours et plan d'action avec Fred Wav, expert formats courts." path="/" keywords="stratégie formats courts, coaching réseaux sociaux, expert formats courts, wav premium, Fred Wav, monétiser contenu, accompagnement créateur" schema={[
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
            { "@type": "ListItem", "position": 2, "name": "Wav Premium", "item": "https://fredwav.com/wav-premium/candidature" },
            { "@type": "ListItem", "position": 3, "name": "Témoignages", "item": "https://fredwav.com/preuves" },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Wav Premium - Transformation 45 Jours",
          "description": "45 jours d'itération intensive pour transformer ton compte en actif business.",
          "provider": { "@type": "Person", "name": "Fred Wav", "url": "https://fredwav.com" },
          "offers": { "@type": "Offer", "priceCurrency": "EUR" },
        },
      ]} />

      {/* ===== Hero ===== */}
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
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_wav_premium_click", { location: "hero" })}>
              <Link to="/wav-premium/candidature">
                Candidater au Wav Premium
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

      {/* ===== Wav Premium : la solution ===== */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Wav Premium : 45 jours pour transformer ton audience en revenus"
          subtitle="Un accompagnement intensif avec feedback chirurgical pour que chaque vidéo ait un objectif clair et chaque semaine produise un résultat mesurable."
        />

        {/* Méthode - 4 piliers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {method.map((item) => (
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
          <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_wav_premium_click", { location: "solution_section" })}>
            <Link to="/wav-premium/candidature">
              Candidater au Wav Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
        </div>
      </Section>

      {/* ===== Process d'intégration ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Le process d'intégration"
          subtitle="3 étapes simples pour démarrer."
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {process.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== Témoignages ===== */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Basé sur la data, validé par le marché."
          subtitle="Chaque recommandation est issue de l'analyse de centaines de vidéos, pas de tendances éphémères."
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

      {/* ===== Newsletter ===== */}
      <Section variant="cream" size="md">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            Rejoins la newsletter
          </h2>
          <p className="text-muted-foreground mb-6">
            Stratégies, analyses et retours terrain directement dans ta boîte mail. Pas de spam, que du concret.
          </p>
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("cta_newsletter_click", { location: "home" })}>
            <Link to="/mail">
              S'inscrire à la newsletter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ===== CTA final ===== */}
      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream">
            Prêt à transformer ton audience en revenus ?
          </h2>
          <p className="text-cream/70 text-lg mb-8">
            Le Wav Premium : 45 jours pour structurer une stratégie qui transforme tes abonnés en clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild onClick={() => trackEvent("cta_wav_premium_click", { location: "bottom" })}>
              <Link to="/wav-premium/candidature">
                Candidater au Wav Premium
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-cream/50 mt-4">Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.</p>
          <p className="text-sm text-cream/50 mt-6">
            Pas encore prêt ? <Link to="/analyse-express" className="text-primary underline hover:no-underline">Commence par une Analyse Express</Link> pour un premier diagnostic de ton compte.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
