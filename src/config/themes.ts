/**
 * Les 9 thèmes du plan SEO (Thomas André-Lubin, octobre 2026). Chaque article
 * Markdown (content/ressources/*.md) appartient à un thème ; chaque thème a sa page
 * guide /ressources/<slug>, publiée dès qu'il contient un article, et renvoie vers
 * l'outil qui règle le problème du lecteur.
 */
export type ThemeTool = "express" | "video";

export type Theme = {
  slug: string;
  name: string;
  /** Titre de la page guide (balise title et h1). */
  title: string;
  /** Une à deux phrases : ce que le lecteur trouve dans ce thème. */
  description: string;
  /** Outil proposé en fin d'article et de guide. */
  tool: ThemeTool;
};

export const THEMES: Theme[] = [
  {
    slug: "probleme-vues-tiktok",
    name: "Problèmes de vues",
    title: "Problèmes de vues sur TikTok : le guide",
    description: "Vues en baisse, vidéos bloquées à quelques centaines de vues, soupçon de shadowban : comprendre ce qui se passe avant de tout changer.",
    tool: "express",
  },
  {
    slug: "analyser-stats-tiktok",
    name: "Analyser ses stats",
    title: "Analyser ses statistiques TikTok : le guide",
    description: "Temps de visionnage, rétention, sources de trafic, engagement : lire ses chiffres dans le bon ordre pour en tirer une décision.",
    tool: "express",
  },
  {
    slug: "creer-videos-tiktok",
    name: "Créer des vidéos",
    title: "Créer des vidéos TikTok qui retiennent : le guide",
    description: "Accroche, structure, montage, sous-titres : construire une vidéo que l'on regarde jusqu'au bout.",
    tool: "video",
  },
  {
    slug: "algorithme-tiktok",
    name: "L'algorithme",
    title: "L'algorithme TikTok expliqué : le guide",
    description: "Comment TikTok choisit à qui montrer une vidéo, ce que l'on sait vraiment, et ce qui relève de la rumeur.",
    tool: "express",
  },
  {
    slug: "profil-tiktok",
    name: "Le profil",
    title: "Optimiser son profil TikTok : le guide",
    description: "Pseudo, bio, photo, vidéos épinglées : un profil qui donne envie de s'abonner en quelques secondes.",
    tool: "express",
  },
  {
    slug: "grandir-sur-tiktok",
    name: "Percer et grandir",
    title: "Percer et grandir sur TikTok : le guide",
    description: "Trouver sa niche, transformer les vues en abonnés, faire des lives : passer d'un compte qui stagne à un compte qui progresse.",
    tool: "express",
  },
  {
    slug: "monetisation-tiktok",
    name: "La monétisation",
    title: "Gagner de l'argent sur TikTok : le guide",
    description: "Programme de récompenses, UGC, TikTok Shop, partenariats : ce que rapporte TikTok et à quelles conditions.",
    tool: "express",
  },
  {
    slug: "tiktok-pour-les-pros",
    name: "TikTok pour les pros",
    title: "TikTok pour les entreprises et les indépendants : le guide",
    description: "Utiliser TikTok pour faire connaître une activité, sans y passer ses journées ni se transformer en influenceur.",
    tool: "express",
  },
  {
    slug: "outils-tiktok",
    name: "Outils et ressources",
    title: "Outils et ressources TikTok : le guide",
    description: "Calculateurs, statistiques de référence et outils pour gagner du temps et prendre de meilleures décisions.",
    tool: "express",
  },
];

export const THEME_BY_SLUG: Record<string, Theme> = Object.fromEntries(THEMES.map((t) => [t.slug, t]));
