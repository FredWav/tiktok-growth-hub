

## Plan : Galerie de captures d'ecran clients (admin + affichage public)

### Concept

Creer un systeme complet pour uploader des captures d'ecran de messages de clients satisfaits depuis l'admin, et les afficher sous forme de galerie/mosaique sur les pages publiques strategiques.

### 1. Base de donnees

Nouvelle table `client_screenshots` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| image_url | text | URL publique dans le storage |
| client_name | text (nullable) | Prenom du client (optionnel) |
| caption | text (nullable) | Legende courte ("Merci Fred !") |
| offer | text[] | Offres associees (one_shot, premium...) |
| display_locations | text[] | Pages ou afficher: home, preuves, offres, diagnostic_result |
| display_order | int | Ordre d'affichage |
| is_active | boolean | Actif/inactif |
| created_at | timestamptz | Date de creation |

RLS : lecture publique (is_active = true), gestion admin (has_role admin).

Storage bucket `client-screenshots` (public) pour les images.

### 2. Admin - Gestion des captures

Ajouter un **onglet ou section** dans la page admin Temoignages existante (`/admin/testimonials`) avec :
- Grille de previews des captures uploadees
- Bouton "Ajouter une capture" ouvrant un dialog avec :
  - Upload d'image (drag & drop ou selection)
  - Champ nom client (optionnel)
  - Champ legende (optionnel)
  - Checkboxes offres associees
  - Checkboxes emplacements d'affichage (Home, Preuves, Offres, Resultat diagnostic)
  - Ordre d'affichage
  - Toggle actif/inactif
- Actions : editer, supprimer, activer/desactiver

### 3. Composant public `ScreenshotWall`

Composant reutilisable `src/components/ScreenshotWall.tsx` :
- Prend un prop `location` (ex: "home", "preuves")
- Fetch les captures actives filtrees par `display_locations`
- Affichage en grille mosaique responsive (2 cols mobile, 3-4 cols desktop)
- Chaque capture : image arrondie avec ombre, nom + legende en overlay leger
- Click pour agrandir en lightbox/dialog
- Effet de scroll horizontal sur mobile (carousel)

### 4. Emplacements strategiques d'affichage

| Page | Position | Justification |
|------|----------|---------------|
| **Home.tsx** | Apres la section temoignages texte, avant "Comment choisir" | Renforce la preuve sociale juste avant le choix d'offre |
| **Preuves.tsx** | Nouvelle section "Leurs messages" entre les videos et les temoignages texte | Complete les videos avec du contenu authentique brut |
| **Offres.tsx** | Entre les cartes d'offres et le CTA final | Rassure au moment de la decision |
| **DiagnosticResult.tsx** | Sous les cartes de recommandation d'offre | Rassure apres le diagnostic, avant le clic Calendly |

### 5. Hook `useClientScreenshots`

Hook React Query pour fetch les captures par location :
```
useClientScreenshots(location: string) => { data, isLoading }
```

### Fichiers crees/modifies

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table + bucket + RLS |
| `src/hooks/useClientScreenshots.ts` | Hook fetch par location |
| `src/components/ScreenshotWall.tsx` | Composant galerie public |
| `src/pages/admin/Testimonials.tsx` | Ajouter onglet gestion captures |
| `src/pages/Home.tsx` | Inserer ScreenshotWall location="home" |
| `src/pages/Preuves.tsx` | Inserer ScreenshotWall location="preuves" |
| `src/pages/Offres.tsx` | Inserer ScreenshotWall location="offres" |
| `src/pages/DiagnosticResult.tsx` | Inserer ScreenshotWall location="diagnostic_result" |

