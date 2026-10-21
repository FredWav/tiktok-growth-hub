import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { SEOHead } from "@/components/SEOHead";
import { OfferComparison } from "@/components/OfferComparison";
import { seoFor } from "@/config/seo";
import { ACCOMPAGNEMENTS, OFFERS, priceLabel } from "@/config/offers";
import { monthName, usePlaces } from "@/lib/places";

const ids = ["one_shot", "academy", "premium"] as const;

/** Places réelles du mois en cours ; capacité mensuelle tant que la lecture n'a pas abouti. */
function PlacesThisMonth({ id }: { id: (typeof ids)[number] }) {
  const [current, ...later] = usePlaces()?.[id]?.months ?? [];
  if (!current) return <>Jusqu'à {OFFERS[id].capacityPerMonth}</>;
  if (current.remaining > 0) return <>{current.remaining} sur {current.capacity}</>;
  const next = later.find((m) => m.remaining > 0);
  return <>Complet{next ? ` · places en ${monthName(next.month)}` : " · liste d'attente"}</>;
}

const rows: [string, (id: (typeof ids)[number]) => ReactNode][] = [
  ["Format", (id) => OFFERS[id].format],
  ["Durée", (id) => OFFERS[id].duration],
  ["Rendez-vous", (id) => ({ one_shot: "1 rendez-vous de 1 h 30", academy: "2 lives collectifs par semaine", premium: "3 minimum : 1 h 30 puis 1 h tous les 15 jours" } as Record<string, string>)[id]],
  ["Suivi entre les rendez-vous", (id) => ({ one_shot: "Résumé écrit dans l'heure", academy: "Discord en semaine, réponse sous 2 jours ouvrés", premium: "WhatsApp en semaine, réponse sous 1 jour ouvré" } as Record<string, string>)[id]],
  ["Places disponibles ce mois-ci", (id) => <PlacesThisMonth id={id} />],
  ["Prix", (id) => priceLabel(OFFERS[id])],
  ["Pour commencer", (id) => (OFFERS[id].cta.href.startsWith("/candidature") ? "Demande, puis réponse de Fred" : "Inscription directe")],
];

export default function Accompagnements() {
  return (
    <Layout>
      <SEOHead {...seoFor("/accompagnements")} />
      <Section variant="cream" size="xl">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold mb-6">Accompagnements · TikTok, Instagram et YouTube</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Travailler avec Fred : trois façons, selon ton besoin.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Un audit ponctuel, un accompagnement collectif à vie ou un suivi individuel : choisis la formule qui te
            fera passer un cap. Les trois partent de tes vraies vidéos et de ton objectif.
          </p>
        </div>
      </Section>

      <Section size="lg">
        <OfferComparison offers={ACCOMPAGNEMENTS} location="accompagnements" detailed />
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader title="Comparer en un coup d'œil" />
        <div className="mx-auto max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-3 text-left" />
                {ids.map((id) => (
                  <th key={id} scope="col" className="p-3 text-left font-display text-base">
                    <Link to={OFFERS[id].href} className="hover:text-primary">{OFFERS[id].name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t border-border">
                  <th scope="row" className="p-3 text-left font-semibold">{label}</th>
                  {ids.map((id) => (
                    <td key={id} className="p-3 text-muted-foreground">{value(id)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section size="lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl mb-4">Tu hésites entre deux formules ?</h2>
          <p className="text-muted-foreground mb-6">
            Décris ton projet en quelques lignes : Fred te répond personnellement et t'oriente vers la formule qui te
            correspond, sans engagement.
          </p>
          <Link to="/candidature?offre=conseil" className="inline-flex min-h-11 items-center font-semibold text-primary underline">
            Demander conseil à Fred
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            Tu préfères commencer seul ? Les{" "}
            <Link to="/analyses" className="underline">analyses automatisées</Link> donnent un premier diagnostic dès 2,90 €.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
