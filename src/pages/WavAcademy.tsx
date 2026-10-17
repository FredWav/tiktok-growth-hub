import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { ObjectionCards } from "@/components/ObjectionCards";
import { OfferPage } from "@/components/offers/OfferPage";
import { seoFor } from "@/config/seo";
import { OFFERS } from "@/config/offers";
import { WAVACADEMY_FAQ } from "@/config/wavacademy-faq";

export default function WavAcademy() {
  const [params] = useSearchParams();
  return (
    <>
      <SEOHead {...seoFor("/wavacademy")} />
      {params.get("success") === "true" && (
        <div role="status" className="container pt-24 pb-2">
          Retour du paiement reçu. La confirmation et tes accès arrivent par e-mail après vérification du règlement.
        </div>
      )}
      <OfferPage
        offer={OFFERS.academy}
        title="Progresse dans la durée, avec un cadre et un groupe, sans y passer ta vie."
        intro="Tu n'as pas besoin de devenir influenceur à plein temps. Tu as besoin de rendez-vous réguliers, de retours et d'une stratégie qui évolue avec tes résultats. La Wav Academy t'accompagne à vie, en un seul paiement."
        steps={[
          { title: "Tu rejoins le Discord", body: "Tu accèdes au collectif, aux cours et à toutes les ressources dès ton entrée." },
          { title: "On pose ta stratégie", body: "Tu présentes ton projet et tes contenus ; la stratégie se construit avec Fred et le collectif." },
          { title: "Tu publies et tu montres", body: "Deux lives par semaine pour analyser vos contenus, et tes questions sur Discord en semaine." },
          { title: "On ajuste avec tes résultats", body: "Chaque essai est relu, la stratégie évolue. C'est un accompagnement dans le temps, pas un programme qui s'arrête." },
        ]}
        forWho={[
          "Tu publies déjà ou tu as un projet concret à lancer",
          "Tu veux un cadre régulier et des retours sur tes vrais contenus",
          "Tu es prêt à créer, tester et appliquer entre les lives",
          "TikTok, Instagram ou YouTube, débutant ou déjà lancé",
        ]}
        notFor={[
          "Tu cherches un accompagnement individuel en tête-à-tête (vois le Wav Premium)",
          "Tu attends une recette pour devenir viral sans tester",
          "Tu n'as pas de temps pour créer et publier en ce moment",
        ]}
        middle={
          <Section variant="dark" size="lg">
            <div className="mx-auto max-w-5xl">
              <SectionHeader
                title="Pas de recette magique. Une façon plus lucide d'avancer."
                subtitle="L'Academy ne décide ni de ton expertise ni de tes opinions. Elle t'aide à mieux les transmettre et à sortir de l'essai-erreur aveugle."
                className="[&_h2]:text-cream [&_p]:text-cream/70"
              />
              <ObjectionCards
                tone="dark"
                items={[
                  {
                    question: "Mon métier est trop particulier pour les recettes TikTok.",
                    answer: "On part de ton projet, de tes contenus et de ton objectif. Les méthodes servent à structurer tes essais, pas à effacer ton contexte.",
                  },
                  {
                    question: "Personne ne peut prédire l'algorithme.",
                    answer: "C'est vrai. L'objectif est de lire les signaux disponibles, formuler une hypothèse et choisir le prochain test. Tu réduis la part de hasard sans prétendre la supprimer.",
                  },
                  {
                    question: "Je n'ai pas le temps d'apprendre un deuxième métier.",
                    answer: "Tu choisis les lives utiles, tu as leurs résumés et tu poses tes questions sur Discord. Il faut seulement garder du temps pour créer, publier et appliquer.",
                  },
                  {
                    question: "Pourquoi pas simplement les statistiques et ChatGPT ?",
                    answer: "Ils restent utiles, mais ne suivent pas tes essais dans le temps. L'Academy ajoute un regard humain, un collectif et un cadre pour décider quoi tester ensuite.",
                  },
                ]}
              />
            </div>
          </Section>
        }
        terms={
          <>
            <p>
              Un seul paiement, sans abonnement ni reconduction : en ligne par carte, en 3 fois avec Klarna (sous réserve
              d'acceptation par Klarna) ou par virement. L'accès est à vie, tant que la Wav Academy existe.
            </p>
            <p>
              Places limitées à 5 nouveaux membres par mois pour garder des lives où chacun est écouté. Quand le mois est
              complet, ta place est réservée pour le mois suivant.
            </p>
            <p>
              Les droits légaux, dont la rétractation, s'appliquent selon les{" "}
              <Link to="/cgv" className="underline">CGV</Link>. Aucun résultat n'est garanti.
            </p>
          </>
        }
        faq={WAVACADEMY_FAQ}
      />
    </>
  );
}
