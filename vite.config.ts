import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { ROUTE_SEO, BASE_URL, type RouteSeo } from "./src/config/seo";

const escAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Remplace le contenu d'une balise meta existante, ou l'ajoute avant </head>. */
function setMeta(html: string, key: string, value: string, attr: "name" | "property") {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i");
  if (re.test(html)) return html.replace(re, `$1${escAttr(value)}$2`);
  return html.replace(
    /<\/head>/i,
    `  <meta ${attr}="${key}" content="${escAttr(value)}" />\n  </head>`,
  );
}

function buildNoscript(route: RouteSeo) {
  const links = (route.noscript.links ?? [])
    .map((l) => `<li><a href="${escAttr(l.href)}">${escText(l.label)}</a></li>`)
    .join("\n            ");
  // Sections éditoriales (h2 + résumé) pour les crawlers sans JS : sur les pages
  // de contenu, un titre et un paragraphe ne suffisent pas à décrire la page.
  const sections = (route.noscript.sections ?? [])
    .map((s) => `<h2>${escText(s.h2)}</h2>\n        <p>${escText(s.body)}</p>`)
    .join("\n        ");
  return `<noscript>
      <div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif">
        <h1>${escText(route.noscript.h1)}</h1>
        <p>${escText(route.noscript.body)}</p>
        ${sections}
        ${links ? `<nav><ul>\n            ${links}\n          </ul></nav>` : ""}
        <hr />
        <p>Fred Wav — <a href="mailto:contact@fredwav.com">contact@fredwav.com</a></p>
      </div>
    </noscript>`;
}

/**
 * Contenu placé dans `#root` avant que React ne prenne la main.
 *
 * C'est du HTML normal, pas du `<noscript>` : un crawler qui n'exécute pas le
 * JavaScript (les robots des IA, notamment) le lit à pleine valeur, alors que
 * le contenu confiné dans `<noscript>` est pondéré faiblement. On y sert donc
 * le titre, la proposition de valeur ET les liens vers les offres, pas
 * seulement le titre. React (createRoot, pas d'hydratation) remplace tout ce
 * bloc au montage : il fait aussi office d'écran d'attente pendant le chargement.
 *
 * Styles en ligne obligatoires : la feuille Tailwind n'est pas encore appliquée.
 * Les données proviennent de `noscript` — aucun champ nouveau, aucune source qui
 * puisse diverger du reste du SEO.
 */
function buildRootFallback(route: RouteSeo) {
  // Proposition de valeur : le paragraphe du noscript est plus riche que la
  // meta description ; on prend les deux quand ils diffèrent.
  const lead = `<p style="font-size:1.05rem;line-height:1.6;color:#3a352b;margin:0 auto 14px;max-width:640px">${escText(route.description)}</p>`;
  const body =
    route.noscript.body && route.noscript.body !== route.description
      ? `<p style="font-size:0.95rem;line-height:1.6;color:#6b6456;margin:0 auto;max-width:640px">${escText(route.noscript.body)}</p>`
      : "";

  // Liens vers les offres : ce sont les CTA et le maillage interne, servis en
  // clair au lieu d'être noyés dans le <noscript>.
  const links = (route.noscript.links ?? [])
    .map(
      (l) =>
        `<a href="${escAttr(l.href)}" style="display:inline-block;margin:5px;padding:9px 16px;border:1px solid #d8cdb8;border-radius:8px;color:#1a1a1a;text-decoration:none;font-size:0.9rem">${escText(l.label)}</a>`,
    )
    .join("");
  const linksBlock = links
    ? `<div style="margin-top:24px;display:flex;flex-wrap:wrap;justify-content:center;gap:2px;max-width:720px;margin-left:auto;margin-right:auto">${links}</div>`
    : "";

  return `<div style="min-height:100vh;background:#FBF6EE">
        <div style="max-width:820px;margin:0 auto;padding:80px 24px;font-family:system-ui,sans-serif;color:#1a1a1a;text-align:center">
          <h1 style="font-size:2rem;line-height:1.25;margin:0 0 18px">${escText(route.noscript.h1)}</h1>
          ${lead}
          ${body}
          ${linksBlock}
        </div>
      </div>`;
}

