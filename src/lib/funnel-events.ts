import { trackEvent } from "./tracking";

/**
 * Stable acquisition/conversion vocabulary.
 *
 * Legacy analytics events remain available while dashboards migrate, but new
 * SEO and funnel surfaces should use one of these names so the journey can be
 * compared from an article through to a paid offer.
 */
export const FUNNEL_EVENTS = {
  resourceView: "resource_view",
  expressCtaClick: "express_cta_click",
  expressCheckoutStart: "express_checkout_start",
  expressPurchase: "express_purchase",
  expressResultView: "express_result_view",
  academyCtaClick: "academy_cta_click",
  academyCheckoutStart: "academy_checkout_start",
  academyPurchase: "academy_purchase",
  premiumApplicationStart: "premium_application_start",
  premiumApplicationSubmit: "premium_application_submit",
  newsletterOptIn: "newsletter_opt_in",
} as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

export type FunnelEventProperties = Record<string, string> & {
  source_page?: string;
  position?: string;
  content_slug?: string;
};

export function trackFunnelEvent(event: FunnelEventName, properties: FunnelEventProperties = {}) {
  trackEvent(event, properties);
}
