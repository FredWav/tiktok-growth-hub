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

/** Capture UTM params from URL into localStorage (call once on app mount) */
export function captureUtmParams() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const campaign = params.get("utm_campaign");
  if (source) localStorage.setItem("utm_source", source);
  if (campaign) localStorage.setItem("utm_campaign", campaign);
}

/** Returns a formatted string from stored UTM params, or "" */
export function getStoredUtmSource(): string {
  if (typeof window === "undefined") return "";
  const source = localStorage.getItem("utm_source");
  const campaign = localStorage.getItem("utm_campaign");
  if (!source) return "";
  return campaign ? `${source} (${campaign})` : source;
}
