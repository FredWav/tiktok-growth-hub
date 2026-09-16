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

/**
 * TikTok uniqueId: 2 à 24 caractères, lettres ASCII, chiffres, tirets bas et
 * points. Un point final n'est pas accepté par TikTok. Cette validation évite
 * notamment de facturer un nom d'affichage contenant espaces ou accents.
 */
export function isValidTikTokUsername(value: unknown): boolean {
  const username = normalizeTikTokUsername(value);
  return username.length >= 2 &&
    username.length <= 24 &&
    /^[a-z0-9_][a-z0-9_.]*[a-z0-9_]$/.test(username);
}
