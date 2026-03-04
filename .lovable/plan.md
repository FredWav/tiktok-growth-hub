

## Plan : Amélioration SEO drastique basée sur l'audit

### Diagnostic de l'audit

L'audit confirme le problème critique : **le crawler ne voit que le HTML statique de `index.html`** (4699 octets). Résultat :
- **0 H1**, 0 headings, 0 liens internes, 0 images détectés
- **Score links : 85** (aucun lien visible pour le crawler)
- **Score GEO : 70** (structured data insuffisante pour les moteurs IA)
- **1 seule page crawlée** (SPA = les autres pages sont invisibles)

### Corrections par fichier

---

#### 1. `index.html` — Rendre le contenu visible aux crawlers (impact critique)

Le crawler ne voit que `<div id="root"></div>`. On injecte du contenu statique visible par les bots :

- Ajouter un bloc `<noscript>` avec le H1, la description, les liens internes principaux et les offres (texte statique reprenant le contenu de la homepage)
- Ajouter `<meta name="robots" content="index, follow" />`
- Ajouter `<link rel="preconnect" href="https://img.youtube.com" />` et `<link rel="dns-prefetch" ...>`
- Ajouter une FAQ schema `FAQPage` en JSON-LD statique (en plus du ProfessionalService existant)

#### 2. `src/components/SEOHead.tsx` — Prop `noindex`

- Ajouter une prop optionnelle `noindex?: boolean`
- Quand `noindex` est true, mettre `robots` à `"noindex, nofollow"`

#### 3. `src/pages/NotFound.tsx` — Refonte complète

- Ajouter `Layout` (Header + Footer)
- Traduire en français
- Ajouter `SEOHead` avec `noindex: true`
- Ajouter des liens vers les pages principales (maillage interne)

#### 4. `src/pages/DiagnosticStart.tsx` — Ajouter SEOHead

- Ajouter `SEOHead` avec title, description, keywords appropriés

#### 5. `src/components/layout/Footer.tsx` — Enrichir le maillage interne

- Ajouter les liens manquants : Analyse Express, Preuves/Témoignages, Wav Premium, Diagnostic gratuit (/start)
- Wrapper dans `<nav aria-label="Footer navigation">`

#### 6. `src/components/layout/Header.tsx` — Sémantique

- Ajouter `aria-label="Navigation principale"` sur le `<nav>`

#### 7. `public/sitemap.xml` — Compléter

- Ajouter `/start` (priority 0.7)
- Ajouter `<lastmod>2026-03-04</lastmod>` sur chaque URL

#### 8. `src/pages/Home.tsx` — Schema BreadcrumbList

- Ajouter un schema `BreadcrumbList` dans le `SEOHead` (en plus du FAQPage existant) via un tableau de schemas

#### 9. `src/pages/Preuves.tsx` — Images YouTube

- Ajouter `width={480} height={360}` sur les `<img>` YouTube pour éviter le CLS
- Ajouter `loading="lazy"` sur les images

---

### Résumé de l'impact attendu

| Problème audit | Correction | Score visé |
|---|---|---|
| 0 H1 détecté | `<noscript>` avec H1 statique | headings → 100 |
| 0 liens internes | `<noscript>` + footer enrichi | links → 95+ |
| GEO 70 | FAQ + BreadcrumbList schemas | GEO → 85+ |
| 1 page crawlée | sitemap + `<noscript>` liens | pages crawlées ↑ |

9 fichiers modifiés, aucune nouvelle dépendance.

