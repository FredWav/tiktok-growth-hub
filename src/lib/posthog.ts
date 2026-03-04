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

export function capturePageview() {
  if (initialized) {
    posthog.capture("$pageview");
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
