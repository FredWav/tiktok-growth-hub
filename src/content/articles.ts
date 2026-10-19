/**
 * Catalogue des ressources : articles Markdown (content/ressources/*.md), chargés
 * au build par Vite, plus les trois guides historiques écrits en composants React.
 * Un fichier commençant par « _ » (modèle) est ignoré ; un brouillon n'est visible
 * qu'en local (npm run dev), jamais publié.
 */
import { THEMES, THEME_BY_SLUG } from "@/config/themes";
import { type Article, checkArticles, parseArticle } from "./parse-article";

/** Fiche commune aux articles Markdown et aux guides historiques (listes, guides de thème). */
export type ResourceEntry = {
  path: string;
  title: string;
  description: string;
  theme: string;
  published: string;
  updated: string;
  readingMinutes: number;
};

/** Guides historiques (pages React), rattachés à leur thème sans changer d'adresse. */
export const LEGACY_RESOURCES: ResourceEntry[] = [
  {
    path: "/ressources/vues-tiktok",
    title: "Pourquoi mes TikTok font peu de vues ? Le diagnostic étape par étape",
    description: "Un diagnostic étape par étape pour distinguer problème de compte, accroche floue, rétention faible et manque de cohérence éditoriale.",
    theme: "probleme-vues-tiktok",
    published: "2026-08-11",
    updated: "2026-08-11",
    readingMinutes: 10,
  },
  {
    path: "/ressources/statistiques-tiktok",
    title: "Statistiques TikTok : les métriques qui changent vraiment une décision",
    description: "Temps de visionnage, rétention, complétion, engagement : les lire dans le bon ordre et éviter les conclusions trop rapides.",
    theme: "analyser-stats-tiktok",
    published: "2026-08-11",
    updated: "2026-08-11",
    readingMinutes: 9,
  },
  {
    path: "/ressources/retention-tiktok",
    title: "Améliorer sa rétention TikTok",
    description: "Localiser les chutes d'audience et choisir la partie précise de la vidéo à retravailler.",
    theme: "creer-videos-tiktok",
    published: "2026-08-11",
    updated: "2026-08-11",
    readingMinutes: 10,
  },
];

const files = import.meta.glob("/content/ressources/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const themeSlugs = new Set(THEMES.map((t) => t.slug));

const parsed: Article[] = Object.entries(files)
  .filter(([file]) => !file.split("/").pop()!.startsWith("_"))
  .map(([file, raw]) => parseArticle(file.replace(/^\//, ""), raw, themeSlugs))
  .filter((a) => !a.draft || import.meta.env.DEV);

checkArticles(parsed, new Set([
  ...THEMES.map((t) => `/ressources/${t.slug}`),
  ...LEGACY_RESOURCES.map((r) => r.path),
]));

/** Articles publiés (et brouillons en local), du plus récent au plus ancien. */
export const ARTICLES: Article[] = parsed.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
export const ARTICLE_BY_PATH: Record<string, Article> = Object.fromEntries(ARTICLES.map((a) => [a.path, a]));

/** Toutes les ressources d'un thème : articles Markdown et guides historiques. */
export function resourcesOfTheme(theme: string): ResourceEntry[] {
  return [...ARTICLES, ...LEGACY_RESOURCES.filter(() => true)]
    .filter((r) => r.theme === theme)
    .sort((a, b) => b.published.localeCompare(a.published));
}

/** Thèmes qui ont au moins une ressource : seuls ceux-là ont une page guide publiée. */
export const PUBLISHED_THEMES = THEMES.filter((t) => resourcesOfTheme(t.slug).length > 0);

/** Fiche d'une ressource par adresse (article Markdown ou guide historique). */
export function resourceByPath(path: string): ResourceEntry | undefined {
  return ARTICLE_BY_PATH[path] ?? LEGACY_RESOURCES.find((r) => r.path === path);
}

export { THEME_BY_SLUG };
