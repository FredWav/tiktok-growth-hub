/**
 * Normalisation du pseudo TikTok.
 *
 * L'identifiant canonique d'un compte TikTok (`uniqueId`) est **toujours en
 * minuscules** : `https://www.tiktok.com/@Evangymfact` répond bien 200, mais le
 * compte servi porte `"uniqueId":"evangymfact"`. L'API WavStats
 * (`/accounts/{username}/analyze`) fait une correspondance exacte sur cet
 * identifiant : une majeure saisie par le client faisait donc échouer l'analyse
 * alors que le même compte en minuscules passait.
 *
 * Toute valeur qui part vers WavStats ou qui est stockée dans
 * `express_analyses.tiktok_username` doit passer par ici.
 */
export function normalizeTikTokUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^@+/, "").trim().toLowerCase();
}
