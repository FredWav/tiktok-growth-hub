import type { ReportModel } from "./report-model";

/**
 * Récupère les images du rapport et les convertit en data URI.
 *
 * WavStats héberge l'avatar et les miniatures sur son propre domaine, mais sans
 * en-tête `Access-Control-Allow-Origin` : une balise `<img>` les affiche (c'est
 * le cas sur la page de résultat), alors qu'un `fetch()` est refusé. Le
 * générateur de PDF, lui, a besoin des octets. On passe donc par une fonction
 * relais qui ajoute l'en-tête manquant.
 *
 * Toute image qui échoue est simplement omise : le rapport se rend sans elle
 * plutôt que de casser. C'est la raison d'être du `Promise.allSettled`.
 */

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Une image lente ne doit pas retarder tout le rapport. */
const TIMEOUT_MS = 8_000;

/**
 * En développement, le relais de vite.config.ts rend l'image same-origin, ce
 * qui évite d'avoir à déployer la fonction edge pour travailler la mise en page.
 */
function proxied(url: string): { href: string; headers: Record<string, string> } {
  if (import.meta.env.DEV) {
    try {
      const u = new URL(url);
      return { href: `/__wavstats-image${u.pathname}`, headers: {} };
    } catch {
      /* URL malformée : on tente la fonction edge, elle la refusera proprement. */
    }
  }
  return {
    href: `${PROXY}?url=${encodeURIComponent(url)}`,
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  };
}

/**
 * Plus grand côté conservé. Les images sont affichées très petit dans le
 * rapport (44 pt pour l'avatar, 26 pt pour une vignette) : au-delà, on
 * alourdirait le fichier sans rien gagner à l'impression.
 */
const MAX_SIDE = 320;
const JPEG_QUALITY = 0.82;

/**
 * Ré-encode l'image en JPEG via un canvas.
 *
 * Indispensable, et pas seulement pour la taille : WavStats sert des fichiers
 * `.jpg` dont le contenu est en réalité du WebP (c'est le cas de l'avatar), un
 * format que react-pdf ne sait pas lire — il abandonne l'image sans rien dire.
 * Passer par le canvas normalise tout ce que le navigateur sait décoder.
 */
async function reencode(blob: Blob): Promise<string | undefined> {
  const bitmap = await createImageBitmap(blob);
  try {
    const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

async function toDataUri(url: string): Promise<string | undefined> {
  try {
    const { href, headers } = proxied(url);
    const res = await fetch(href, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return undefined;

    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return undefined;

    return await reencode(blob);
  } catch {
    return undefined;
  }
}

/**
 * Remplace les URL du modèle par des data URI. Les champs `avatar` et `cover`
 * contiennent une URL en entrée et une image embarquée en sortie — ou rien.
 */
export async function withEmbeddedImages(model: ReportModel): Promise<ReportModel> {
  const targets: string[] = [];
  if (model.meta.avatar) targets.push(model.meta.avatar);
  model.topVideos.forEach((v) => {
    if (v.cover) targets.push(v.cover);
  });
  if (!targets.length) return model;

  const settled = await Promise.allSettled(targets.map(toDataUri));
  const byUrl = new Map<string, string>();
  settled.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) byUrl.set(targets[i], r.value);
  });

  return {
    ...model,
    meta: { ...model.meta, avatar: model.meta.avatar ? byUrl.get(model.meta.avatar) : undefined },
    topVideos: model.topVideos.map((v) => ({
      ...v,
      cover: v.cover ? byUrl.get(v.cover) : undefined,
    })),
  };
}
