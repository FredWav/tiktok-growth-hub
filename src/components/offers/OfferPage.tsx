import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ClientResults } from "@/components/ClientResults";
import { VideoTestimonials } from "@/components/VideoCard";
import { ScreenshotWall } from "@/components/ScreenshotWall";
import { trackCtaClick, trackOfferView, type OfferId } from "@/lib/funnel-events";
import { launchLabel, type Offer, priceLabel } from "@/config/offers";
import { PlacesLeft } from "@/components/offers/PlacesLeft";

export type OfferStep = { title: string; body: string };
export type OfferFaq = { question: string; answer: string };

/**
 * Gabarit commun des pages d'offre :
 * besoin → offre et prix → contenu → déroulement → pour qui → preuves → modalités → FAQ → action.
 * Prix, contenu, capacité et bouton viennent du catalogue (src/config/offers.ts).
 */
export function OfferPage({
  offer,
  title,
  intro,
  steps,
  forWho,
  notFor,
  middle,
  terms,
  faq,
  showProofs = true,
}: {
  offer: Offer;
  title: string;
  intro: string;
  steps: OfferStep[];
  forWho: string[];
  notFor: string[];
  /** Section libre entre « Pour qui » et les preuves (objections, comparaisons…). */
  middle?: ReactNode;
  /** Modalités : paiement, démarrage, rétractation. */
  terms: ReactNode;
  faq: OfferFaq[];
  showProofs?: boolean;
}) {
  const launch = launchLabel(offer);
  const hub = offer.family === "analyses" ? { href: "/analyses", label: "Comparer les analyses" } : { href: "/accompagnements", label: "Comparer les accompagnements" };
  const track = (position: string) => trackCtaClick(offer.cta.href, position);
  useEffect(() => {
    trackOfferView(offer.id as OfferId);
  }, [offer.id]);

  const priceBlock = (
    <div>
      <p className="font-display text-4xl font-semibold text-primary">
        {priceLabel(offer)} <span className="text-base font-normal text-muted-foreground">TTC</span>
      </p>
      <p className="text-sm text-muted-foreground">{offer.priceNote}</p>
      {launch && <p className="mt-1 text-sm font-medium">{launch}</p>}
      <PlacesLeft offer={offer} className="mt-1 text-sm font-medium" />
    </div>
  );

  return (
    <Layout>
      <Section variant="cream" size="xl">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold mb-6">
            {offer.name} · {offer.format.toLowerCase()} · {offer.platforms}
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">{title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">{intro}</p>
          <div className="flex flex-col items-center gap-4">
            {priceBlock}
            <Button asChild variant="hero" size="xl" onClick={() => track("hero")}>
              <Link to={offer.cta.href}>
                {offer.cta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Link to={hub.href} className="inline-flex min-h-11 items-center text-sm text-primary underline">
              {hub.label}
            </Link>
          </div>
        </div>
      </Section>

      <Section size="lg">
        <SectionHeader title="Ce qui est inclus" subtitle={offer.summary} />
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <ul className="space-y-3">
            {offer.includes.map((item) => (
              <li key={item} className="flex gap-3">
                <Check aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-4 rounded-2xl border border-border p-6 text-sm">
            {[
              ["Format", offer.format],
              ["Durée", offer.duration],
              ["Livrable", offer.delivery],
              ["Plateformes", offer.platforms],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="text-muted-foreground">{value}</dd>
              </div>
            ))}
            {offer.excludes?.map((item) => (
              <div key={item} className="flex gap-2 text-muted-foreground">
                <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section variant="cream" size="lg">
        <SectionHeader title="Comment ça se passe" />
        <ol className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-background p-6">
              <p className="font-display text-3xl text-primary">{index + 1}</p>
              <h2 className="mt-2 font-display text-xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section size="lg">
        <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl mb-4">C'est pour toi si…</h2>
            <ul className="space-y-3">
              {forWho.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-4">Ce n'est pas pour toi si…</h2>
            <ul className="space-y-3 text-muted-foreground">
              {notFor.map((item) => (
                <li key={item} className="flex gap-3">
                  <X aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {middle}

      {showProofs && (
        <Section variant="cream" size="lg">
          <SectionHeader
            title="Ce qu'en disent les personnes accompagnées"
            subtitle="Résultats historiques, replacés dans leur contexte. Ils ne garantissent pas les tiens."
          />
          <ClientResults limit={3} offer={offer.id} />
          <VideoTestimonials
            offer={offer.id}
            limit={3}
            location={`offre_${offer.id}`}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10"
          />
          {/* Messages de clients rattachés à l'offre (display_locations contient son identifiant). */}
          <ScreenshotWall
            location={offer.id}
            title="Leurs messages"
            subtitle="Des retours authentiques, sans filtre."
            className="mt-12"
            cols={2}
          />
          <div className="mt-8 text-center">
            <Link to="/temoignages" className="inline-flex min-h-11 items-center text-primary underline">
              Voir tous les témoignages
            </Link>
          </div>
        </Section>
      )}

      <Section size="lg">
        <div id="modalites" className="scroll-mt-24 mx-auto max-w-2xl rounded-2xl border-2 border-primary p-6 md:p-10">
          <h2 className="font-display text-3xl mb-4">{offer.name}</h2>
          {priceBlock}
          <div className="my-6 space-y-3 text-sm text-muted-foreground">{terms}</div>
          <Button asChild variant="hero" size="xl" className="w-full whitespace-normal h-auto min-h-12" onClick={() => track("terms")}>
            <Link to={offer.cta.href}>{offer.cta.label}</Link>
          </Button>
        </div>
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
    </Layout>
  );
}
