import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/config/seo";
import { PREMIUM_PRICE_LABEL } from "@/config/offers";
import { ObjectionCards } from "@/components/ObjectionCards";

const premiumFaq = [
  {
    question: "Et si Fred ne connaît pas mon métier aussi bien que moi ?",
    answer:
      "C’est normal : tu restes l’expert de ton sujet. Le travail de Fred porte sur la traduction de cette expertise en contenus compréhensibles, la cohérence avec ton objectif et les tests de diffusion. Les affirmations de fond restent sous ta responsabilité.",
  },
  {
    question: "Mon marché est très petit ou très technique : est-ce adapté ?",
    answer:
      "Le Premium part de ton compte, de ton offre, de ton audience et de tes contraintes. La candidature permet justement d’écarter les projets auxquels un accompagnement généraliste ne conviendrait pas. Aucun volume minimum d’abonnés n’est promis ni requis par la page.",
  },
  {
    question: "Peut-on vraiment tout transformer en trente jours ?",
    answer:
      "Non, et ce n’est pas la promesse. Les trente jours servent à analyser, choisir les priorités, réaliser des essais et ajuster une première séquence. La progression dépend ensuite de ta capacité à créer et à mettre en pratique entre les rendez-vous.",
  },
  {
    question: "Qu’est-ce qui justifie cet investissement ?",
    answer:
      "Le prix correspond à l’analyse complète, au cadrage de 1 h 30, aux trois rendez-vous hebdomadaires et au suivi WhatsApp direct pendant trente jours. Cette formule est destinée aux personnes pour qui l’accès individuel et la vitesse de décision justifient ce niveau d’investissement.",
  },
  {
    question: "Est-ce que le travail vise uniquement plus de vues ?",
    answer:
      "Non. L’objectif peut être l’autorité, une audience mieux qualifiée, des demandes ou des ventes. Les vues restent un signal de diffusion, jamais une preuve automatique de rentabilité, et aucun résultat commercial n’est garanti.",
  },
  {
    question: "Que se passe-t-il si je n’ai pas le temps de produire entre les rendez-vous ?",
    answer:
      "Le Premium nécessite une disponibilité réelle pour appliquer et tester. Si tu ne peux pas créer pendant la période, mieux vaut convenir d’une date ultérieure avec Fred plutôt que démarrer trente jours qui ne pourront pas être exploités.",
  },
];

