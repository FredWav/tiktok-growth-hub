import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { OfferComparison } from "@/components/OfferComparison";
import { seoFor } from "@/config/seo";
import { ANALYSES } from "@/config/offers";

const faq = [
  {
    question: "Quelle analyse choisir ?",
    answer: "Une vidéo précise t'intrigue (elle a décroché, ou au contraire bien marché) : l'Analyse vidéo. Tu veux comprendre ton compte dans son ensemble et savoir quoi prioriser : l'Analyse Express.",
  },
  {
    question: "Qui fait l'analyse ?",
    answer: "Les deux analyses sont automatisées : elles s'appuient sur les métriques publiques de TikTok et sur la méthode de Fred. Pour un audit humain par Fred, c'est le One Shot.",
  },
  {
    question: "De quoi as-tu besoin ?",
    answer: "Du lien de ta vidéo TikTok, ou du nom de ton compte TikTok, et d'une adresse e-mail. Ton compte et tes vidéos doivent être publics. Aucun mot de passe n'est demandé.",
  },
  {
    question: "En combien de temps reçois-tu le rapport ?",
    answer: "En quelques minutes en fonctionnement normal, par e-mail, avec un lien vers ton rapport en ligne et son PDF.",
  },
  {
    question: "Et Instagram ou YouTube ?",
    answer: "Les analyses automatisées couvrent TikTok uniquement pour le moment. Les accompagnements, eux, couvrent TikTok, Instagram et YouTube.",
  },
];

export default function Analyses() {
  return (
    <Layout>
      <SEOHead {...seoFor("/analyses")} />
      <Section variant="cream" size="xl">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold mb-6">Analyses automatisées · TikTok</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Comprends ce qui bloque, vidéo par vidéo ou sur tout ton compte.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Deux analyses automatisées, sans abonnement, livrées en quelques minutes. Tu sais quoi corriger sur ta
            prochaine vidéo.
          </p>
        </div>
      </Section>

      <Section size="lg">
        <OfferComparison offers={ANALYSES} location="analyses" detailed />
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader title="Questions fréquentes" />
        <div className="mx-auto max-w-3xl space-y-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-xl border border-border bg-background p-5">
              <summary className="cursor-pointer list-none pr-8 font-semibold marker:content-none">{item.question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section size="lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl mb-4">Tu veux un regard humain sur ton compte ?</h2>
          <p className="text-muted-foreground mb-6">
            Avec le One Shot, Fred audite ton compte lui-même et passe 1 h 30 avec toi pour fixer la ligne à suivre.
          </p>
          <Link to="/accompagnements" className="inline-flex min-h-11 items-center font-semibold text-primary underline">
            Voir les accompagnements
          </Link>
        </div>
      </Section>
    </Layout>
  );
}
