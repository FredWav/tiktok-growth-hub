
## Optimisation SEO et GEO pour tout le site fredwav.com

### Diagnostic actuel

Le site a deja de bonnes bases SEO (balises meta, sitemap, robots.txt, schema.org, canonical). Voici les lacunes identifiees et les optimisations a appliquer :

### 1. Ajouter les `keywords` manquants sur les pages qui n'en ont pas

La page Analyse Express n'a pas de `keywords` dans son `SEOHead`. Il faut en ajouter.

### 2. Enrichir le schema.org (structured data) dans `index.html`

Actuellement, seul un schema `ProfessionalService` basique existe. On va ajouter :
- **FAQPage** schema sur la page d'accueil (les questions frequentes sont deja presentes dans le code)
- **Service** schemas pour chaque offre (One Shot, Wav Premium, VIP)
- **Person** schema pour Fred Wav
- Ajouter le champ `"knowsAbout"` et `"hasOfferCatalog"` au schema existant

### 3. Ameliorer le composant `SEOHead` pour le GEO (Generative Engine Optimization)

- Ajouter la balise `meta robots` avec `index, follow`
- Ajouter `og:image:alt` pour l'accessibilite des images OG
- Ajouter le support pour injecter du JSON-LD (schema.org) par page

### 4. Ajouter du JSON-LD specifique par page

Creer un composant `SchemaMarkup` reutilisable et l'integrer dans les pages principales :
- **Home** : `FAQPage` + `ProfessionalService` enrichi
- **Offres** : `OfferCatalog` avec les 3 offres
- **One Shot** : `Service` + `Product` avec prix 179EUR
- **Wav Premium (45-jours)** : `Service` avec prix 987EUR
- **VIP** : `Service` avec prix a partir de 99EUR/mois
- **Preuves** : `Review` / `AggregateRating`
- **A propos** : `Person` schema pour Fred Wav

### 5. Mettre a jour le sitemap avec les pages manquantes

Ajouter les URLs manquantes :
- `/analyse-express`
- `/wav-premium/candidature`

### 6. Ajouter les attributs `lang` et `hreflang` pour le GEO

Le site est en francais et cible la France. Ajouter une balise `hreflang` dans le `SEOHead` pour signaler ca aux moteurs de recherche et aux IA generatives.

### 7. Ameliorer les `alt` texts des images (Preuves)

Les miniatures YouTube sur la page Preuves ont toutes le meme `alt` generique "Temoignage client". Il faut les rendre uniques.

---

### Modifications techniques

**Fichier `src/components/SEOHead.tsx`** :
- Ajouter support pour `robots` meta tag (`index, follow`)
- Ajouter `og:image:alt`
- Ajouter prop optionnelle `schema` pour injecter du JSON-LD par page
- Ajouter `hreflang` link tag (fr-FR)

**Fichier `index.html`** :
- Enrichir le schema.org existant avec `knowsAbout`, `hasOfferCatalog`, `founder` (Person)

**Fichier `public/sitemap.xml`** :
- Ajouter `/analyse-express` et `/wav-premium/candidature`

**Pages a modifier** (ajout de `keywords` manquants et injection de JSON-LD) :
- `src/pages/AnalyseExpress.tsx` : ajouter `keywords`
- `src/pages/Home.tsx` : ajouter JSON-LD `FAQPage`
- `src/pages/OneShot.tsx` : ajouter JSON-LD `Service`
- `src/pages/Offres.tsx` : ajouter JSON-LD `OfferCatalog`
- `src/pages/QuarantecinqJours.tsx` : ajouter JSON-LD `Service`
- `src/pages/VipCheckout.tsx` : ajouter JSON-LD `Service`
- `src/pages/Preuves.tsx` : ameliorer les `alt` des miniatures + ajouter JSON-LD `AggregateRating`
- `src/pages/APropos.tsx` : ajouter JSON-LD `Person`

**Nouveau composant `src/components/SchemaMarkup.tsx`** :
- Composant utilitaire qui injecte un `<script type="application/ld+json">` dans le `<head>` via `useEffect`
- Accepte un objet JSON-LD en prop

Cela represente environ 12 fichiers a modifier ou creer, avec un impact significatif sur le referencement naturel et la visibilite dans les moteurs IA generatifs (Perplexity, ChatGPT Search, Google AI Overviews).
