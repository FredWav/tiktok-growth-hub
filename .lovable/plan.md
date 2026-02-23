

## Optimisation SEO complete

### 1. Corriger la langue du document

**`index.html`** : Changer `lang="en"` en `lang="fr"` -- indispensable pour le referencing francophone.

### 2. Composant SEO dynamique par page

Creer un composant **`src/components/SEOHead.tsx`** qui utilise `document.title` et met a jour dynamiquement les balises `<meta description>`, `<link canonical>`, et les balises Open Graph via `useEffect`. Cela permet d'avoir un titre et une description uniques par page.

### 3. Ajouter les meta SEO sur chaque page publique

Integrer le composant SEO dans chaque page avec des titres et descriptions optimises :

| Page | Title | Description |
|------|-------|-------------|
| `/` | Fred Wav - Expert Strategie TikTok \| Coaching et Accompagnement | Transforme ton TikTok en machine a clients. Diagnostic, strategie de contenu et plan d'action avec Fred Wav, expert TikTok. |
| `/offres` | Offres et Tarifs - Fred Wav \| Coaching TikTok | Decouvre les offres d'accompagnement TikTok : One Shot (179EUR), 45 Jours et VIP. Trouve la formule adaptee a tes besoins. |
| `/one-shot` | One Shot - Session Strategie TikTok 179EUR \| Fred Wav | 1h30 de diagnostic et plan d'action personnalise pour ta strategie TikTok. Reservation en ligne, paiement securise. |
| `/45-jours` | Accompagnement 45 Jours - Transformation TikTok \| Fred Wav | 45 jours d'accompagnement intensif pour transformer ta presence TikTok en levier business. Sur candidature. |
| `/offres/vip` | VIP - Accompagnement Continu TikTok \| Fred Wav | Rejoins le hub VIP : lives hebdo, feedback Discord 5/7, ressources exclusives. A partir de 99EUR/mois. |
| `/preuves` | Temoignages et Resultats Clients \| Fred Wav | Decouvre les resultats concrets de nos clients : temoignages video, etudes de cas et retours d'experience. |
| `/a-propos` | A propos de Fred Wav \| Expert Strategie TikTok | 18 ans d'experience video, 300+ createurs accompagnes, 10M+ vues generees. Decouvre le parcours et la methode. |
| `/contact` | Contact - Fred Wav \| Expert TikTok | Contacte Fred Wav par email ou reseaux sociaux. Reponse sous 24-48h en semaine. |
| `/cgv` | Conditions Generales de Vente \| Fred Wav | CGV applicables aux prestations de conseil en strategie TikTok proposees par Fred Wav. |
| `/mentions-legales` | Mentions Legales \| Fred Wav | Mentions legales du site fredwav.com - Editeur, hebergeur, propriete intellectuelle et donnees personnelles. |

### 4. Donnees structurees JSON-LD

Ajouter dans `index.html` un schema JSON-LD `ProfessionalService` avec les informations de l'entreprise (nom, description, URL, reseaux sociaux, zone geographique). Cela ameliore l'affichage dans les resultats Google (rich snippets).

### 5. Sitemap XML statique

Creer **`public/sitemap.xml`** listant toutes les pages publiques avec leur priorite et frequence de modification.

### 6. Mettre a jour robots.txt

Ajouter la directive `Sitemap: https://fredwav.com/sitemap.xml` et bloquer les routes privees (`/admin`, `/app`, `/auth`).

### Fichiers concernes

- `index.html` (lang + JSON-LD)
- `src/components/SEOHead.tsx` (nouveau)
- `src/pages/Home.tsx`, `Offres.tsx`, `OneShot.tsx`, `QuarantecinqJours.tsx`, `VipCheckout.tsx`, `Preuves.tsx`, `APropos.tsx`, `Contact.tsx`, `CGV.tsx`, `MentionsLegales.tsx` (ajout SEOHead)
- `public/sitemap.xml` (nouveau)
- `public/robots.txt` (mise a jour)

