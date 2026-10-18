import { capacityLabel, type Offer } from "@/config/offers";
import { placesSentence, usePlaces } from "@/lib/places";

/**
 * Compteur réel des places du mois (jamais une fausse rareté). Au rendu statique
 * et tant que la lecture n'a pas abouti, on affiche la capacité mensuelle.
 */
export function PlacesLeft({ offer, className }: { offer: Offer; className?: string }) {
  const places = usePlaces();
  const fallback = capacityLabel(offer);
  if (!fallback) return null;
  const live = offer.id === "one_shot" || offer.id === "academy" || offer.id === "premium"
    ? placesSentence(places?.[offer.id])
    : null;
  return (
    <p className={className} aria-live="polite">
      {live ?? fallback}
    </p>
  );
}
