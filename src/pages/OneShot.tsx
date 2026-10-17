import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { OfferPage } from "@/components/offers/OfferPage";
import { seoFor } from "@/config/seo";
import { INSTALLMENTS_LABEL, INSTALLMENTS_NOTE, OFFERS } from "@/config/offers";

const oneShotFaq = [
  {
    question: "Qu'est-ce que Fred prépare avant le rendez-vous ?",
    answer: "Un audit complet de ton compte : positionnement, profil, contenus, formats, rythme et statistiques disponibles. Il est présenté au début du rendez-vous, pour consacrer le reste de l'appel à la ligne à suivre et à tes questions.",
  },
  {
    question: "Que contient le résumé ?",
    answer: "Les constats, les décisions prises ensemble, les corrections à faire et les réponses à tes questions. Il t'est envoyé dans l'heure qui suit l'appel, pour que tu n'aies rien à noter pendant le rendez-vous.",
  },
  {
    question: "Quelles ressources reçois-tu ?",
    answer: "Selon ce qui ressort de l'audit : cours, guides ou modèles. Elles sont choisies au cas par cas, pas envoyées en lot.",
  },
  {
    question: "Quelle différence avec l'Analyse Express ?",
    answer: "L'Analyse Express est un diagnostic automatisé de ton compte TikTok, à 19,90 €. Le One Shot est un audit humain par Fred, sur TikTok, Instagram ou YouTube, suivi de 1 h 30 d'échange pour décider quoi faire.",
  },
  {
    question: "Et si j'ai besoin d'un suivi ensuite ?",
    answer: "Tu peux continuer avec la Wav Academy (accompagnement collectif à vie) ou le Wav Premium (suivi individuel). Rien n'est imposé : le One Shot se suffit à lui-même.",
  },
  {
    question: "Pourquoi seulement 10 places par mois ?",
    answer: "Chaque audit est préparé à la main par Fred. Dix démarrages par mois, c'est ce qui permet de garder ce niveau de préparation.",
  },
];

export default function OneShot() {
  return (
    <>
      <SEOHead {...seoFor("/one-shot")} />
      <OfferPage
        offer={OFFERS.one_shot}
        title="Un regard expert sur ton compte, et une ligne claire à suivre."
        intro="Fred audite ton compte en profondeur, puis vous passez 1 h 30 ensemble pour corriger ce qui bloque, décider de la suite et répondre à toutes tes questions. Tu repars avec un résumé écrit et les ressources utiles."
        steps={[
          { title: "Ta demande", body: "Tu indiques ton compte, ton objectif et tes disponibilités. Fred te répond personnellement sous deux jours ouvrés." },
          { title: "La date et le paiement", body: "Vous fixez ensemble le rendez-vous, puis tu règles le One Shot pour le confirmer." },
          { title: "L'audit", body: "Fred analyse ton compte avant l'appel : profil, contenus, formats, statistiques." },
          { title: "Le rendez-vous", body: "1 h 30 en visio pour la ligne à suivre et tes questions, puis le résumé écrit dans l'heure." },
        ]}
        forWho={[
          "Tu veux un avis expert et concret, sans engagement dans la durée",
          "Tu as des questions précises sur ton compte ou ta stratégie",
          "Tu publies sur TikTok, Instagram ou YouTube",
        ]}
        notFor={[
          "Tu veux un suivi régulier sur plusieurs semaines (vois la Wav Academy ou le Wav Premium)",
          "Tu cherches seulement un premier diagnostic rapide (vois l'Analyse Express)",
        ]}
        terms={
          <>
            <p>
              Aucun paiement lors de la demande. Une fois la date convenue, tu règles 399 € TTC pour confirmer le
              rendez-vous : en ligne par carte, {INSTALLMENTS_LABEL} ({INSTALLMENTS_NOTE}), ou par virement.
            </p>
            <p>Dix One Shot par mois au maximum. Quand le mois est complet, une date le mois suivant t'est proposée.</p>
            <p>
              Les droits légaux, dont la rétractation, s'appliquent selon les{" "}
              <Link to="/cgv" className="underline">CGV</Link>.
            </p>
          </>
        }
        faq={oneShotFaq}
      />
    </>
  );
}
