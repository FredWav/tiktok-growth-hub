import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X, BarChart3, RefreshCw, MessageSquare, Target, Play } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/tracking";
import { SEOHead } from "@/components/SEOHead";
import { TrustedBy } from "@/components/TrustedBy";

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

const deliverables = [
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

const faqs = [
  {
    question: "Comment se passe la sélection des candidatures ?",
    answer: "Tu remplis un court formulaire, puis on fait un appel de 15 minutes. Si ton profil correspond, on démarre. Sinon, je te redirige vers l'offre la plus adaptée.",
  },
  {
    question: "Quelle est la charge de travail hebdomadaire requise ?",
    answer: "Compte environ 3 à 5 heures par semaine pour créer du contenu et appliquer les recommandations. Les sessions de suivi durent 30 à 45 minutes.",
  },
  {
    question: "Est-il obligatoire de faire un One Shot avant ?",
    answer: "Non, mais c'est recommandé. Le One Shot permet de poser les bases et de voir si tu es prêt pour un accompagnement plus intensif.",
  },
  {
    question: "Comment fonctionne la garantie d'exécution ?",
    answer: "L'accompagnement est basé sur l'exécution. Si tu appliques la méthode, les résultats suivent. C'est pour ça qu'il y a un process de sélection.",
  },
];

const featuredVideos = [
  { id: "g9QYqO-xiqw", alt: "Témoignage client - Retour d'expérience Wav Premium" },
  { id: "97xyXqwszrM", alt: "Témoignage client - Retour d'expérience sur l'accompagnement" },
  { id: "cc1cRfCEJGE", alt: "Témoignage client - Résultats après coaching stratégie de contenu" },
];

function VideoCard({ id, alt }: { id: string; alt: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { trackEvent("click_video_play", { video_id: id, location: "45j" }); setPlaying(true); }}
      className="group relative aspect-video rounded-xl overflow-hidden shadow-lg cursor-pointer w-full"
    >
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
          <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}

export default function QuarantecinqJours() {
  return (
    <Layout>
      <SEOHead
        title="Wav Premium - 45 jours pour transformer ton audience en revenus | Fred Wav"
        description="Wav Premium : 45 jours d'itération intensive pour structurer ta stratégie de monétisation. Feedback chirurgical, data, rétention. Sur candidature."
        path="/45-jours"
        keywords="wav premium, accompagnement formats courts, monétisation audience, coaching intensif, stratégie contenu"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Wav Premium - Transformation 45 Jours",
            "description": "45 jours d'itération intensive pour transformer ton compte en actif business.",
            "provider": { "@type": "Person", "name": "Fred Wav", "url": "https://fredwav.com" },
            "offers": { "@type": "Offer", "priceCurrency": "EUR" },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((faq) => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.answer } })),
          },
        ]}
      />

      {/* Hero */}
      <Section variant="dark" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-cream">
            45 jours pour arrêter de faire des vues dans le vide et transformer ton audience en revenus.
          </h1>

          <p className="text-lg md:text-xl text-cream/70 mb-6 max-w-2xl mx-auto">
            On structure ta stratégie de monétisation : chaque vidéo a un objectif clair, chaque semaine produit un résultat mesurable. Un accompagnement intensif avec feedback chirurgical pour que ton contenu génère des clients.
          </p>

        </div>
      </Section>

      {/* Filtre */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-accent/50 rounded-xl p-8">
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

            <div className="bg-destructive/5 rounded-xl p-8">
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

      {/* Méthode */}
      <Section variant="dark" size="lg">
        <SectionHeader
          title="L'infrastructure de l'accompagnement"
          subtitle="Un cadre de travail implacable pour des résultats concrets."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {method.map((item) => (
            <div
              key={item.title}
              className="bg-cream/5 border border-cream/10 rounded-xl p-6 text-center hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-cream">{item.title}</h3>
              <p className="text-sm text-cream/60">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Preuve Sociale - juste après l'infrastructure */}
      <Section variant="dark" size="lg">
        <SectionHeader
          title="Basé sur la data, validé par le marché."
          subtitle="Chaque recommandation est issue de l'analyse de centaines de vidéos, pas de tendances éphémères."
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {featuredVideos.map((video) => (
            <VideoCard key={video.id} id={video.id} alt={video.alt} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="premium" size="lg" asChild onClick={() => trackEvent("click_preuves_link", { location: "45j" })}>
            <Link to="/preuves">
              Voir toutes les preuves
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Livrables */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu intègres dans ton business"
          subtitle="Des livrables exploitables, zéro théorie."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {deliverables.map((item, i) => (
            <div key={i} className="bg-muted/50 border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
              <Check className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm font-medium">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section variant="cream" size="lg">
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

      {/* Social proof */}
      <Section variant="cream" size="md">
        <TrustedBy filter="premium" />
      </Section>

      {/* FAQ */}
      <Section variant="default" size="lg">
        <SectionHeader title="Questions fréquentes" />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-medium" onClick={() => trackEvent("click_faq_45j", { question: faq.question })}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA final */}
      <Section variant="dark" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-cream">
            Prêt à vivre de ton contenu ?
          </h2>
          <p className="text-cream/60 text-lg mb-8">
            Le Wav Premium : 45 jours pour structurer une stratégie qui transforme tes abonnés en clients.
          </p>
          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() => trackEvent("cta_45j_click", { location: "footer_cta" })}
          >
            <Link to="/wav-premium/candidature">
              Candidater au Wav Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-cream/50 mt-6">
            Tu hésites ? <Link to="/one-shot" className="text-primary underline hover:no-underline">Commence par un One Shot (179 €)</Link> pour valider les bases stratégiques.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
