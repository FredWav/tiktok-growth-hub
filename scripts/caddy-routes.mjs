/**
 * Règles Caddy du site, générées depuis la liste des routes (src/config/seo.ts) :
 * vraies redirections 308/307, pages applicatives servies par app.html, vraie 404,
 * en-têtes de cache et de robots. Écrit dist-caddy/routes.caddy, importé par
 * le bloc du site dans le Caddyfile du serveur (voir deploy/README.md).
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(projectRoot, "dist", "ssg-manifest.json");
if (!existsSync(manifestPath)) {
  throw new Error("[caddy] dist/ssg-manifest.json absent. Exécute d'abord le build.");
}
const { clientOnlyRoutes: CLIENT_ONLY_ROUTE_PATTERNS, redirects: LEGACY_REDIRECTS } = JSON.parse(
  await readFile(manifestPath, "utf8"),
);

const safePath = (value) => {
  if (!/^\/[A-Za-z0-9/_:.-]*$/.test(value)) throw new Error(`[caddy] Chemin inattendu : ${value}`);
  return value;
};
const safeTarget = (value) => {
  if (!/^\/[A-Za-z0-9/_.?=&-]*$/.test(value)) throw new Error(`[caddy] Destination inattendue : ${value}`);
  return value;
};

const lines = [
  "# Généré par scripts/caddy-routes.mjs depuis src/config/seo.ts : ne pas modifier à la main.",
  "",
  "encode zstd gzip",
  "",
  "# Redirections permanentes (la requête d'origine est conservée).",
];
LEGACY_REDIRECTS.forEach((route, index) => {
  const from = safePath(route.from);
  const to = safeTarget(route.to);
  const target = to.includes("?") ? to : `${to}{?query}`;
  lines.push(`@redirect${index} path ${from} ${from}/`);
  lines.push(`redir @redirect${index} ${target} ${route.status}`);
});

// Routes avec paramètre (/inscription/:token…) : le navigateur reçoit app.html.
const dynamic = CLIENT_ONLY_ROUTE_PATTERNS.filter((p) => p.includes(":") || p.includes("*"))
  .map((p) => safePath(p).replace(/\/:[^/]+.*$/, "/*"));
lines.push("", "# Pages applicatives à paramètre : coquille app.html (noindex).");
if (dynamic.length) {
  lines.push(`@app path ${[...new Set(dynamic)].join(" ")}`);
  lines.push("rewrite @app /app.html");
}

lines.push(
  "",
  "# Fichiers du build ; pages pré-rendues en dossier/index.html.",
  "try_files {path} {path}/index.html",
  "",
  "@assets path /assets/*",
  'header @assets Cache-Control "public, max-age=31536000, immutable"',
  "@pages not path /assets/*",
  'header @pages Cache-Control "no-cache"',
  "header {",
  "\tX-Content-Type-Options nosniff",
  "\tReferrer-Policy strict-origin-when-cross-origin",
  '\tStrict-Transport-Security "max-age=31536000"',
  "\t-Server",
  "}",
  "",
  "file_server",
  "",
  "# Vraie 404 : page 404.html avec le statut 404.",
  "handle_errors 404 {",
  "\trewrite * /404.html",
  "\tfile_server",
  "}",
  "",
);

const outDir = path.join(projectRoot, "dist-caddy");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "routes.caddy"), lines.join("\n"), "utf8");
console.log(`[caddy] ${LEGACY_REDIRECTS.length} redirections, ${dynamic.length} routes applicatives à paramètre → dist-caddy/routes.caddy`);
