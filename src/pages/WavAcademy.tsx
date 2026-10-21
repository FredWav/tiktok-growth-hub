import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Section, SectionHeader } from "@/components/ui/section";
import { ObjectionCards } from "@/components/ObjectionCards";
import { OfferPage } from "@/components/offers/OfferPage";
import { seoFor } from "@/config/seo";
import { INSTALLMENTS_LABEL, INSTALLMENTS_NOTE, OFFERS } from "@/config/offers";
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
                title="Un cadre, un collectif et Fred à tes côtés, à vie."
                subtitle="Deux lives par semaine, des retours sur tes vraies vidéos et un groupe qui avance avec toi : tu progresses plus vite que seul, et tu ne lâches plus."
                className="[&_h2]:text-cream [&_p]:text-cream/70"
              />
              <ObjectionCards
                tone="dark"
                items={[
                  {
                    question: "Mon métier est trop particulier pour les recettes TikTok.",
                    answer: "Tant mieux : on part de ton projet, de tes contenus et de ton objectif. Ta stratégie est construite pour toi, pas copiée sur celle d'un autre.",
                  },
                  {
                    question: "Je publie déjà, sans résultats.",
                    answer: "C'est le cas de beaucoup de membres à leur arrivée. En live, Fred et le collectif analysent tes vidéos, repèrent ce qui bloque et te disent quoi tester ensuite. Tu sais enfin quoi changer, vidéo après vidéo.",
                  },
                  {
                    question: "Je n'ai pas le temps d'apprendre un deuxième métier.",
                    answer: "Pas besoin : tu choisis les lives utiles, tu as leurs résumés et tu poses tes questions sur Discord. Fred t'évite des mois d'essais et d'erreurs, toi tu te concentres sur tes vidéos.",
                  },
                  {
                    question: "Pourquoi pas simplement les statistiques et ChatGPT ?",
                    answer: "Ils ne suivent pas tes essais dans le temps et ne te disent pas quoi faire de tes chiffres. L'Academy, c'est un regard humain, un collectif motivant et un cadre pour progresser chaque semaine.",
                  },
                ]}
              />
            </div>
          </Section>
        }
        terms={
          <>
            <p>
              Un seul paiement, sans abonnement ni reconduction : en ligne par carte, {INSTALLMENTS_LABEL} ({INSTALLMENTS_NOTE}),
              ou par virement. L'accès est à vie, tant que la Wav Academy existe.
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
