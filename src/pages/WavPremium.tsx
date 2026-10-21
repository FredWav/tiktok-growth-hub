import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { ObjectionCards } from "@/components/ObjectionCards";
import { OfferPage } from "@/components/offers/OfferPage";
import { seoFor } from "@/config/seo";
import { INSTALLMENTS_LABEL, INSTALLMENTS_NOTE, OFFERS } from "@/config/offers";

const premiumFaq = [
  {
    question: "Combien de temps dure le Wav Premium ?",
    answer: "Six semaines minimum, à partir du premier rendez-vous fixé ensemble. Pour aller plus loin, 12 ou 18 semaines sont possibles sur devis, selon ton projet.",
  },
  {
    question: "Combien de rendez-vous sont prévus ?",
    answer: "Au moins trois : un premier rendez-vous de 1 h 30 pour poser la stratégie, puis un rendez-vous d'une heure tous les quinze jours. Entre les deux, le suivi se fait sur WhatsApp.",
  },
  {
    question: "Comment fonctionne le suivi WhatsApp ?",
    answer: "Du lundi au vendredi, avec une réponse sous un jour ouvré. Tu peux envoyer tes contenus avant ou après publication pour avoir un retour au jour le jour.",
  },
  {
    question: "Pourquoi « dès 1 499 € » ?",
    answer: "1 499 € correspond à la formule de six semaines. Au-delà, le prix dépend de la durée et du niveau de suivi : Fred te fait une proposition chiffrée après avoir lu ta demande.",
  },
  {
    question: "Et si Fred ne connaît pas mon métier aussi bien que moi ?",
    answer: "C'est normal : tu restes l'expert de ton sujet. Le travail porte sur la traduction de cette expertise en contenus clairs, la cohérence avec ton objectif et les tests de diffusion.",
  },
  {
    question: "Est-ce que le travail vise uniquement plus de vues ?",
    answer: "Non. L'objectif peut être l'autorité, une audience mieux qualifiée, des demandes ou des ventes. Les vues restent un signal, jamais une preuve automatique de rentabilité, et aucun résultat n'est garanti.",
  },
  {
    question: "Que se passe-t-il si je n'ai pas le temps de produire ?",
    answer: "Le Premium demande une disponibilité réelle pour créer et tester. Si ce n'est pas le bon moment, mieux vaut convenir d'une date de démarrage plus tardive avec Fred.",
  },
];

export default function WavPremium() {
  return (
    <>
      <SEOHead {...seoFor("/wav-premium")} />
      <OfferPage
        offer={OFFERS.premium}
        title="Ton expertise est solide. Tes contenus doivent enfin la rendre visible."
        intro="Au moins six semaines directement avec Fred : une stratégie construite pour toi, des rendez-vous réguliers et un suivi WhatsApp pour décider vite, contenu après contenu, sur TikTok, Instagram et YouTube."
        steps={[
          { title: "Ta demande", body: "Tu décris ton projet, ton objectif et ta période. Fred te répond personnellement sous deux jours ouvrés." },
          { title: "La proposition", body: "Durée (6, 12 ou 18 semaines), prix et date de démarrage sont fixés ensemble avant tout paiement." },
          { title: "Le cadrage", body: "Un premier rendez-vous de 1 h 30 pour analyser ton compte et poser la stratégie." },
          { title: "Le suivi", body: "Un rendez-vous d'une heure tous les quinze jours, et WhatsApp en semaine pour tes contenus au jour le jour." },
        ]}
        forWho={[
          "Tu veux un accès direct à Fred et des décisions rapides",
          "Ton projet, ton marché ou ton expertise demandent un regard sur mesure",
          "Tu peux créer et publier régulièrement pendant l'accompagnement",
        ]}
        notFor={[
          "Tu cherches un cadre collectif à petit prix (vois la Wav Academy)",
          "Tu veux un seul avis ponctuel sur ton compte (vois le One Shot)",
          "Tu cherches une recette miracle sans t'impliquer",
        ]}
        middle={
          <Section variant="dark" size="lg">
            <div className="mx-auto max-w-5xl">
              <SectionHeader
                title="Fred à tes côtés, pour avancer vite et dans la bonne direction."
                subtitle="Analyse de tes contenus, décisions rapides et ajustements toutes les deux semaines : tu ne perds plus de temps à tâtonner, tu as quelqu'un qui connaît ton projet par cœur."
                className="[&_h2]:text-cream [&_p]:text-cream/70"
              />
              <ObjectionCards
                tone="dark"
                items={[
                  {
                    question: "Je ne veux pas devenir un influenceur.",
                    answer: "Pas besoin. Tu restes l'expert ou l'entrepreneur que tu es : on fait des réseaux un levier pour ton projet, avec des contenus qui te ressemblent et qui attirent les bonnes personnes.",
                  },
                  {
                    question: "Une méthode marketing va appauvrir mon sujet.",
                    answer: "Au contraire : on garde toute la richesse de ton sujet et on travaille l'accroche, la structure et la preuve pour qu'il touche enfin le public qu'il mérite.",
                  },
                  {
                    question: "Je n'ai pas le temps de tester au hasard.",
                    answer: "Justement : Fred analyse tes résultats avec toi, repère ce qui marche et te dit quoi faire ensuite. Chaque vidéo te rapproche de ton objectif au lieu de repartir de zéro.",
                  },
                  {
                    question: "Les vues ne paient pas mes factures.",
                    answer: "On part de ton objectif : autorité, demandes ou ventes. Tes contenus sont construits pour le servir, et chaque résultat est lu à travers lui. Des vues qui rapportent, pas juste des vues.",
                  },
                ]}
              />
            </div>
          </Section>
        }
        terms={
          <>
            <p>
              Aucun paiement lors de la demande. Après la réponse de Fred et la proposition acceptée, tu règles
              l'intégralité avant le démarrage : en ligne par carte, {INSTALLMENTS_LABEL} ({INSTALLMENTS_NOTE}), ou par
              virement.
            </p>
            <p>
              Deux nouveaux accompagnements par mois au maximum. La Wav Academy et WavStats ne sont pas inclus.
            </p>
            <p>
              Le démarrage intervient après le délai de rétractation de 14 jours, ou avant sur demande expresse dans
              les conditions des <Link to="/cgv" className="underline">CGV</Link>.
            </p>
          </>
        }
        faq={premiumFaq}
      />
    </>
  );
}
