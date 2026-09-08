import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, Check, MessageSquare, Radio } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { ACADEMY_FEATURES, ACADEMY_FROM } from "@/config/offers";
import { WAVACADEMY_FAQ } from "@/config/wavacademy-faq";
import { ObjectionCards } from "@/components/ObjectionCards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function WavAcademy() {
  const [params] = useSearchParams();
  return (
    <Layout>
      <SEOHead {...seoFor("/wavacademy")} />
      {params.get("success") === "true" && (
        <div role="status" className="container py-6">
          Retour du paiement reçu. La confirmation vient par e-mail après
          vérification du règlement. Tes accès commencent à la date convenue,
          pas à la date du paiement.
        </div>
      )}
      <Section variant="cream" size="xl">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold mb-6">
            Wav Academy · accompagnement collectif · 6 mois
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            Fais progresser tes contenus sans sacrifier ton expertise ni y
            passer ta vie.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tu n’as pas besoin de devenir influenceur à plein temps. Tu as
            besoin d’un cadre, de retours et de rendez-vous réguliers pour
            comprendre ce qui fonctionne et choisir quoi améliorer sur TikTok,
            Instagram et YouTube.
          </p>
          <Button asChild variant="hero" size="xl">
            <a href="#programme">Découvrir le programme</a>
          </Button>
        </div>
      </Section>
      <Section id="programme" size="lg">
        <SectionHeader
          title="Tu montres. On analyse. Tu mets en pratique."
          subtitle="Ce que tu achètes, c’est un accompagnement. Pas une promesse de vues."
        />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[{
            icon: Radio,
            title: "Deux rendez-vous chaque semaine",
            text:
              "Mardi 18 h–19 h 30 et jeudi 14 h–16 h, heure de Paris. Tu peux participer librement aux deux lives. Ils sont maintenus ou délégués pendant les congés. Résumé fourni, sans replay.",
          }, {
            icon: MessageSquare,
            title: "Un collectif et des retours",
            text:
              "Pose tes questions et partage tes contenus sur Discord. Réponse sous deux jours ouvrés maximum, du lundi au vendredi. Le week-end est off.",
          }, {
            icon: BarChart3,
            title: "Des outils pour appliquer",
            text:
              "6 modules, 19 guides et 3 000 crédits WavStats au démarrage, puis à chacun des cinq anniversaires mensuels. Les crédits Academy non utilisés sont perdus au renouvellement.",
          }].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border p-6"
            >
              <item.icon className="text-primary mb-4 h-7 w-7" />
              <h2 className="font-display text-xl mb-3">{item.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </Section>
      <Section variant="dark" size="lg">
        <div className="mx-auto max-w-5xl text-cream">
          <SectionHeader
            title="Pas de recette magique. Une façon plus lucide d’avancer."
            subtitle="L’Academy ne décide ni de ton expertise ni de tes opinions. Elle t’aide à mieux les transmettre et à sortir de l’essai-erreur aveugle."
            className="[&_h2]:text-cream [&_p]:text-cream/70"
          />
          <ObjectionCards
            tone="dark"
            items={[
              {
                question: "Je ne veux pas simplifier au point de devenir faux — mes pairs le verraient.",
                answer:
                  "Le travail ne consiste pas à retirer la nuance de ton sujet, mais à choisir l’angle, l’exemple et le format qui la rendent compréhensible. Tu restes responsable du fond ; les retours portent sur la manière de le transmettre.",
              },
              {
                question: "Mon métier est trop particulier pour les recettes TikTok.",
                answer:
                  "On part de ton projet, de tes contenus et de ton objectif. Une hypothèse utile pour un artisan, un médecin ou un consultant B2B ne sera pas automatiquement la même. Les méthodes servent à structurer les tests, pas à effacer ton contexte.",
              },
              {
                question: "Personne ne peut prédire l’algorithme.",
                answer:
                  "C’est vrai. L’objectif n’est pas de prédire une viralité, mais de lire les signaux disponibles, formuler une hypothèse et choisir le prochain test. Tu réduis la part de hasard sans prétendre la supprimer.",
              },
              {
                question: "Je n’ai pas le temps d’apprendre un deuxième métier.",
                answer:
                  "Tu peux choisir librement les lives utiles, consulter leurs résumés et poser tes questions sur Discord. Le but est de dégager une prochaine priorité claire. Il faut néanmoins garder du temps pour créer, publier et appliquer les retours.",
              },
            ]}
          />
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div>
            <h2 className="font-display text-3xl mb-4">
              Débutant ou déjà lancé : viens avec un projet.
            </h2>
            <p className="text-muted-foreground">
              Aucun minimum d’abonnés ou de vidéos. Ce qui compte : savoir
              pourquoi tu veux créer et être prêt à tester, publier et utiliser
              les retours. La création reste ton travail ; je t’aide à prendre
              de meilleures décisions.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-4">
              Ce n’est pas un audit gratuit.
            </h2>
            <p className="text-muted-foreground">
              L’appel sert à vérifier si le programme correspond à ton projet et
              à parler de l’inscription. Il ne comprend pas de diagnostic de
              compte ni de séance de conseils personnalisés.
            </p>
            <Link
              className="inline-flex py-4 underline text-primary"
              to="/preuves"
            >
              Voir les retours sur les accompagnements de Fred
            </Link>
            <p className="text-sm text-muted-foreground">
              Ces témoignages concernent des accompagnements passés, pas
              nécessairement cette version du programme. Aucun résultat n’est
              garanti.
            </p>
          </div>
        </div>
      </Section>
      <Section size="lg">
        <SectionHeader
          title="Les vues ne sont pas l’objectif final."
          subtitle="On juge un contenu à partir de ce qu’il doit produire pour ton projet, pas avec un compteur unique."
        />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border p-7">
            <p className="font-semibold text-primary">Si tu développes ton autorité</p>
            <h2 className="mt-2 font-display text-2xl">Être compris sans te trahir.</h2>
            <p className="mt-3 text-muted-foreground">
              Le bon contenu rend ton expertise visible, attire les personnes
              qui peuvent réellement l’apprécier et protège ta crédibilité. Une
              portée plus faible mais mieux qualifiée peut être le meilleur
              résultat.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-7">
            <p className="font-semibold text-primary">Si tu développes ton activité</p>
            <h2 className="mt-2 font-display text-2xl">Relier contenu et objectif commercial.</h2>
            <p className="mt-3 text-muted-foreground">
              Une vidéo peut servir la découverte, la confiance, la demande ou
              la vente. On évite de confondre portée et rentabilité et on
              cherche les signaux cohérents avec l’étape visée.
            </p>
          </article>
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Pourquoi pas simplement TikTok et ChatGPT ?"
          subtitle="Ces outils restent utiles. L’Academy ne les remplace pas : elle apporte ce qui manque entre les données, les idées et l’exécution."
        />
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            ["TikTok et Instagram", "Les plateformes montrent leurs propres statistiques. Elles ne choisissent pas à ta place l’objectif, l’hypothèse à tester ni la priorité suivante."],
            ["Une IA généraliste", "Elle peut produire des idées à partir du contexte que tu lui fournis. Elle ne remplace ni la connaissance suivie de tes essais ni la discussion critique sur ce que tu veux préserver."],
            ["La Wav Academy", "Tu confrontes tes contenus réels à un regard humain, à un collectif et à une méthode de test régulière, avec WavStats comme outil d’observation — sans promesse de résultat automatique."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-border bg-background p-6">
              <h2 className="font-display text-xl">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <SectionHeader title="Les questions utiles avant l’appel" />
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {WAVACADEMY_FAQ.map((f, i) => (
            <AccordionItem key={f.question} value={String(i)}>
              <AccordionTrigger className="text-left">
                {f.question}
              </AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
      <Section size="lg">
        <div
          id="inscription"
          className="scroll-mt-24 max-w-2xl mx-auto border-2 border-primary rounded-2xl p-6 md:p-10"
        >
          <h2 className="font-display text-3xl mb-4">
            Six mois pour installer ta méthode.
          </h2>
          <ul className="space-y-3 mb-8">
            {ACADEMY_FEATURES.map((f) => (
              <li key={f} className="flex gap-3">
                <Check
                  aria-hidden="true"
                  className="text-primary h-5 w-5 shrink-0 mt-1"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="font-display text-4xl font-semibold text-primary">
            {ACADEMY_FROM} € <span className="text-base">TTC</span>
          </p>
          <p className="my-4 text-muted-foreground">
            Un seul règlement, en ligne ou par virement. Six mois de date à
            date, à partir du jour convenu ensemble lors de l’appel. Aucun accès
            anticipé, aucun abonnement.
          </p>
          <p className="mb-5 font-medium">
            Tu ne paies pas pour accumuler davantage de conseils : tu paies
            pour six mois de retours, de rendez-vous et de décisions remises en
            contexte pendant que tu publies réellement.
          </p>
          <Link to="/preuves" className="mb-6 inline-flex text-sm text-primary underline">
            Voir des retours historiques sur les accompagnements de Fred
          </Link>
          <Button
            asChild
            variant="hero"
            size="xl"
            className="w-full whitespace-normal h-auto min-h-12"
          >
            <Link to="/wavacademy/appel">
              Vérifier si l’Academy me correspond
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Quelques questions, puis le calendrier si tu confirmes les trois
            engagements. Aucun paiement à cette étape.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
