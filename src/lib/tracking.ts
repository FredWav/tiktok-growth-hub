import { trackPostHogEvent, registerSuperProperties } from "./posthog";

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

// ── Attribution ──────────────────────────────────────────────────────────────
// Capturée côté client dans localStorage. On distingue le first-touch (première
// campagne qui a amené la personne) et le last-touch (la plus récente), et on
// applique une expiration : une vieille campagne ne doit plus créditer des
// visites directes des mois plus tard.

const ATTR_KEY = "fw_attribution";
const ATTR_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLICK_ID_KEYS = ["gclid", "fbclid", "ttclid", "msclkid"] as const;

type Touch = {
  at: string; // ISO
  landing: string;
  params: Record<string, string>;
};
type Attribution = { first?: Touch; last?: Touch };

function readAttribution(): Attribution {
  try {
    return JSON.parse(localStorage.getItem(ATTR_KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}

/** Capture UTM + identifiants publicitaires depuis l'URL (appeler au montage). */
export function captureUtmParams() {
  if (typeof window === "undefined") return;
  const search = new URLSearchParams(window.location.search);

  const params: Record<string, string> = {};
  [...UTM_KEYS, ...CLICK_ID_KEYS].forEach((k) => {
    const v = search.get(k);
    if (v) params[k] = v;
  });

  // Rien à capturer sur cette visite → on ne touche à rien (le last-touch existant reste).
  if (Object.keys(params).length === 0) return;

  const touch: Touch = {
    at: new Date().toISOString(),
    landing: window.location.pathname,
    params,
  };

  const attr = readAttribution();
  const next: Attribution = { first: attr.first ?? touch, last: touch };
  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(next));
  } catch {
    // localStorage plein / bloqué : on ignore
  }

  // Rétro-compat : page-tracker et getStoredUtmSource lisent encore ces clés simples.
  if (params.utm_source) localStorage.setItem("utm_source", params.utm_source);
  if (params.utm_medium) localStorage.setItem("utm_medium", params.utm_medium);
  if (params.utm_campaign) localStorage.setItem("utm_campaign", params.utm_campaign);
}

/** Last-touch encore valide (non expiré), ou null. */
function freshLastTouch(): Touch | null {
  const { last } = readAttribution();
  if (!last) return null;
  if (Date.now() - new Date(last.at).getTime() > ATTR_TTL_MS) return null;
  return last;
}

/** UTM à écrire sur une page_view (last-touch, expiration prise en compte). */
export function getStoredUtmForPageView(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  const last = freshLastTouch();
  const p = last?.params ?? {};
  return {
    utm_source: p.utm_source ?? null,
    utm_medium: p.utm_medium ?? null,
    utm_campaign: p.utm_campaign ?? null,
  };
}

/** Chaîne source lisible pour rattacher un lead (last-touch non expiré). */
export function getStoredUtmSource(): string {
  if (typeof window === "undefined") return "";
  const last = freshLastTouch();
  const source = last?.params.utm_source;
  const campaign = last?.params.utm_campaign;
  if (!source) return "";
  return campaign ? `${source} (${campaign})` : source;
}

/** Attribution complète (first + last touch, non expirée) à pousser vers PostHog. */
export function getAttributionProperties(): Record<string, string> {
  const attr = readAttribution();
  const out: Record<string, string> = {};
  const flatten = (touch: Touch | undefined, prefix: "ft" | "lt") => {
    if (!touch) return;
    out[`${prefix}_at`] = touch.at;
    out[`${prefix}_landing`] = touch.landing;
    Object.entries(touch.params).forEach(([k, v]) => {
      out[`${prefix}_${k}`] = v;
    });
  };
  flatten(attr.first, "ft");
  const last = freshLastTouch() ?? undefined;
  flatten(last, "lt");
  return out;
}

/** Pousse l'attribution comme super-propriétés PostHog (no-op si PostHog non initialisé). */
export function syncAttributionToPostHog() {
  const props = getAttributionProperties();
  if (Object.keys(props).length) registerSuperProperties(props);
}
