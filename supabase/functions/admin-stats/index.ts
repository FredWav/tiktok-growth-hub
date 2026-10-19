/**
 * Statistiques de l'admin : ventes confirmées (base) et audience du site (PostHog).
 *
 * Réservé aux admins. PostHog est lu avec une clé personnelle en lecture seule
 * (secret POSTHOG_PERSONAL_API_KEY, portée « Query Read »), jamais exposée au
 * navigateur. Les lectures PostHog sont mises en cache par période.
 */
import { admin, db, headers, json } from "../_shared/commerce.ts";
import { fetchSiteStats, parseRange, todayInParis } from "../_shared/posthog-stats.ts";

// Période close : les chiffres ne bougent plus guère. Période en cours : 10 minutes.
const TTL_CLOSED_MS = 6 * 3600_000;
const TTL_OPEN_MS = 10 * 60_000;
// « Actualiser » ne relance PostHog qu'une fois par minute au plus.
const MIN_REFRESH_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  const client = db();
  try {
    await admin(req, client);
  } catch {
    return json({ error: "Accès refusé" }, 403);
  }
  let range;
  let refresh = false;
  const today = todayInParis();
  try {
    const body = await req.json();
    range = parseRange(body.from, body.to, today);
    refresh = body.refresh === true;
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Requête invalide" }, 400);
  }

  try {
    const sales = await client.rpc("admin_sales", { p_from: range.from, p_to: range.to });
    if (sales.error) throw sales.error;

    const key = `site:${range.from}:${range.to}`;
    const ttl = range.to < today ? TTL_CLOSED_MS : TTL_OPEN_MS;
    const cached = await client.from("admin_stats_cache").select("payload,fetched_at").eq("key", key).maybeSingle();
    const age = cached.data ? Date.now() - new Date(cached.data.fetched_at).getTime() : Infinity;
    let site = cached.data?.payload;
    let fetchedAt = cached.data?.fetched_at ?? null;

    if (!site || age > ttl || (refresh && age > MIN_REFRESH_MS)) {
      const apiKey = Deno.env.get("POSTHOG_PERSONAL_API_KEY");
      const config = apiKey
        ? {
          apiKey,
          // Projet PostHog Europe (Francfort) du site.
          projectId: Deno.env.get("POSTHOG_PROJECT_ID") ?? "312146",
          host: Deno.env.get("POSTHOG_API_HOST") ?? "https://eu.posthog.com",
          // En production : « fredwav.com », pour ne pas compter les visites du site de test.
          siteHost: Deno.env.get("POSTHOG_SITE_HOST") ?? undefined,
        }
        : null;
      site = await fetchSiteStats(fetch, config, range);
      fetchedAt = new Date().toISOString();
      // Seule une lecture complète est gardée : un bloc en échec sera redemandé.
      const complete = Object.values(site as Record<string, { available: boolean }>).every((b) => b.available);
      if (complete) {
        await client.from("admin_stats_cache").upsert({ key, payload: site, fetched_at: fetchedAt });
        await client.from("admin_stats_cache").delete().lt("fetched_at", new Date(Date.now() - 7 * 86400_000).toISOString());
      }
    }

    return json({ range, sales: sales.data, site, site_fetched_at: fetchedAt });
  } catch (error) {
    console.error("[admin-stats]", error);
    return json({ error: "Statistiques momentanément indisponibles" }, 500);
  }
});
