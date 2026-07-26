import posthog from "posthog-js";

const POSTHOG_KEY = "phc_PtioXOoY4oT3GYJsV7xTpI3a2fscFeJfX6mzFGMWGDj";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We handle pageviews manually via router
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

export function trackPostHogEvent(event: string, properties?: Record<string, any>) {
  if (initialized) {
    posthog.capture(event, properties);
  }
}

export function identifyUser(distinctId: string, properties?: Record<string, any>) {
  if (initialized) {
    posthog.identify(distinctId, properties);
  }
}

/**
 * Attache des propriétés à la personne SANS changer le distinct_id (on garde
 * l'identifiant anonyme). Sert à enregistrer email/nom sans faire de l'email
 * la clé d'identité PostHog.
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (initialized) {
    posthog.setPersonProperties(properties);
  }
}

/** Super-propriétés attachées à TOUS les events suivants (ex. attribution). */
export function registerSuperProperties(properties: Record<string, unknown>) {
  if (initialized) {
    posthog.register(properties);
  }
}

export function capturePageview() {
  if (initialized) {
    posthog.capture("$pageview");
  }
}

/** Retrait du consentement : coupe la capture PostHog sans recharger la page. */
export function optOutPostHog() {
  if (!initialized) return;
  try {
    posthog.opt_out_capturing();
  } catch {
    // no-op
  }
}

/** Ré-activation de la capture après un nouveau consentement. */
export function optInPostHog() {
  if (!initialized) return;
  try {
    posthog.opt_in_capturing();
  } catch {
    // no-op
  }
}

export function getPostHogId(): string | null {
  if (initialized) {
    try {
      return posthog.get_distinct_id() || null;
    } catch {
      return null;
    }
  }
  return null;
}
