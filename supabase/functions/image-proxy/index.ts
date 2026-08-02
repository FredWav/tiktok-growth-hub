import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * Relaie les images hébergées par WavStats.
 *
 * Elles répondent bien en HTTP 200, mais sans en-tête `Access-Control-Allow-Origin` :
 * une balise `<img>` les affiche, alors qu'un `fetch()` est refusé par le navigateur.
 * Or le générateur de PDF a besoin des octets pour les embarquer dans le fichier.
 * CORS étant une règle de navigateur, la relayer côté serveur suffit à débloquer.
 *
 * À supprimer le jour où WavStats sert `Access-Control-Allow-Origin` sur /uploads/,
 * ou quand le PDF sera fabriqué côté serveur — dans les deux cas il devient inutile.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Liste blanche stricte : sans elle, cette fonction deviendrait un relais ouvert
 * capable d'atteindre n'importe quelle adresse, y compris le réseau interne.
 */
const ALLOWED_HOSTS = ["wavstats.com", "www.wavstats.com"];
const ALLOWED_PATH_PREFIX = "/uploads/";

/** Les images WavStats font quelques dizaines de ko ; au-delà, c'est autre chose. */
const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

function reject(reason: string, status = 400): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) return reject("Paramètre `url` manquant");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return reject("URL invalide");
  }

  if (target.protocol !== "https:") return reject("Seul https est accepté");
  if (!ALLOWED_HOSTS.includes(target.hostname)) return reject("Domaine non autorisé", 403);
  if (!target.pathname.startsWith(ALLOWED_PATH_PREFIX)) return reject("Chemin non autorisé", 403);

  try {
    const upstream = await fetch(target.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      return reject(`Image indisponible (HTTP ${upstream.status})`, 502);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return reject("La ressource n'est pas une image", 415);
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) return reject("Image trop volumineuse", 413);

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        // Les fichiers WavStats sont immuables : on peut cacher longtemps.
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch (error) {
    console.error("image-proxy:", error);
    return reject("Récupération de l'image impossible", 502);
  }
});
