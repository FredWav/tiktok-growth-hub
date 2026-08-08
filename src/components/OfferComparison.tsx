import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { OFFER_TIERS } from "@/config/offers";

/**
 * Comparateur des trois besoins couverts par les offres.
 *
 * Il existe parce que la home n'exposait que l'Analyse Express et le Wav Premium :
 * un visiteur situé entre les deux n'avait aucun chemin. Prix et libellés viennent
 * de src/config/offers.ts pour rester alignés partout.
 */
export function OfferComparison({ location = "home" }: { location?: string }) {
  const trackOfferClick = (name: string) => {
    trackEvent("click_offer_compare", { offer: name, location });
    const event = name === "Wav Academy"
      ? "cta_academy_click"
      : name === "Wav Premium"
        ? "cta_premium_click"
        : "cta_express_click";
    trackEvent(event, { location: `${location}_comparison` });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
      {OFFER_TIERS.map((tier) => (
        <div
          key={tier.name}
          className={`rounded-2xl p-6 flex flex-col relative bg-background ${
            tier.featured
              ? "border-2 border-primary shadow-lg shadow-primary/10 md:scale-105 order-first md:order-none"
              : "border border-border shadow-sm"
          }`}
        >
          {tier.featured && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                Offre principale
              </span>
            </div>
          )}

          <p className="text-sm text-muted-foreground italic mb-4 min-h-[3rem] flex items-start gap-2">
            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>« {tier.need} »</span>
          </p>

          <h3 className="font-display text-xl font-semibold mb-1">{tier.name}</h3>
          {tier.price && <p className="font-display text-2xl font-bold text-primary mb-4">{tier.price}</p>}
          <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
          {tier.note && <p className="text-xs font-medium text-foreground/70 mb-5">{tier.note}</p>}

          <Button
            variant={tier.featured ? "hero" : "outline"}
            size="lg"
            className="w-full mt-auto"
            asChild
            onClick={() => trackOfferClick(tier.name)}
          >
            <Link to={tier.href}>
              {tier.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
