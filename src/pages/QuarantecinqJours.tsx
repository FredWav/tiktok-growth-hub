import { Link } from "react-router-dom";
import { ArrowRight, Check, Target, Users, Calendar, MessageSquare, BarChart3 } from "lucide-react";
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

const forYou = [
  "Tu as déjà un business et tu veux que TikTok devienne un vrai levier",
  "Tu es prêt à t'investir sérieusement pendant 45 jours",
  "Tu veux des résultats mesurables, pas juste des conseils",
];

const notForYou = [
  "Tu n'as pas le temps de créer du contenu régulièrement",
  "Tu cherches une solution miracle sans effort",
  "Tu veux juste plus de likes sans objectif business",
];

const method = [
  {
    icon: BarChart3,
    title: "Diagnostic approfondi",
    description: "On analyse ton compte, ton marché et tes concurrents pour définir une stratégie sur mesure.",
  },
  {
    icon: Calendar,
    title: "Suivi hebdomadaire",
    description: "Des sessions régulières pour ajuster, corriger et accélérer ta progression.",
  },
  {
    icon: MessageSquare,
    title: "Accès direct",
    description: "Messagerie prioritaire pour poser tes questions et obtenir du feedback rapide.",
  },
  {
    icon: Target,
    title: "Objectifs concrets",
    description: "Chaque semaine a un objectif clair. Pas de flou, pas de blabla.",
  },
];

const deliverables = [
  "Stratégie de contenu complète adaptée à ton business",
  "Review de tous tes contenus avec feedback actionnable",
  "Templates et ressources personnalisées",
  "Optimisation de ton profil et positionnement",
  "Plan de contenu pour continuer après les 45 jours",
  "Replay de toutes les sessions",
];

const process = [
  {
    step: "1",
    title: "Candidature",
    description: "Tu remplis un court formulaire pour que je comprenne ta situation.",
  },
  {
    step: "2",
    title: "Appel de qualification",
    description: "On échange 15 minutes pour voir si l'accompagnement est adapté à ton cas.",
  },
  {
    step: "3",
    title: "Démarrage",
    description: "Si c'est un match, on commence avec un onboarding complet et ta stratégie sur mesure.",
  },
];

const proofs = [
  {
    title: "Des créateurs qui passent à l'action",
    excerpt: "Le Wav Premium est conçu pour des résultats concrets et mesurables, pas des promesses vagues.",
  },
  {
    title: "Une méthode testée sur le terrain",
    excerpt: "Chaque recommandation est basée sur des données réelles, pas sur des tendances génériques.",
  },
];

const faqs = [
  {
    question: "Comment se passe la candidature ?",
    answer: "Tu remplis un court formulaire, puis on fait un appel de 15 minutes. Si ton profil correspond, on démarre. Sinon, je te redirige vers l'offre la plus adaptée.",
  },
  {
    question: "Combien de temps par semaine ça demande ?",
    answer: "Compte environ 3 à 5 heures par semaine pour créer du contenu et appliquer les recommandations. Les sessions de suivi durent 30 à 45 minutes.",
  },
  {
    question: "Je peux faire un One Shot avant de candidater ?",
    answer: "Oui, et c'est même recommandé. Le One Shot permet de poser les bases et de voir si tu es prêt pour un accompagnement plus intensif.",
  },
  {
    question: "Quel est le prix ?",
    answer: "Le Wav Premium est à 987€. Si tu as déjà effectué un One Shot, le prix passe à 799€. Paiement en plusieurs fois possible.",
  },
  {
    question: "Et si ça ne marche pas ?",
    answer: "L'accompagnement est basé sur l'exécution. Si tu appliques la méthode, les résultats suivent. C'est pour ça qu'il y a un process de sélection.",
  },
];

export default function QuarantecinqJours() {
  return (
    <Layout>
      <SEOHead title="Wav Premium - Transformation TikTok en 45 Jours | Fred Wav" description="Wav Premium : 45 jours d'accompagnement intensif pour transformer ta présence TikTok en levier business. Sur candidature." path="/45-jours" keywords="wav premium, accompagnement tiktok, transformation tiktok, suivi personnalisé, coaching tiktok intensif" />
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Target className="h-4 w-4" />
            Wav Premium — Accompagnement intensif
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            <span className="text-gold-gradient">Wav Premium</span> — 45 jours pour transformer ta présence TikTok
          </h1>

          <p className="text-lg text-muted-foreground mb-4">
            Un accompagnement encadré pour passer de "je poste sans stratégie" à "chaque vidéo a un objectif business".
            Suivi hebdomadaire, feedback continu, résultats mesurables.
          </p>

          <p className="text-base font-semibold mb-8">
            987€ — <span className="text-primary">799€ si tu as déjà fait un One Shot</span>
          </p>

          <Button
            variant="hero"
            size="xl"
            asChild
            onClick={() => trackEvent("cta_45j_click", { location: "hero" })}
          >
            <Link to="/wav-premium/candidature">
              Candidater au Wav Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.
          </p>
        </div>
      </Section>

      {/* Pour qui / Pas pour qui */}
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
                <span className="text-destructive">✕</span>
                Ce n'est PAS pour toi si...
              </h3>
              <ul className="space-y-3">
                {notForYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-destructive mt-0.5 shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Méthode */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="La méthode"
          subtitle="Un cadre structuré pour des résultats concrets."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {method.map((item) => (
            <div key={item.title} className="bg-background border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Ce que tu auras à la fin */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu auras à la fin"
          subtitle="Pas juste des conseils. Des livrables concrets."
        />

        <div className="max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-xl p-8">
            <ul className="space-y-4">
              {deliverables.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Preuves courtes */}
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Ce qu'ils en disent"
          subtitle="Des résultats concrets, pas des promesses."
        />

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          {proofs.map((proof) => (
            <Card key={proof.title} className="border-border">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{proof.title}</h3>
                <p className="text-sm text-muted-foreground">{proof.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="premium" size="lg" asChild>
            <Link to="/preuves">
              Voir toutes les preuves
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Process candidature */}
      <Section variant="dark" size="lg">
        <SectionHeader
          title="Le process"
          subtitle="3 étapes simples pour démarrer."
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {process.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-cream mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section variant="default" size="lg">
        <SectionHeader title="Questions fréquentes" />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-medium">
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
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Prêt pour la transformation ?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Le Wav Premium : 45 jours pour construire une présence TikTok qui génère des résultats pour ton business.
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
          <p className="text-sm text-muted-foreground mt-6">
            Tu hésites ? <Link to="/one-shot" className="text-primary underline hover:no-underline">Commence par un One Shot (179€)</Link> pour poser les bases.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
