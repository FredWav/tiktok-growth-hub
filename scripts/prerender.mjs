import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDist = path.join(projectRoot, "dist");
const serverDist = path.join(projectRoot, "dist-ssr");
const serverEntry = path.join(serverDist, "entry-server.js");
const clientTemplatePath = path.join(clientDist, "index.html");

if (!existsSync(clientTemplatePath)) {
  throw new Error("[ssg] dist/index.html absent. Exécute d'abord le build client.");
}
if (!existsSync(serverEntry)) {
  throw new Error("[ssg] dist-ssr/entry-server.js absent. Exécute d'abord le build SSR.");
}

// Le pré-rendu doit rester reproductible et ne jamais dépendre d'un service
// distant. Toute tentative de fetch pendant l'import ou le rendu fait échouer le build.
globalThis.fetch = async (input) => {
  throw new Error(`[ssg] Accès réseau interdit pendant le pré-rendu : ${String(input)}`);
};

const {
  BASE_URL,
  CLIENT_ONLY_ROUTE_PATTERNS,
  LEGACY_REDIRECTS,
  SSG_ROUTES,
  renderRoute,
} = await import(pathToFileURL(serverEntry).href);

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeText = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceOrAppendHead(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function setTitle(html, title) {
  return replaceOrAppendHead(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeText(title)}</title>`);
}

function setMeta(html, attribute, key, content) {
  const pattern = new RegExp(
    `<meta\\b[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'][^>]*>`,
    "i",
  );
  return replaceOrAppendHead(
    html,
    pattern,
    `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" data-seo-route="true" />`,
  );
}

function removeMeta(html, attribute, key) {
  return html.replace(
    new RegExp(`<meta\\b[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'][^>]*>\\s*`, "i"),
    "",
  );
}

function setHttpEquiv(html, key, content) {
  const pattern = new RegExp(
    `<meta\\b[^>]*\\bhttp-equiv=["']${escapeRegExp(key)}["'][^>]*>`,
    "i",
  );
  return replaceOrAppendHead(
    html,
    pattern,
    `<meta http-equiv="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />`,
  );
}

function setLink(html, relation, href, extraAttributes = "") {
  const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["']${escapeRegExp(relation)}["'])[^>]*>`, "i");
  return replaceOrAppendHead(
    html,
    pattern,
    `<link rel="${escapeAttribute(relation)}" href="${escapeAttribute(href)}"${extraAttributes} data-seo-route="true" />`,
  );
}

function removeLink(html, relation) {
  return html.replace(
    new RegExp(`<link\\b(?=[^>]*\\brel=["']${escapeRegExp(relation)}["'])[^>]*>\\s*`, "gi"),
    "",
  );
}

function removeRouteSchemas(html) {
  return html.replace(
    /<script\b[^>]*data-seo-route-schema=["']true["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    "",
  );
}

function removeAllSchemas(html) {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

function appendRouteSchemas(html, schema) {
  if (!schema) return html;
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  const tag = `<script type="application/ld+json" data-seo-route-schema="true">${json}</script>`;
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function replaceRoot(html, content, renderedPath) {
  const rootPattern = /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i;
  if (!rootPattern.test(html)) {
    throw new Error("[ssg] Le conteneur #root est introuvable dans dist/index.html.");
  }

  const marker = renderedPath
    ? ` data-ssg-path="${escapeAttribute(renderedPath)}"`
    : "";
  return html.replace(rootPattern, `<div id="root"${marker}>${content}</div>`);
}

function replaceBodyNoscript(html, replacement = "") {
  const bodyIndex = html.search(/<body\b/i);
  if (bodyIndex === -1) return html;
  const head = html.slice(0, bodyIndex);
  const body = html.slice(bodyIndex).replace(/<noscript>[\s\S]*?<\/noscript>\s*/i, replacement);
  return head + body;
}

function absoluteUrl(routePath) {
  return routePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${routePath}`;
}

function renderMarketingDocument(template, route, body) {
  const canonical = route.canonical || absoluteUrl(route.path);
  let html = removeRouteSchemas(template);
  html = setTitle(html, route.title);
  html = setMeta(html, "name", "description", route.description);
  html = removeMeta(html, "name", "keywords");
  html = setMeta(html, "name", "robots", route.indexable ? "index, follow" : "noindex, nofollow");
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:type", route.ogType ?? "website");
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  html = setLink(html, "canonical", canonical);
  html = route.indexable
    ? setLink(html, "alternate", canonical, ' hreflang="fr-FR"')
    : removeLink(html, "alternate");
  html = appendRouteSchemas(html, route.indexable ? route.schema : undefined);
  html = replaceRoot(html, body, route.path);
  return replaceBodyNoscript(html);
}

function renderNoIndexDocument(template, { title, description, body = "", renderedPath = "" }) {
  let html = removeAllSchemas(template);
  html = setTitle(html, title);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "name", "robots", "noindex, nofollow");
  html = removeMeta(html, "name", "keywords");
  html = removeLink(html, "canonical");
  html = removeLink(html, "alternate");
  html = replaceRoot(html, body, renderedPath);
  return replaceBodyNoscript(
    html,
    '<noscript><p>Cette page nécessite JavaScript pour fonctionner.</p></noscript>\n',
  );
}

function renderPermanentRedirectDocument(template, route) {
  const destination = absoluteUrl(route.to);
  const relativeDestination = route.to === "/" ? "/" : route.to;
  const body = `<main><h1>Cette page a été déplacée</h1><p>Vous allez être redirigé vers <a href="${escapeAttribute(relativeDestination)}">la nouvelle page</a>.</p></main>`;
  const redirectScript = `<script data-static-redirect="true">window.location.replace(${JSON.stringify(relativeDestination).replace(/</g, "\\u003c")});</script>`;

  let html = removeAllSchemas(template);
  html = setTitle(html, "Page déplacée | Fred Wav");
  html = setMeta(html, "name", "description", "Cette page a été déplacée vers une nouvelle adresse.");
  html = setMeta(html, "name", "robots", "index, follow");
  html = removeMeta(html, "name", "keywords");
  html = setMeta(html, "property", "og:url", destination);
  html = setLink(html, "canonical", destination);
  html = removeLink(html, "alternate");
  html = setHttpEquiv(html, "refresh", `0; url=${relativeDestination}`);
  html = html.replace(/<\/head>/i, `  ${redirectScript}\n</head>`);
  html = replaceRoot(html, body, "");
  return replaceBodyNoscript(html);
}

function outputPath(routePath) {
  if (routePath === "/") return path.join(clientDist, "index.html");
  const safeSegments = routePath.replace(/^\//, "").split("/");
  return path.join(clientDist, ...safeSegments, "index.html");
}

function canWriteStaticShell(routePath) {
  return !routePath.includes(":") && !routePath.includes("*");
}

function assertNoIndexShell(routePath, document) {
  if (!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']noindex, nofollow["']/i.test(document)) {
    throw new Error(`[ssg] La coquille ${routePath} n'est pas marquée noindex.`);
  }
  if (/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(document)) {
    throw new Error(`[ssg] La coquille ${routePath} contient une URL canonique.`);
  }
}

function assertPermanentRedirect(route, document) {
  const destination = absoluteUrl(route.to);
  if (!/<meta\b[^>]*\bhttp-equiv=["']refresh["'][^>]*\bcontent=["']0; url=/i.test(document)) {
    throw new Error(`[ssg] La redirection permanente ${route.from} n'a pas de meta refresh immédiat.`);
  }
  if (/\bnoindex\b/i.test(document)) {
    throw new Error(`[ssg] La redirection permanente ${route.from} ne doit pas être noindex.`);
  }
  if (!document.includes(`href="${escapeAttribute(destination)}"`)) {
    throw new Error(`[ssg] La redirection permanente ${route.from} n'a pas la bonne canonique.`);
  }
}

function assertRenderedPage(route, body, document) {
  if (!body.trim()) throw new Error(`[ssg] ${route.path} a produit un body vide.`);
  if (!/<main\b/i.test(body)) throw new Error(`[ssg] ${route.path} ne contient aucun <main>.`);
  const h1Count = (body.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) throw new Error(`[ssg] ${route.path} contient ${h1Count} H1 au lieu d'un.`);
  if (!/<header\b/i.test(body)) throw new Error(`[ssg] ${route.path} ne contient aucun header.`);
  if (!/<footer\b/i.test(body)) throw new Error(`[ssg] ${route.path} ne contient aucun footer.`);
  const titleCount = (document.match(/<title\b/gi) ?? []).length;
  const descriptionCount = (document.match(/<meta\b[^>]*\bname=["']description["']/gi) ?? []).length;
  const canonicalCount = (document.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi) ?? []).length;
  if (titleCount !== 1 || descriptionCount !== 1 || canonicalCount !== 1) {
    throw new Error(
      `[ssg] ${route.path} : title=${titleCount}, description=${descriptionCount}, canonical=${canonicalCount}.`,
    );
  }
  if (/<meta\b[^>]*\bname=["']keywords["']/i.test(document)) {
    throw new Error(`[ssg] ${route.path} contient encore une meta keywords.`);
  }
  if (!document.includes(`data-ssg-path="${route.path}"`)) {
    throw new Error(`[ssg] Marqueur d'hydratation absent pour ${route.path}.`);
  }
  if (document.includes("max-width:820px")) {
    throw new Error(`[ssg] L'ancien fallback SEO est encore présent sur ${route.path}.`);
  }

  const expectedSchemas = route.indexable && route.schema ? 1 : 0;
  const actualSchemas = (document.match(/data-seo-route-schema="true"/g) ?? []).length;
  if (expectedSchemas !== actualSchemas) {
    throw new Error(
      `[ssg] ${route.path} : ${actualSchemas} schéma(s) de route au lieu de ${expectedSchemas}.`,
    );
  }
}

function generateSitemap() {
  const urls = SSG_ROUTES.filter((route) => route.indexable && route.sitemap !== false)
    .map((route) => {
      const priority = typeof route.sitemap === "number" ? route.sitemap.toFixed(1) : "0.5";
      return `  <url><loc>${absoluteUrl(route.path)}</loc><priority>${priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function generateLlmsTxt() {
  const sections = [
    ["principales", "Pages principales"],
    ["offres", "Offres et services"],
    ["ressources", "Ressources et contenu"],
    ["legales", "Pages légales"],
  ];

  const content = sections
    .map(([key, title]) => {
      const rows = SSG_ROUTES.filter((route) => route.llmsSection === key && typeof route.llms === "string")
        .map((route) => {
          const name = route.title.split(/[—|]/)[0].trim();
          return `- [${name}](${route.path}): ${route.llms}`;
        })
        .join("\n");
      return rows ? `## ${title}\n\n${rows}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  return `# Fred Wav\n\n> Consultant en stratégie de contenus et réseaux sociaux. Ressources TikTok, Wav Academy, Analyse Express et accompagnement individuel Wav Premium.\n\n${content}\n`;
}

const duplicatePaths = SSG_ROUTES.filter(
  (route, index) => SSG_ROUTES.findIndex((candidate) => candidate.path === route.path) !== index,
);
if (duplicatePaths.length) {
  throw new Error(`[ssg] Routes dupliquées : ${duplicatePaths.map((route) => route.path).join(", ")}`);
}

const template = await readFile(clientTemplatePath, "utf8");
const appShell = renderNoIndexDocument(template, {
  title: "Application Fred Wav",
  description: "Espace fonctionnel Fred Wav.",
});
await writeFile(path.join(clientDist, "app.html"), appShell, "utf8");

const staticNoIndexPaths = [
  ...CLIENT_ONLY_ROUTE_PATTERNS.filter(canWriteStaticShell),
  ...LEGACY_REDIRECTS.filter((route) => route.status !== 308)
    .map((route) => route.from)
    .filter(canWriteStaticShell),
];

for (const routePath of new Set(staticNoIndexPaths)) {
  assertNoIndexShell(routePath, appShell);
  const destination = outputPath(routePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, appShell, "utf8");
}

const permanentRedirects = LEGACY_REDIRECTS.filter(
  (route) => route.status === 308 && canWriteStaticShell(route.from),
);

for (const route of permanentRedirects) {
  const document = renderPermanentRedirectDocument(template, route);
  assertPermanentRedirect(route, document);
  const destination = outputPath(route.from);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, document, "utf8");
}

for (const route of SSG_ROUTES) {
  const body = await renderRoute(route.path);
  const document = renderMarketingDocument(template, route, body);
  assertRenderedPage(route, body, document);
  const destination = outputPath(route.path);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, document, "utf8");
  console.log(`[ssg] ${route.path}`);
}

const notFoundBody = await renderRoute("/__404__");
const notFoundDocument = renderNoIndexDocument(template, {
  title: "Page introuvable | Fred Wav",
  description: "Cette page n'existe pas ou a été déplacée.",
  body: notFoundBody,
  renderedPath: "/__404__",
});
await writeFile(path.join(clientDist, "404.html"), notFoundDocument, "utf8");
await writeFile(path.join(clientDist, "sitemap.xml"), generateSitemap(), "utf8");
await writeFile(path.join(clientDist, "llms.txt"), generateLlmsTxt(), "utf8");

const manifest = {
  ssgRoutes: SSG_ROUTES.map((route) => route.path),
  clientOnlyRoutes: CLIENT_ONLY_ROUTE_PATTERNS,
  redirects: LEGACY_REDIRECTS,
};
await writeFile(path.join(clientDist, "ssg-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

await rm(serverDist, { recursive: true, force: true });
console.log(
  `[ssg] ${SSG_ROUTES.length} pages marketing, ${new Set(staticNoIndexPaths).size} coquilles noindex, ${permanentRedirects.length} redirections permanentes compatibles Lovable, app.html, 404.html, sitemap.xml et llms.txt générés.`,
);
