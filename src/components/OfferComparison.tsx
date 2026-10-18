import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { launchLabel, type Offer, priceLabel } from "@/config/offers";
import { PlacesLeft } from "@/components/offers/PlacesLeft";

/**
 * Cartes de comparaison d'une famille d'offres (analyses ou accompagnements).
 *
 * Prix, mention de lancement, capacité et boutons viennent de src/config/offers.ts :
 * une offre affiche donc partout les mêmes informations.
 */
export function OfferComparison({
  offers,
  location = "home",
  detailed = false,
}: {
  offers: Offer[];
  location?: string;
  /** Liste aussi le contenu de chaque offre (pages /analyses et /accompagnements). */
  detailed?: boolean;
}) {
  const columns = offers.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className={`grid gap-6 ${columns} max-w-6xl mx-auto items-stretch`}>
      {offers.map((offer) => {
        const launch = launchLabel(offer);
        return (
          <div
            key={offer.id}
            className={`rounded-2xl p-6 flex flex-col relative bg-background ${
              offer.featured
                ? "border-2 border-primary shadow-lg shadow-primary/10"
                : "border border-border shadow-sm"
            }`}
          >
            {offer.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                  Recommandé
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground italic mb-4 min-h-[3rem] flex items-start gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>« {offer.need} »</span>
            </p>

            <h3 className="font-display text-xl font-semibold mb-1">{offer.name}</h3>
            <p className="font-display text-2xl font-bold text-primary">{priceLabel(offer)}</p>
            <p className="text-xs text-muted-foreground mb-1">{offer.priceNote}</p>
            {launch && <p className="text-xs font-medium text-foreground/80 mb-1">{launch}</p>}
            <PlacesLeft offer={offer} className="text-xs font-medium text-foreground/80" />

            <p className="text-sm text-muted-foreground mt-4 mb-4">{offer.summary}</p>

            {detailed && (
              <ul className="space-y-2 text-sm mb-6">
                {offer.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground mb-5">
              {offer.format} · {offer.platforms}
            </p>

            <div className="mt-auto space-y-2">
              <Button
                variant={offer.featured ? "hero" : "outline"}
                size="lg"
                className="w-full"
                asChild
                onClick={() => trackEvent("click_offer_compare", { offer: offer.id, location, target: "cta" })}
              >
                <Link to={offer.cta.href}>
                  {offer.cta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {offer.cta.href !== offer.href && (
                <Link
                  to={offer.href}
                  className="flex min-h-11 items-center justify-center text-sm font-medium text-primary hover:underline"
                  onClick={() => trackEvent("click_offer_compare", { offer: offer.id, location, target: "details" })}
                >
                  Voir le détail
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
