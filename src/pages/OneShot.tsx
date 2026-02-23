import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, Video, FileText, HelpCircle, Zap } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const steps = [
  {
    title: "Tu réserves et tu payes",
    description: "Paiement sécurisé via Stripe. Tu accèdes immédiatement au calendrier.",
  },
  {
    title: "Tu choisis ton créneau",
    description: "Créneaux disponibles du lundi au vendredi. Confirmation instantanée.",
  },
  {
    title: "Tu remplis le questionnaire",
    description: "Pour que je prépare la session en amont. Maximum 10 minutes.",
  },
  {
    title: "On se retrouve en visio",
    description: "1h30 de travail intensif. Diagnostic, stratégie, plan d'action.",
  },
];

const deliverables = [
  {
    icon: Video,
    title: "Replay de la session",
    description: "Tu peux revoir la session en entier pour ne rien oublier.",
  },
  {
    icon: FileText,
    title: "Ressources personnalisées",
    description: "Des ressources adaptées à ta situation et ton secteur.",
  },
  {
    icon: Zap,
    title: "Diagnostic complet",
    description: "Analyse de ton compte, ta niche et tes axes d'amélioration.",
  },
];

const faqs = [
  {
    question: "Comment se passe la session ?",
    answer: "On se retrouve en visio (Google Meet ou Zoom). Je te pose des questions, on analyse ton compte ensemble, et je te donne un plan d'action personnalisé. Pas de blabla, que du concret.",
  },
  {
    question: "J'ai besoin de quoi avant la session ?",
    answer: "Juste d'un compte TikTok (même vide) et de répondre au questionnaire que je t'envoie après ta réservation. C'est tout.",
  },
  {
    question: "C'est adapté aux débutants ?",
    answer: "Absolument. Que tu n'aies jamais posté ou que tu aies déjà une audience, j'adapte mes conseils à ton niveau.",
  },
  {
    question: "Je peux reprogrammer si j'ai un empêchement ?",
    answer: "Oui, jusqu'à 24h avant la session. Au-delà, le créneau est perdu mais tu peux me contacter pour voir les options.",
  },
  {
    question: "Comment je paye ?",
    answer: "Paiement sécurisé par carte bancaire via Stripe. Tu recevras une facture automatiquement.",
  },
  {
    question: "Et si je veux continuer après ?",
    answer: "Si tu veux aller plus loin, on discutera de l'accompagnement 45 jours. Mais aucune obligation, le One Shot se suffit à lui-même.",
  },
];

export default function OneShot() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-oneshot-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Erreur lors de la création du paiement. Réessayez.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Session unique — 179€
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            1h30 pour clarifier <span className="text-gold-gradient">ta stratégie TikTok</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Tu postes sans stratégie claire ? Tu ne sais pas par où commencer ?
            En 1h30, on pose les bases d'une présence TikTok qui génère des résultats.
          </p>

          <Button variant="hero" size="xl" onClick={handleCheckout} disabled={loading}>
              {loading ? "Redirection..." : "Réserver ma session — 179€"}
              <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            <Clock className="inline h-4 w-4 mr-1" />
            Créneaux disponibles cette semaine
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.
          </p>
        </div>
      </Section>

      {/* Problem/Promise */}
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 rounded-xl p-8">
              <h3 className="font-display text-xl font-semibold text-red-900 mb-4">
                Le problème
              </h3>
              <ul className="space-y-3 text-red-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1">→</span>
                  <span>Tu postes au hasard, sans vraie direction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">→</span>
                  <span>Tu copies ce que tu vois sans comprendre pourquoi ça marche</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">→</span>
                  <span>Tu passes du temps sans voir de résultats concrets</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-8">
              <h3 className="font-display text-xl font-semibold text-green-900 mb-4">
                La promesse
              </h3>
              <ul className="space-y-3 text-green-800">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>Une stratégie claire adaptée à TON business</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>Un plan d'action pour les 30 prochains jours</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>Les clés pour créer du contenu qui convertit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Process */}
      <Section variant="dark" size="lg">
        <SectionHeader
          title="Comment ça se passe"
          subtitle="Un processus simple en 4 étapes"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-semibold">
                {index + 1}
              </div>
              <h3 className="font-semibold text-cream mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Deliverables */}
      <Section variant="default" size="lg">
        <SectionHeader
          title="Ce que tu repars avec"
          subtitle="Pas juste des conseils en l'air. Du concret."
        />

        <div className="grid md:grid-cols-3 gap-6">
          {deliverables.map((item, index) => (
            <div
              key={index}
              className="bg-muted/50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* For Who */}
      <Section variant="cream" size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-2">
                <Check className="h-6 w-6 text-green-600" />
                C'est pour toi si...
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span>Tu veux une stratégie claire et actionnable</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span>Tu es prêt à appliquer les conseils</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span>Tu veux un regard d'expert sur ta situation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span>Tu as 179€ à investir dans ta croissance</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-red-600" />
                Ce n'est PAS pour toi si...
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-0.5 shrink-0">✕</span>
                  <span>Tu cherches quelqu'un pour poster à ta place</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-0.5 shrink-0">✕</span>
                  <span>Tu attends des résultats magiques sans effort</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-0.5 shrink-0">✕</span>
                  <span>Tu n'es pas prêt à remettre en question ta façon de faire</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-0.5 shrink-0">✕</span>
                  <span>Tu veux des hacks sans stratégie derrière</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section variant="default" size="lg">
        <SectionHeader title="Questions fréquentes" />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
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

      {/* Final CTA */}
      <Section variant="dark" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Prêt à clarifier ta stratégie ?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            179€ pour repartir avec un plan d'action clair.
            Pas de bullshit, que du concret.
          </p>
          <Button variant="hero" size="xl" onClick={handleCheckout} disabled={loading}>
              {loading ? "Redirection..." : "Réserver ma session maintenant"}
              <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous réserve d'acceptation.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
