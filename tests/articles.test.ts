import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { checkArticles, parseArticle } from "../src/content/parse-article.ts";

const THEMES = new Set(["probleme-vues-tiktok", "creer-videos-tiktok"]);
const words = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(" ");
const article = (front: string, body = `## Partie\n\n${words(200)}`) => `---\n${front}\n---\n${body}\n`;
const FRONT = [
  "titre: Pourquoi mes vues ont baissé",
  "description: Les vraies raisons d'une baisse de vues sur TikTok et comment vérifier laquelle te concerne.",
  "introduction: Une baisse de vues a presque toujours une cause que l'on peut vérifier.",
  "theme: probleme-vues-tiktok",
  "date: 2026-11-02",
  "statut: publie",
  "note_de_fred: Quand un créateur me parle de baisse, je regarde d'abord ses trois dernières vidéos.",
  "faq:",
  "  - question: Est-ce un shadowban ?",
  "    reponse: Rarement. Vérifie d'abord l'état du compte dans l'application.",
].join("\n");

test("article complet : champs lus, appel à l'action marqué, temps de lecture", () => {
  const a = parseArticle("content/ressources/vues-en-baisse.md", article(FRONT, `## Les causes\n\n${words(400)}\n\n[[analyse-express]]\n\n## Et ensuite\n\nTexte.`), THEMES);
  assert.equal(a.path, "/ressources/vues-en-baisse");
  assert.equal(a.seoTitle, "Pourquoi mes vues ont baissé | Fred Wav");
  assert.equal(a.updated, "2026-11-02");
  assert.equal(a.draft, false);
  assert.equal(a.faq[0].answer, "Rarement. Vérifie d'abord l'état du compte dans l'application.");
  assert.match(a.html, /<!--cta:express-->/);
  assert.match(a.html, /<h2[^>]*>Les causes<\/h2>/);
  assert.equal(a.readingMinutes, 2);
  assert.equal(a.aiAssisted, true);
});

test("un « : » dans une valeur est accepté sans guillemets", () => {
  const a = parseArticle("content/ressources/deux-points.md", article(`${FRONT}\ntitre_seo: Vues en baisse : les causes | Fred Wav`.replace(
    "  - question: Est-ce un shadowban ?", "  - question: Shadowban : mythe ou réalité ?")), THEMES);
  assert.equal(a.seoTitle, "Vues en baisse : les causes | Fred Wav");
  assert.equal(a.faq[0].question, "Shadowban : mythe ou réalité ?");
});

test("le build refuse un article mal formé, avec un message clair", () => {
  const bad = (front: string, body?: string, file = "content/ressources/test.md") =>
    () => parseArticle(file, article(front, body), THEMES);
  assert.throws(bad(FRONT.replace("theme: probleme-vues-tiktok", "theme: inconnu")), /thème « inconnu » inconnu/);
  assert.throws(bad(FRONT.replace(/^titre:.*$/m, "")), /champ « titre » manquant/);
  assert.throws(bad(FRONT.replace("date: 2026-11-02", "date: 2 novembre")), /AAAA-MM-JJ/);
  assert.throws(bad(FRONT, `## Titre\n\n${words(200)}\n\n<script>alert(1)</script>`), /HTML interdit/);
  assert.throws(bad(FRONT, `# Titre\n\n${words(200)}`), /titre « # » interdit/);
  assert.throws(bad(FRONT, `## Titre\n\n${words(200)}\n\n![](capture.png)`), /image sans texte alternatif/);
  assert.throws(bad(FRONT, `## Titre\n\n${words(200)}\n\n[[analyse-compte]]`), /bloc inconnu/);
  assert.throws(bad(FRONT, `## Titre\n\nTrop court.`), /trop court/);
  assert.throws(bad(FRONT, undefined, "content/ressources/Mauvais Nom.md"), /nom de fichier invalide/);
  // Un brouillon court est accepté : il n'est jamais publié.
  assert.equal(parseArticle("content/ressources/brouillon.md", article(FRONT.replace("statut: publie", "statut: brouillon"), "Court."), THEMES).draft, true);
});

test("adresses : pas de doublon, pas de collision avec une page, liens existants", () => {
  const a = parseArticle("content/ressources/a.md", article(FRONT), THEMES);
  const b = parseArticle("content/ressources/b.md", article(`${FRONT}\nliens:\n  - a\n  - vues-tiktok`), THEMES);
  checkArticles([a, b], new Set(["/ressources/vues-tiktok"]));
  assert.throws(() => checkArticles([a, a], new Set()), /adresse en double/);
  assert.throws(() => checkArticles([a], new Set(["/ressources/a"])), /existe déjà sur le site/);
  const c = parseArticle("content/ressources/c.md", article(`${FRONT}\nliens:\n  - fantome`), THEMES);
  assert.throws(() => checkArticles([c], new Set()), /ne correspond à aucun article/);
});

test("les articles du dépôt sont valides", () => {
  const themes = new Set([...readFileSync(new URL("../src/config/themes.ts", import.meta.url), "utf8").matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]));
  const dir = new URL("../content/ressources/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const articles = files.map((f) => parseArticle(`content/ressources/${f}`, readFileSync(new URL(f, dir), "utf8"), themes));
  // Guides historiques (pages React) déclarés dans le catalogue.
  const legacy = [...readFileSync(new URL("../src/content/articles.ts", import.meta.url), "utf8").matchAll(/path: "(\/ressources\/[^"]+)"/g)].map((m) => m[1]);
  checkArticles(articles, new Set([...[...themes].map((t) => `/ressources/${t}`), ...legacy]));
});
