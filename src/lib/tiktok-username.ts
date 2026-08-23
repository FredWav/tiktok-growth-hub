/**
 * Normalisation du pseudo TikTok saisi par le visiteur.
 *
 * L'identifiant canonique d'un compte TikTok (`uniqueId`) est toujours en
 * minuscules, et l'API WavStats fait une correspondance exacte dessus : une
 * majuscule saisie faisait échouer l'analyse. Le miroir serveur de ce helper
 * vit dans `supabase/functions/_shared/tiktok-username.ts` ; les deux doivent
 * rester alignés.
 */
export function normalizeTikTokUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^@+/, "").trim().toLowerCase();
}