export default function WavPremium() {
  return (
    <Layout>
      <SEOHead {...seoFor("/wav-premium")} />
      <Section variant="cream" size="xl">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold mb-6">
            Wav Premium · accompagnement individuel
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-6">
            Ton expertise est solide. Tes contenus doivent enfin la rendre
            visible.
          </h1>
          <p className="text-xl text-muted-foreground">
            Trente jours directement avec Fred pour transformer ton compte, ton
            projet et tes contraintes en décisions concrètes sur TikTok,
            Instagram et YouTube — sans t’imposer de devenir quelqu’un d’autre.
          </p>
        </div>
      </Section>
      <Section size="lg">
        <SectionHeader title="Un cadre précis, du premier bilan aux ajustements." />
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            [
              "1 · Cadrage et analyse",
              "Un premier rendez-vous de 1 h 30 pour cadrer le travail, avec remise de l’analyse complète de ton compte.",
            ],
            [
              "2 · Trois rendez-vous de suivi",
              "Un rendez-vous par semaine les trois semaines suivantes, d’une heure maximum chacun. On travaille les essais, leurs résultats et les ajustements.",
            ],
            [
              "3 · WhatsApp en semaine",
              "Suivi du lundi au vendredi, de 10 h à 18 h, heure de Paris. Réponse dans la journée ; pour les messages hors horaires, le jour ouvré suivant. Week-end off.",
            ],
            [
              "4 · Trente jours à date convenue",
              "La période commence au premier rendez-vous, fixé ensemble. Le règlement intégral et l’acceptation des modalités doivent précéder le démarrage.",
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="border border-border rounded-2xl p-6"
            >
              <h2 className="font-display text-xl mb-3">{title}</h2>
              <p className="text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section variant="dark" size="lg">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title="Les objections sérieuses méritent mieux qu’une promesse."
            subtitle="Le Premium ne prédit pas l’algorithme et ne remplace pas ton expertise. Il concentre l’analyse, les décisions et les ajustements sur une période courte."
            className="[&_h2]:text-cream [&_p]:text-cream/70"
          />
          <ObjectionCards
            tone="dark"
            items={[
              {
                question: "Je ne veux pas devenir un influenceur.",
                answer:
                  "Tu restes un expert ou un entrepreneur qui utilise les réseaux pour servir son projet. Le but est de rendre ton travail plus visible et plus clair, pas de remplacer ton identité par les codes d’un créateur généraliste.",
              },
              {
                question: "Une méthode marketing va appauvrir mon sujet.",
                answer:
                  "Un hook ne doit pas rendre une affirmation fausse. On travaille la porte d’entrée, la structure et la preuve tout en identifiant les nuances qui doivent absolument rester dans le contenu.",
              },
              {
                question: "Personne ne peut prédire ce qui va fonctionner.",
                answer:
                  "Exact. On ne vend pas une prédiction : on analyse les résultats, on hiérarchise les explications possibles et on conçoit un test qui permet d’apprendre quelque chose, même sans viralité.",
              },
              {
                question: "Les vues ne paient pas mes factures.",
                answer:
                  "La première séance fixe ce que les contenus doivent réellement produire : autorité, audience qualifiée, confiance, demandes ou ventes. La portée est ensuite lue en fonction de cet objectif, pas isolément.",
              },
            ]}
          />
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <SectionHeader
          title="Deux ambitions possibles, un point de départ précis."
          subtitle="La priorité n’est pas la même selon que tu protèges une expertise ou que tu accélères une activité. Le cadrage sert à la nommer."
        />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-background p-7">
            <p className="font-semibold text-primary">Expert, professionnel, auteur</p>
            <h2 className="mt-2 font-display text-2xl">Diffuser sans perdre ta crédibilité.</h2>
            <p className="mt-3 text-muted-foreground">
              Le travail porte sur la clarté, les formats et la distribution,
              sans laisser une tendance ou un algorithme dicter ce que tu dois
              penser.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-7">
            <p className="font-semibold text-primary">Entrepreneur, indépendant, dirigeant</p>
            <h2 className="mt-2 font-display text-2xl">Apprendre plus vite sans tester au hasard.</h2>
            <p className="mt-3 text-muted-foreground">
              Le travail relie les contenus à ton activité et concentre les
              essais sur les décisions qui peuvent réellement faire avancer ton
              objectif.
            </p>
          </article>
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl mb-4">
            Un accompagnement, pas une garantie de viralité.
          </h2>
          <p className="text-muted-foreground mb-6">
            Il faut être disponible pour créer et mettre en pratique entre les
            rendez-vous. Fred étudie personnellement chaque candidature. Il n’y
            a ni diagnostic gratuit dans l’appel, ni orientation automatique
            vers une autre offre.
          </p>
          <Link to="/preuves" className="underline text-primary">
            Lire les témoignages sur le travail avec Fred
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Retours historiques, dont les modalités peuvent différer de ce
            programme.
          </p>
        </div>
      </Section>
      <Section variant="cream" size="lg">
        <SectionHeader title="Les questions à trancher avant de candidater" />
        <div className="mx-auto max-w-3xl space-y-3">
          {premiumFaq.map((item) => (
            <details key={item.question} className="rounded-xl border border-border bg-background p-5">
              <summary className="cursor-pointer list-none pr-8 font-semibold marker:content-none">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Section>
      <Section size="lg">
        <div className="max-w-2xl mx-auto border-2 border-primary rounded-2xl p-6 md:p-10">
          <h2 className="font-display text-3xl mb-4">Le Wav Premium</h2>
          <p className="text-4xl text-primary font-display font-semibold">
            {PREMIUM_PRICE_LABEL} <span className="text-base">TTC</span>
          </p>
          <p className="text-muted-foreground my-5">
            Pour les trente jours, l’analyse complète, les quatre rendez-vous et
            le suivi WhatsApp. Paiement intégral en ligne ou par virement, avant
            le démarrage.
          </p>
          <p className="mb-5 font-medium">
            Tu paies pour accéder directement au diagnostic et aux arbitrages de
            Fred pendant tes essais, pas pour recevoir une nouvelle liste de
            conseils génériques.
          </p>
          <Link to="/preuves" className="mb-6 inline-flex text-sm text-primary underline">
            Voir des retours historiques sur le travail avec Fred
          </Link>
          <p className="text-sm text-muted-foreground mb-6">
            Le démarrage intervient après le délai de rétractation de 14 jours,
            ou avant sur demande expresse dans les conditions des{" "}
            <Link to="/cgv" className="underline">CGV</Link>. Le début du
            service ne supprime pas à lui seul tous les droits légaux.
          </p>
          <Button asChild variant="hero" size="xl" className="w-full">
            <Link to="/reserverunappel">Candidater au Wav Premium</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Réponse personnelle sous deux jours ouvrés. Aucun paiement lors de
            la candidature.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
