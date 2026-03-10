

## Plan : Mise à jour de contenu + Pop-up intention de sortie

### 1. Navbar — `src/components/layout/Header.tsx`
Remplacer `{ label: "Offres", href: "/offres" }` par `{ label: "Accompagnements", href: "/offres" }`.

### 2. Hero Section — `src/pages/Home.tsx`
- Titre : "Arrête de naviguer à vue. **Structure ta stratégie TikTok et explose tes conversions.**"
- Sous-titre : "Ta visibilité stagne et ton audience ne convertit pas. Remplace le ressenti par un diagnostic précis et une architecture de contenu pensée pour l'acquisition."
- CTA unique : "Réserve un appel stratégique avec Fred Wav" (conserver style `variant="hero" size="xl"`).

### 3. Section Problème — `src/pages/Home.tsx`
Remplacer la section "À qui ça s'adresse" (array `profiles`) :
- Titre : "Tu produis du contenu, mais ton acquisition est bloquée."
- Sous-titre : "Faire des vues pour faire des vues ne sert à rien si ton tunnel est vide. Si ta stratégie n'est pas millimétrée, tu perds des prospects qualifiés à chaque post."
- 4 puces (remplacer les 3 cartes par 4 items dans une grille 2×2) :
  1. Ton positionnement est bancal et ta proposition de valeur manque de clarté.
  2. Tes hooks sont faibles et la rétention s'effondre dans les premières secondes.
  3. Tes scripts manquent de rythme et tes appels à l'action sont invisibles ou ignorés.
  4. Tu n'arrives pas à identifier les erreurs précises qui limitent ta visibilité.

### 4. Section Accompagnements — `src/pages/Home.tsx`
Remplacer le titre "Comment choisir" par "Accompagnements", sous-titre "Deux formules, deux niveaux d'engagement."

Remplacer l'array `offers` par 2 cartes :

**Carte 1 — Wav Premium** (recommended, variant hero) :
- Description fournie, 4 puces, pas de prix affiché.
- CTA : "Réserve un appel stratégique avec Fred Wav" → `/45-jours`

**Carte 2 — One Shot (Analyse Express)** :
- Description fournie, 4 puces, prix 179€.
- CTA : "Réserver mon Analyse Express (1h30)" → `/one-shot`

### 5. Pop-up intention de sortie — nouveau `src/components/ExitIntentPopup.tsx`
- Utilise `Dialog` de shadcn (composant existant).
- Déclencheur : `mouseleave` sur `document.documentElement` (intention de sortie desktop) OU scroll > 70% de la page.
- Affichage une seule fois par session (`sessionStorage`).
- Titre : "Pas encore prêt pour un accompagnement complet ?"
- Texte : "Ne laisse pas ton compte stagner. Débloque ta visibilité immédiatement avec un audit chirurgical de 1h30 sur tes contenus et ta conversion."
- Bouton : "Voir le One Shot (Analyse Express)" → `/one-shot`
- Intégré dans `Home.tsx` à côté du `WavSocialScanPopup`.

### 6. Page Offres — `src/pages/Offres.tsx`
Appliquer les mêmes modifications de contenu : supprimer la carte VIP (déjà commentée), mettre à jour les textes/puces des 2 offres restantes pour correspondre au nouveau wording, supprimer le prix du Wav Premium, renommer le titre de page en "Accompagnements".

### Fichiers modifiés
- `src/components/layout/Header.tsx`
- `src/pages/Home.tsx`
- `src/pages/Offres.tsx`
- `src/components/ExitIntentPopup.tsx` (nouveau)

