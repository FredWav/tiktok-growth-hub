/**
 * Offre visée par un lien du site. Module sans import : il est aussi chargé par
 * les tests Node (tests/statistiques-posthog.test.ts).
 */

/** Mêmes identifiants qu'en base (commerce_orders.offer, commerce_applications.offer). */
export type OfferId = "video" | "express" | "one_shot" | "academy" | "premium" | "conseil";
/** Pages qui regroupent plusieurs offres. */
type HubId = "analyses" | "accompagnements";

const OFFER_PATHS: [RegExp, OfferId | HubId][] = [
  [/^\/analyse-video(\/|$)/, "video"],
  [/^\/analyse-express(\/|$)/, "express"],
  [/^\/one-shot(\/|$)/, "one_shot"],
  [/^\/(wavacademy|academy)(\/|$)/, "academy"],
  [/^\/wav-premium(\/|$)/, "premium"],
  [/^\/analyses(\/|$)/, "analyses"],
  [/^\/accompagnements(\/|$)/, "accompagnements"],
];

const APPLICATION_OFFERS = new Set<string>(["one_shot", "academy", "premium"]);

/** Offre visée par un lien du site (« /candidature?offre=premium » compris), ou « autre ». */
export function offerFromHref(href: string): OfferId | HubId | "autre" {
  const url = new URL(href, "https://fredwav.com");
  if (url.pathname === "/candidature") {
    const offer = url.searchParams.get("offre") ?? "";
    return APPLICATION_OFFERS.has(offer) ? (offer as OfferId) : "conseil";
  }
  return OFFER_PATHS.find(([pattern]) => pattern.test(url.pathname))?.[1] ?? "autre";
}
