import { trackPostHogEvent } from "./posthog";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(event: string, data?: Record<string, string>) {
  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, data);
  }
  // PostHog
  trackPostHogEvent(event, data);
}
