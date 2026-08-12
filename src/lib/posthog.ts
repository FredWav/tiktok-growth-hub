type PostHogClient = typeof import("posthog-js")["default"];
type PostHogProperties = import("posthog-js").Properties;

const POSTHOG_KEY = "phc_PtioXOoY4oT3GYJsV7xTpI3a2fscFeJfX6mzFGMWGDj";
const POSTHOG_HOST = "https://us.i.posthog.com";

let client: PostHogClient | null = null;
let loading: Promise<PostHogClient | null> | null = null;

function runWhenReady(action: (posthog: PostHogClient) => void) {
  if (client) {
    action(client);
    return;
  }

  // Une action demandée juste après `initPostHog` (opt-in, attribution ou
  // premier pageview) doit attendre le chunk. Avant consentement, `loading`
  // reste null et l'action est volontairement abandonnée.
  if (loading) {
    void loading.then((posthog) => {
      if (posthog) action(posthog);
    });
  }
}

export function initPostHog(): Promise<void> {
  if (typeof window === "undefined" || client) return Promise.resolve();

  if (!loading) {
    loading = import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: true,
          persistence: "localStorage+cookie",
        });
        client = posthog;
        return posthog;
      })
      .catch((error) => {
        console.error("[posthog] Chargement impossible.", error);
        loading = null;
        return null;
      });
  }

  return loading.then(() => undefined);
}

export function trackPostHogEvent(event: string, properties?: PostHogProperties) {
  runWhenReady((posthog) => posthog.capture(event, properties));
}

export function identifyUser(distinctId: string, properties?: PostHogProperties) {
  runWhenReady((posthog) => posthog.identify(distinctId, properties));
}

/** Attache des propriétés à la personne sans changer son distinct_id. */
export function setUserProperties(properties: Record<string, unknown>) {
  runWhenReady((posthog) => posthog.setPersonProperties(properties));
}

/** Super-propriétés attachées à tous les événements suivants. */
export function registerSuperProperties(properties: Record<string, unknown>) {
  runWhenReady((posthog) => posthog.register(properties));
}

export function capturePageview() {
  runWhenReady((posthog) => posthog.capture("$pageview"));
}

export function optOutPostHog() {
  runWhenReady((posthog) => {
    try {
      posthog.opt_out_capturing();
    } catch {
      // Le stockage peut être désactivé par le navigateur.
    }
  });
}

export function optInPostHog() {
  runWhenReady((posthog) => {
    try {
      posthog.opt_in_capturing();
    } catch {
      // Le stockage peut être désactivé par le navigateur.
    }
  });
}

export function getPostHogId(): string | null {
  if (!client) return null;

  try {
    return client.get_distinct_id() || null;
  } catch {
    return null;
  }
}
