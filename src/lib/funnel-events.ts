import { trackEvent } from "./tracking";
import { offerFromHref, type OfferId } from "./funnel-offers";

export { offerFromHref, type OfferId };

/**
 * Vocabulaire commun du parcours commercial, lu par la page Statistiques de l'admin.
 *
 * Les mêmes étapes pour toutes les offres :
 *   offer_view → cta_click → form_start → application_submit | checkout_start → paiement
 * Le paiement n'est jamais un événement navigateur : il est compté en base, après
 * confirmation de Stripe. Aucune donnée saisie dans un formulaire n'est envoyée.
 */
export const FUNNEL_EVENTS = {
  offerView: "offer_view",
  ctaClick: "cta_click",
  formStart: "form_start",
  applicationSubmit: "application_submit",
  checkoutStart: "checkout_start",
  resourceView: "resource_view",
} as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

function currentPath(): string {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

/** Une page d'offre est affichée. */
export function trackOfferView(offer: OfferId) {
  trackEvent(FUNNEL_EVENTS.offerView, { offer, source_page: currentPath() });
}

/**
 * Clic sur un bouton ou un lien commercial. `position` dit où il se trouve sur la
 * page (hero, bas de page, article…), `contentSlug` l'article d'origine s'il y en a un.
 */
export function trackCtaClick(href: string, position: string, contentSlug?: string) {
  trackEvent(FUNNEL_EVENTS.ctaClick, {
    offer: offerFromHref(href),
    target: href,
    position,
    source_page: currentPath(),
    ...(contentSlug ? { content_slug: contentSlug } : {}),
  });
}

/** Première saisie dans un formulaire (une fois par affichage de la page). */
export function trackFormStart(offer: OfferId) {
  trackEvent(FUNNEL_EVENTS.formStart, { offer, source_page: currentPath() });
}

/** Demande enregistrée par le serveur (candidature, demande de conseil). */
export function trackApplicationSubmit(offer: OfferId) {
  trackEvent(FUNNEL_EVENTS.applicationSubmit, { offer, source_page: currentPath() });
}

/** Le visiteur part vers la page de paiement Stripe. */
export function trackCheckoutStart(offer: OfferId) {
  trackEvent(FUNNEL_EVENTS.checkoutStart, { offer, source_page: currentPath() });
}

/** Un article ou la page des ressources est lu. */
export function trackResourceView(contentSlug: string) {
  trackEvent(FUNNEL_EVENTS.resourceView, { content_slug: contentSlug, source_page: currentPath() });
}
