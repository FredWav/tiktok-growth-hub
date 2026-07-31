/**
 * Jetons visuels du rapport PDF.
 *
 * Volontairement alignés sur la charte du site (or / noir / crème) plutôt que
 * sur les couleurs de l'ancien générateur HTML, qui avaient dérivé. Les valeurs
 * sémantiques sont choisies pour rester lisibles à l'impression noir et blanc.
 */

export const color = {
  noir: "#111111",
  noirLight: "#1F1D1A",
  gold: "#C49A3C",
  goldBright: "#E8B84B",
  goldSoft: "#F0E3C4",
  cream: "#FBF6EE",
  creamDark: "#F4ECDD",
  white: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#6B6456",
  line: "#E7DDC9",
  green: "#2F7A4B",
  amber: "#B45309",
  red: "#B3261E",
} as const;

export const font = {
  sans: "Inter",
  display: "Playfair Display",
} as const;

/** Marges des pages de contenu : réservent la place du bandeau et du pied fixes. */
export const page = {
  paddingTop: 74,
  paddingBottom: 58,
  paddingHorizontal: 48,
  /** Largeur utile en points (A4 = 595,28 pt). */
  contentWidth: 595.28 - 48 * 2,
} as const;

export const size = {
  body: 9.5,
  small: 8,
  micro: 7,
  chrome: 7.5,
  h2: 16,
  h3: 11,
  statValue: 16,
  statValueSmall: 12,
} as const;

/** Vert au-dessus de 70, ambre au-dessus de 40, rouge en dessous. */
export function scoreColor(score: number): string {
  if (score >= 70) return color.green;
  if (score >= 40) return color.amber;
  return color.red;
}

export function riskColor(risk: string): string {
  if (risk === "none" || risk === "low") return color.green;
  if (risk === "medium") return color.amber;
  if (risk === "unknown") return color.muted;
  return color.red;
}

/** Impact « haut » en vert, « moyen » en ambre, le reste en neutre. */
export function impactColor(value?: string): string {
  const v = (value ?? "").toLowerCase();
  if (v.includes("haut") || v.includes("élevé") || v.includes("high")) return color.green;
  if (v.includes("moyen") || v.includes("modér") || v.includes("medium")) return color.amber;
  return color.muted;
}
