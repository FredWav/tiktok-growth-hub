/**
 * Lecture d'un article Markdown (content/ressources/<slug>.md).
 *
 * Module sans dépendance au navigateur ni à Vite : il est utilisé au build et par
 * les tests. Toute erreur arrête le build avec un message qui dit quoi corriger,
 * pour qu'un article incomplet ou mal formé ne soit jamais publié.
 */
import { Marked, type Tokens } from "marked";
import { parse as parseYaml } from "yaml";

export type ArticleFaq = { question: string; answer: string };
export type ArticleCta = "express" | "video";

export type Article = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  introduction: string;
  theme: string;
  published: string;
  updated: string;
  draft: boolean;
  experienceNote: string;
  faq: ArticleFaq[];
  related: string[];
  aiAssisted: boolean;
  readingMinutes: number;
  /** HTML de l'article ; les appels à l'action sont marqués <!--cta:express--> / <!--cta:video-->. */
  html: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CTA_LINE = /^\[\[(analyse-express|analyse-video)\]\]$/;

class ArticleError extends Error {
  constructor(file: string, message: string) {
    super(`[articles] ${file} : ${message}`);
  }
}

function text(file: string, data: Record<string, unknown>, key: string, { min = 1, max = 400 } = {}): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim().length < min) {
    throw new ArticleError(file, `champ « ${key} » manquant ou vide.`);
  }
  if (value.trim().length > max) throw new ArticleError(file, `champ « ${key} » trop long (${max} caractères au plus).`);
  return value.trim();
}

function date(file: string, data: Record<string, unknown>, key: string): string {
  const value = data[key] instanceof Date ? (data[key] as Date).toISOString().slice(0, 10) : data[key];
  if (typeof value !== "string" || !DATE.test(value)) {
    throw new ArticleError(file, `champ « ${key} » : date attendue au format AAAA-MM-JJ.`);
  }
  return value;
}

/**
 * En français, « : » apparaît souvent dans un titre ou une phrase (« Vues en baisse : les
 * causes »), ce que YAML lit comme un sous-champ. Une valeur simple qui contient « : »
 * est donc mise entre guillemets avant lecture.
 */
