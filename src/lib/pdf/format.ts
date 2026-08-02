/** Formatage fr-FR partagé par le modèle du rapport PDF. */

/**
 * Intl produit une espace fine insécable (U+202F) comme séparateur de milliers.
 * Ce glyphe manque dans certains sous-ensembles de police et sortirait en carré
 * dans le PDF : on le ramène à l'espace insécable classique, présente dans Inter.
 */
const NARROW_NBSP = "\u202F";
const NBSP = "\u00A0";
const safeSpaces = (s: string) => s.split(NARROW_NBSP).join(NBSP);

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** 1 234 567 → « 1,2 M » ; 12 400 → « 12,4 k ». */
export function fmtCompact(value: unknown): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Math.abs(n) < 1000) return safeSpaces(n.toLocaleString("fr-FR"));
  const s = new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
  return safeSpaces(s.replace("k", "k").replace("M", "M"));
}

export function fmtInt(value: unknown): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  return safeSpaces(Math.round(n).toLocaleString("fr-FR"));
}

export function fmtPercent(value: unknown, digits = 1): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  return `${safeSpaces(n.toFixed(digits).replace(".", ","))} %`;
}

export function fmtDateFr(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function fmtShortDateFr(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function truncate(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Retire les emojis.
 *
 * Le PDF ne les rend pas nativement : react-pdf va chercher une image par
 * emoji sur un CDN, une requête par occurrence. Les retirer à la source évite
 * ces allers-retours, et un rapport imprimable n'en a pas l'usage.
 */
export function stripEmojis(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\u{FE0F}/gu, "")
    .replace(/\u{200D}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Nettoie un texte produit par l'IA avant de le poser dans le PDF : marqueurs
 * markdown (**gras**, `code`, ### titres) qui sortiraient tels quels faute de
 * moteur markdown, et emojis.
 *
 * Point de passage unique : tout texte libre affiché dans le rapport doit
 * traverser cette fonction.
 */
export function cleanText(text: string): string {
  return stripEmojis(
    text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|[\s(])\*(\S[^*]*?)\*(?=[\s.,;:)!?]|$)/g, "$1$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-–—]\s+/gm, "• ")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

export function cleanUsername(value: unknown): string {
  return String(value ?? "").trim().replace(/^@/, "");
}

export function initialsOf(displayName?: string, username?: string): string {
  const source = (displayName || username || "").trim();
  if (!source) return "FW";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}
