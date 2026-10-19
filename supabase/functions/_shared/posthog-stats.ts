/**
 * Statistiques du site lues dans PostHog (projet fredwav.com), côté serveur.
 *
 * Module sans dépendance à Deno : il est aussi chargé par les tests Node.
 * Les requêtes ne lisent que des nombres agrégés, jamais de données personnelles.
 * Seuls les visiteurs qui ont accepté les cookies sont comptés : PostHog n'est
 * chargé qu'après ce consentement.
 */

export type StatsRange = { from: string; to: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Jour courant à Paris, au format AAAA-MM-JJ. */
export function todayInParis(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}

/** Valide une période (dates incluses). Toute valeur hors format est refusée. */
export function parseRange(from: unknown, to: unknown, today: string): StatsRange {
  if (typeof from !== "string" || typeof to !== "string" || !DAY.test(from) || !DAY.test(to)) {
    throw new Error("Période invalide : dates attendues au format AAAA-MM-JJ.");
  }
  if (Number.isNaN(Date.parse(`${from}T00:00:00Z`)) || Number.isNaN(Date.parse(`${to}T00:00:00Z`))) {
    throw new Error("Période invalide.");
  }
  if (from > to) throw new Error("Période invalide : la date de début est après la date de fin.");
  if (to > today) throw new Error("Période invalide : la date de fin est dans le futur.");
  if (from < addDays(to, -(MAX_DAYS - 1))) throw new Error(`Période trop longue (${MAX_DAYS} jours au plus).`);
  return { from, to };
}

const HOST = /^[a-z0-9.-]+$/;

/**
 * Bornes de la période en heure de Paris : [from 00:00, to + 1 jour 00:00), et, en
 * production, seulement les visites du vrai site (pas celles du site de test).
 */
function within(range: StatsRange, siteHost?: string): string {
  const host = siteHost && HOST.test(siteHost) ? ` AND properties.$host IN ('${siteHost}', 'www.${siteHost}')` : "";
  return `timestamp >= toDateTime('${range.from} 00:00:00', 'Europe/Paris')`
    + ` AND timestamp < toDateTime('${addDays(range.to, 1)} 00:00:00', 'Europe/Paris')${host}`;
}

/**
 * Correspondance entre le vocabulaire commun (src/lib/funnel-events.ts) et les
 * anciens noms d'événements du site Lovable, pour garder l'historique comparable.
 */
const STEP_EVENTS: Record<string, string[]> = {
  offer_view: ["offer_view", "video_page_view"],
  cta_click: ["cta_click", "express_cta_click", "video_cta_click", "academy_cta_click", "cta_academy_click"],
  form_start: ["form_start", "video_form_started"],
  application_submit: ["application_submit", "application_saved", "academy_application_saved", "orientation_form_submitted"],
  checkout_start: ["checkout_start", "express_checkout_start", "video_checkout_start", "checkout_open"],
};
const LEGACY_OFFER: Record<string, string[]> = {
  express: ["express_cta_click", "express_checkout_start"],
  video: ["video_cta_click", "video_page_view", "video_form_started", "video_checkout_start"],
  academy: ["academy_cta_click", "cta_academy_click", "academy_application_saved"],
  conseil: ["orientation_form_submitted"],
};
const list = (names: string[]) => names.map((n) => `'${n}'`).join(", ");

export const FUNNEL_STEPS = Object.keys(STEP_EVENTS);

/** Requêtes HogQL, une par bloc de la page Statistiques. */
export function statsQueries(range: StatsRange, siteHost?: string): Record<string, string> {
  const w = within(range, siteHost);
  const stepCase = `multiIf(${Object.entries(STEP_EVENTS).slice(0, -1)
    .map(([step, names]) => `event IN (${list(names)}), '${step}'`).join(", ")}, 'checkout_start')`;
  const offerCase = `multiIf(${Object.entries(LEGACY_OFFER)
    .map(([offer, names]) => `event IN (${list(names)}), '${offer}'`).join(", ")}, coalesce(nullIf(toString(properties.offer), ''), 'autre'))`;
  return {
    audience: `SELECT count() AS pageviews, uniq(person_id) AS visitors, uniq($session_id) AS sessions
      FROM events WHERE event = '$pageview' AND ${w}`,
    daily: `SELECT toString(toDate(toTimeZone(timestamp, 'Europe/Paris'))) AS day, uniq(person_id) AS visitors, count() AS pageviews
      FROM events WHERE event = '$pageview' AND ${w} GROUP BY day ORDER BY day`,
    pages: `SELECT toString(properties.$pathname) AS path, count() AS pageviews, uniq(person_id) AS visitors
      FROM events WHERE event = '$pageview' AND ${w} GROUP BY path ORDER BY pageviews DESC LIMIT 15`,
    sources: `SELECT source, count() AS sessions FROM (
        SELECT $session_id AS session, argMin(toString(properties.$referring_domain), timestamp) AS source
        FROM events WHERE event = '$pageview' AND ${w} GROUP BY session)
      GROUP BY source ORDER BY sessions DESC LIMIT 10`,
    campaigns: `SELECT campaign, count() AS sessions FROM (
        SELECT $session_id AS session,
          argMin(concat(toString(properties.lt_utm_source), if(notEmpty(toString(properties.lt_utm_campaign)), concat(' · ', toString(properties.lt_utm_campaign)), '')), timestamp) AS campaign
        FROM events WHERE event = '$pageview' AND notEmpty(toString(properties.lt_utm_source)) AND ${w} GROUP BY session)
      GROUP BY campaign ORDER BY sessions DESC LIMIT 10`,
    funnel: `SELECT step, offer, count() AS events, uniq(person_id) AS people FROM (
        SELECT person_id, ${stepCase} AS step, ${offerCase} AS offer
        FROM events WHERE event IN (${list(Object.values(STEP_EVENTS).flat())}) AND ${w})
      GROUP BY step, offer`,
    articles: `SELECT toString(properties.content_slug) AS slug, countIf(event = 'resource_view') AS views,
        uniqIf(person_id, event = 'resource_view') AS readers, countIf(event != 'resource_view') AS clicks
      FROM events WHERE event IN (${list(["resource_view", ...STEP_EVENTS.cta_click])})
        AND notEmpty(toString(properties.content_slug)) AND ${w}
      GROUP BY slug ORDER BY views DESC LIMIT 20`,
  };
}

export type Block<T> = { available: true; rows: T } | { available: false; reason: string };
export type PostHogConfig = { apiKey: string; projectId: string; host: string; siteHost?: string };
type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Exécute une requête HogQL et renvoie ses lignes sous forme d'objets. */
export async function runHogQL(fetchFn: Fetch, config: PostHogConfig, query: string): Promise<Record<string, unknown>[]> {
  const response = await fetchFn(`${config.host}/api/projects/${config.projectId}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query }, name: "fredwav-admin-statistiques" }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    // Raison donnée par PostHog (portée manquante, projet non autorisé…), jamais la clé.
    const detail = await response.json().then((b: { detail?: unknown }) => typeof b?.detail === "string" ? b.detail : "")
      .catch(() => "");
    throw new Error(`PostHog a répondu ${response.status}${detail ? ` : ${detail.slice(0, 200)}` : ""}`);
  }
  const body = await response.json() as { columns?: string[]; results?: unknown[][] };
  if (!Array.isArray(body.columns) || !Array.isArray(body.results)) throw new Error("Réponse PostHog illisible");
  const columns = body.columns;
  return body.results.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

/**
 * Toutes les requêtes, chacune indépendante : un bloc en échec est marqué
 * « indisponible » avec la raison, les autres restent affichés. Jamais de zéro par défaut.
 */
export async function fetchSiteStats(fetchFn: Fetch, config: PostHogConfig | null, range: StatsRange) {
  const queries = statsQueries(range, config?.siteHost);
  const names = Object.keys(queries);
  if (!config) {
    const reason = "Clé de lecture PostHog non configurée (secret POSTHOG_PERSONAL_API_KEY).";
    return Object.fromEntries(names.map((n) => [n, { available: false, reason }])) as Record<string, Block<Record<string, unknown>[]>>;
  }
  const settled = await Promise.allSettled(names.map((n) => runHogQL(fetchFn, config, queries[n])));
  return Object.fromEntries(settled.map((result, i) => [names[i], result.status === "fulfilled"
    ? { available: true, rows: result.value }
    : { available: false, reason: result.reason instanceof Error ? result.reason.message : "PostHog indisponible" }])) as
    Record<string, Block<Record<string, unknown>[]>>;
}
