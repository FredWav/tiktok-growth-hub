

## Plan : Page admin "Témoignages" avec gestion des clients accompagnés

### 1. Base de données

Nouvelle table `trusted_clients` :

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid | PK, auto |
| name | text | Prénom/nom affiché |
| avatar_url | text | URL de la photo de profil |
| tiktok_url | text | Lien profil TikTok |
| offers | text[] | Ex: `{"one_shot", "premium", "diagnostic"}` |
| display_order | integer | Ordre d'affichage, default 0 |
| is_active | boolean | default true |
| created_at | timestamptz | auto |

RLS : admin ALL, anon/public SELECT (les données sont affichées publiquement sur le site).

Bucket storage public `trusted-avatars` pour uploader les photos de profil.

### 2. Page admin `/admin/testimonials`

Nouvelle page `src/pages/admin/Testimonials.tsx` accessible depuis la sidebar admin (icône Users/Star, label "Témoignages").

Fonctionnalités :
- **Liste** des clients ajoutés (photo, nom, lien TikTok, offres associées, actif/inactif)
- **Formulaire d'ajout** (dialog) : nom, upload photo, URL TikTok, sélection multiple des offres (One Shot, Premium, Diagnostic, Express), ordre d'affichage
- **Modification** et **suppression** inline
- **Toggle actif/inactif** pour masquer temporairement sans supprimer

### 3. Composant public `TrustedBy`

Nouveau composant `src/components/TrustedBy.tsx` :
- Fetch les `trusted_clients` actifs depuis la base
- Prop `filter?: string` pour filtrer par offre
- Affiche avatars ronds cliquables (lien TikTok) + prénoms
- Titre "Ils m'ont fait confiance"

### 4. Intégration sur les pages publiques

- **`/start` (DiagnosticStart.tsx)** : step 0, sous le CTA
- **`/one-shot` (OneShot.tsx)** : section social proof
- **`/45-jours` (QuarantecinqJours.tsx)** : section social proof
- **`/offres` (Offres.tsx)** : sous les cartes d'offres

### 5. Fichiers impactés

| Action | Fichier |
|--------|---------|
| Migration | Nouvelle table + bucket storage |
| Nouveau | `src/pages/admin/Testimonials.tsx` |
| Nouveau | `src/hooks/useTrustedClients.ts` |
| Nouveau | `src/components/TrustedBy.tsx` |
| Modifié | `src/components/layout/AdminLayout.tsx` (nav item) |
| Modifié | `src/App.tsx` (route admin) |
| Modifié | `DiagnosticStart.tsx`, `OneShot.tsx`, `QuarantecinqJours.tsx`, `Offres.tsx` |

