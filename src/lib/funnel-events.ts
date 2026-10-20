import { useEffect } from "react";
import { trackEvent } from "./tracking";
import { offerFromHref, type OfferId } from "./funnel-offers";
import { markFormDone } from "./form-tracking";

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

// form_start, form_field, form_error, form_abandon : voir src/lib/form-tracking.ts.

/** Demande enregistrée par le serveur (candidature, demande de conseil). */
export function trackApplicationSubmit(offer: OfferId) {
  markFormDone(offer);
  trackEvent(FUNNEL_EVENTS.applicationSubmit, { offer, source_page: currentPath() });
}

const checkoutKey = (offer: OfferId) => `fw_checkout_${offer}`;

/** Le visiteur part vers la page de paiement Stripe. */
export function trackCheckoutStart(offer: OfferId) {
  markFormDone(offer);
  try {
    sessionStorage.setItem(checkoutKey(offer), String(Date.now()));
  } catch {
    // Stockage indisponible : le retour sans paiement ne sera pas repéré.
  }
  trackEvent(FUNNEL_EVENTS.checkoutStart, { offer, source_page: currentPath() });
}

/**
 * Revenu sur la page de commande après être parti payer, sans passer par la page
 * de confirmation : retour arrière ou annulation sur Stripe. À appeler à l'affichage
 * de la page de commande (et à son retour depuis le cache du navigateur).
 */
export function detectCheckoutBack(offer: OfferId) {
  try {
    const at = Number(sessionStorage.getItem(checkoutKey(offer)));
    if (!at) return;
    sessionStorage.removeItem(checkoutKey(offer));
    trackEvent("checkout_back", { offer, seconds_away: String(Math.round((Date.now() - at) / 1000)), source_page: currentPath() });
  } catch {
    // Stockage indisponible.
  }
}

/** Repère un retour sans paiement, y compris quand le navigateur réaffiche la page depuis son cache. */
export function useCheckoutBack(offer: OfferId) {
  useEffect(() => {
    detectCheckoutBack(offer);
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) detectCheckoutBack(offer); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [offer]);
}

/** Page de confirmation atteinte : ce n'est pas un retour sans paiement (le paiement fait foi en base). */
export function clearCheckoutPending(offer: OfferId) {
  try {
    sessionStorage.removeItem(checkoutKey(offer));
  } catch {
    // Stockage indisponible.
  }
}

/** Un article ou la page des ressources est lu. */
export function trackResourceView(contentSlug: string) {
  trackEvent(FUNNEL_EVENTS.resourceView, { content_slug: contentSlug, source_page: currentPath() });
}