/** Applique les métadonnées d'une route à la coquille HTML buildée. */
function renderShell(template: string, route: RouteSeo) {
  const url = `${BASE_URL}${route.path === "/" ? "" : route.path}`;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(route.title)}</title>`);
  html = setMeta(html, "description", route.description, "name");
  if (route.keywords) html = setMeta(html, "keywords", route.keywords, "name");
  html = setMeta(html, "og:title", route.title, "property");
  html = setMeta(html, "og:description", route.description, "property");
  html = setMeta(html, "og:url", url, "property");
  html = setMeta(html, "twitter:title", route.title, "name");
  html = setMeta(html, "twitter:description", route.description, "name");

  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escAttr(url)}" />`,
  );

  // JSON-LD propre à la route, en plus des schémas site-wide déjà dans index.html
  if (route.schema) {
    const schemas = Array.isArray(route.schema) ? route.schema : [route.schema];
    const tags = schemas
      .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
      .join("\n    ");
    html = html.replace(/<\/head>/i, `  ${tags}\n  </head>`);
  }

  // Attention : index.html contient DEUX <noscript> — le premier est le fallback
  // de chargement des polices. On ne cible que celui du body, reconnaissable à son div.
  const bodyNoscript = /<noscript>\s*<div style="max-width:800px[\s\S]*?<\/noscript>/i;
  if (!bodyNoscript.test(html)) {
    throw new Error(
      "[seo-prerender] <noscript> du body introuvable dans index.html — le marqueur " +
        '`<div style="max-width:800px` a dû changer. Le prerender serait silencieusement inutile.',
    );
  }
  html = html.replace(bodyNoscript, buildNoscript(route));

  // Titre et accroche dans le corps même, pas seulement dans le <noscript>.
  // React remplace ce contenu au montage.
  const rootDiv = /<div id="root"><\/div>/i;
  if (!rootDiv.test(html)) {
    throw new Error(
      '[seo-prerender] <div id="root"></div> introuvable dans index.html — ' +
        "le titre de niveau 1 ne serait pas injecté dans le corps de la page.",
    );
  }
  html = html.replace(rootDiv, `<div id="root">${buildRootFallback(route)}</div>`);
  return html;
}

function generateSitemap() {
  const urls = ROUTE_SEO.filter((r) => r.sitemap !== false)
    .map((r) => {
      const loc = `${BASE_URL}${r.path === "/" ? "/" : r.path}`;
      return `  <url><loc>${loc}</loc><priority>${r.sitemap}</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function generateLlmsTxt() {
  const sections: { key: RouteSeo["llmsSection"]; title: string }[] = [
    { key: "principales", title: "Pages principales" },
    { key: "offres", title: "Offres et services" },
    { key: "ressources", title: "Ressources et contenu" },
    { key: "legales", title: "Pages légales" },
  ];

  const body = sections
    .map(({ key, title }) => {
      const rows = ROUTE_SEO.filter((r) => r.llmsSection === key && r.llms)
        .map((r) => {
          const name = r.title.split(/[—|]/)[0].trim();
          return `- [${name}](${r.path}): ${r.llms}`;
        })
        .join("\n");
      return rows ? `## ${title}\n\n${rows}\n` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `# Fred Wav

> Expert stratégie formats courts. J'apprends aux créateurs et aux indépendants à lire leurs statistiques, comprendre pourquoi ils plafonnent en vues et corriger vidéo après vidéo. Offre principale : la Wav Academy.

${body}`;
}

/**
 * Prerender : écrit une coquille HTML distincte par route publique.
 *
 * Le site est un SPA — sans ça, tous les robots reçoivent le même index.html,
 * donc le même title, la même description et le même <noscript>. C'est ce qui
 * faisait passer /a-propos, /contact et /newsletter pour des doublons de la home.
 * On n'exécute pas React côté serveur (Supabase/PostHog/BrowserRouter rendraient
 * le SSR invasif) : on injecte les métadonnées dans la coquille, le SPA hydrate ensuite.
 */
function seoPrerender(): Plugin {
  return {
    name: "fredwav-seo-prerender",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const template = fs.readFileSync(indexPath, "utf-8");

      for (const route of ROUTE_SEO) {
        const html = renderShell(template, route);
        if (route.path === "/") {
          fs.writeFileSync(indexPath, html);
        } else {
          const dir = path.join(dist, route.path.replace(/^\//, ""));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), html);
        }
      }

      fs.writeFileSync(path.join(dist, "sitemap.xml"), generateSitemap());
      fs.writeFileSync(path.join(dist, "llms.txt"), generateLlmsTxt());

      console.log(`\n[seo-prerender] ${ROUTE_SEO.length} routes, sitemap.xml et llms.txt générés.`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Équivalent local de la fonction edge `image-proxy` : WavStats sert ses
      // images sans en-tête CORS, donc le générateur de PDF ne peut pas les
      // lire depuis le navigateur. Passer par le serveur de dev les rend
      // same-origin et permet de travailler la mise en page sans déployer.
      "/__wavstats-image": {
        target: "https://wavstats.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/__wavstats-image/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), seoPrerender()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  // Sans pré-bundling, Vite optimise react-pdf au premier clic sur « Télécharger »
  // et recharge la page en plein rendu.
  optimizeDeps: {
    include: ["@react-pdf/renderer"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-toast"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