function quoteColonValues(yaml: string): string {
  return yaml.split("\n").map((line) => {
    const m = line.match(/^(\s*(?:- )?[a-z_]+): (.+)$/);
    if (!m || !/: /.test(m[2]) || /^["'[{|>&*!]/.test(m[2].trim())) return line;
    return `${m[1]}: ${JSON.stringify(m[2].trim())}`;
  }).join("\n");
}

/** Découpe l'en-tête YAML (entre deux lignes ---) et le corps Markdown. */
function splitFrontmatter(file: string, raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new ArticleError(file, "l'en-tête entre deux lignes « --- » est absent.");
  let data: unknown;
  try {
    data = parseYaml(quoteColonValues(match[1]));
  } catch (error) {
    throw new ArticleError(file, `en-tête illisible (${error instanceof Error ? error.message : error}).`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ArticleError(file, "en-tête vide.");
  return { data: data as Record<string, unknown>, body: match[2] };
}

function renderBody(file: string, body: string): { html: string; words: number } {
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      // Pas de HTML brut : le contenu est publié tel quel, sans relecture du code.
      html(token: Tokens.HTML | Tokens.Tag): string {
        throw new ArticleError(file, `HTML interdit dans un article (${token.raw.trim().slice(0, 40)}…). Écris en Markdown.`);
      },
      heading(token: Tokens.Heading): string | false {
        if (token.depth === 1) throw new ArticleError(file, "titre « # » interdit dans le texte : le titre vient de l'en-tête ; commence par « ## ».");
        return false;
      },
      image(token: Tokens.Image): string | false {
        if (!token.text.trim()) throw new ArticleError(file, `image sans texte alternatif (${token.href}).`);
        return false;
      },
      paragraph(token: Tokens.Paragraph): string | false {
        const cta = token.raw.trim().match(CTA_LINE);
        if (cta) return `<!--cta:${cta[1] === "analyse-express" ? "express" : "video"}-->\n`;
        // Hors code : `[[analyse-express]]` entre accents graves sert à l'expliquer.
        if (/\[\[[^\]]*\]\]/.test(token.raw.replace(/`[^`]*`/g, ""))) {
          throw new ArticleError(file, `bloc inconnu ${token.raw.trim().slice(0, 40)} : utilise [[analyse-express]] ou [[analyse-video]], seul sur sa ligne.`);
        }
        return false;
      },
    },
  });
  const html = marked.parse(body, { async: false }) as string;
  const words = body.replace(/\[\[[^\]]*\]\]/g, "").split(/\s+/).filter(Boolean).length;
  return { html, words };
}

export function parseArticle(file: string, raw: string, themes: ReadonlySet<string>): Article {
  const slug = file.replace(/^.*\//, "").replace(/\.md$/, "");
  if (!SLUG.test(slug)) {
    throw new ArticleError(file, "nom de fichier invalide : minuscules, chiffres et tirets seulement (ex. pourquoi-mes-vues-baissent.md).");
  }
  const { data, body } = splitFrontmatter(file, raw);
  const theme = text(file, data, "theme", { max: 60 });
  if (!themes.has(theme)) throw new ArticleError(file, `thème « ${theme} » inconnu (voir src/config/themes.ts).`);
  const status = data.statut ?? "brouillon";
  if (status !== "publie" && status !== "brouillon") {
    throw new ArticleError(file, "champ « statut » : « publie » ou « brouillon ».");
  }
  const published = date(file, data, "date");
  const updated = data.mise_a_jour === undefined ? published : date(file, data, "mise_a_jour");
  if (updated < published) throw new ArticleError(file, "« mise_a_jour » est antérieure à « date ».");

  const faqRaw = data.faq ?? [];
  if (!Array.isArray(faqRaw)) throw new ArticleError(file, "champ « faq » : liste de questions attendue.");
  const faq = faqRaw.map((item, index) => {
    if (!item || typeof item !== "object") throw new ArticleError(file, `faq n° ${index + 1} invalide.`);
    const entry = item as Record<string, unknown>;
    return {
      question: text(file, entry, "question", { max: 200 }),
      answer: text(file, entry, "reponse", { max: 1200 }),
    };
  });
  const relatedRaw = data.liens ?? [];
  if (!Array.isArray(relatedRaw) || relatedRaw.some((s) => typeof s !== "string" || !SLUG.test(s))) {
    throw new ArticleError(file, "champ « liens » : liste d'adresses d'articles (ex. shadowban-tiktok).");
  }

  const { html, words } = renderBody(file, body);
  if (words < 150 && status === "publie") {
    throw new ArticleError(file, `article trop court pour être publié (${words} mots).`);
  }
  const title = text(file, data, "titre", { max: 120 });
  return {
    slug,
    path: `/ressources/${slug}`,
    title,
    seoTitle: typeof data.titre_seo === "string" && data.titre_seo.trim() ? data.titre_seo.trim() : `${title} | Fred Wav`,
    description: text(file, data, "description", { min: 50, max: 170 }),
    introduction: text(file, data, "introduction", { max: 600 }),
    theme,
    published,
    updated,
    draft: status !== "publie",
    experienceNote: text(file, data, "note_de_fred", { max: 800 }),
    faq,
    related: relatedRaw as string[],
    aiAssisted: data.redige_avec_ia !== false,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    html,
  };
}

/**
 * Contrôles sur l'ensemble des articles : adresses uniques, sans collision avec
 * les pages du site ou les guides de thème, liens vers des articles existants.
 */
export function checkArticles(articles: Article[], reservedPaths: ReadonlySet<string>): void {
  const seen = new Set<string>();
  for (const article of articles) {
    if (seen.has(article.slug)) throw new Error(`[articles] adresse en double : ${article.path}`);
    if (reservedPaths.has(article.path)) {
      throw new Error(`[articles] ${article.path} existe déjà sur le site (page ou guide de thème) : choisis un autre nom de fichier.`);
    }
    seen.add(article.slug);
  }
  for (const article of articles) {
    for (const link of article.related) {
      if (!seen.has(link) && !reservedPaths.has(`/ressources/${link}`)) {
        throw new Error(`[articles] ${article.path} : le lien « ${link} » ne correspond à aucun article.`);
      }
    }
  }
}
