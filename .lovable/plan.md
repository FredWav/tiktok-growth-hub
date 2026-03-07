

## Plan : Ajouter TrustedBy dans chaque bloc offre de la page DiagnosticResult

### Contexte

Sur `/result`, chaque offre recommandée (EXPRESS, ONE_SHOT, PREMIUM, ONE_SHOT_PLUS_PREMIUM) s'affiche dans une Card. Il manque le composant `TrustedBy` avec les bulles de photos de profil cliquables.

### Changement

**Fichier** : `src/pages/DiagnosticResult.tsx`

1. Importer `TrustedBy` depuis `@/components/TrustedBy`
2. Ajouter `<TrustedBy filter="one_shot" />` dans la Card ONE_SHOT (après le bouton, avant MailFooter)
3. Ajouter `<TrustedBy filter="premium" />` dans la Card PREMIUM (après le bouton, avant MailFooter)
4. Ajouter `<TrustedBy filter="one_shot" />` + `<TrustedBy filter="premium" />` dans la Card ONE_SHOT_PLUS_PREMIUM (après les boutons, avant MailFooter) — ou un seul sans filtre
5. Pour EXPRESS, ajouter `<TrustedBy />` sans filtre (optionnel, car c'est l'offre gratuite)

Le composant `TrustedBy` gère déjà l'affichage des avatars cliquables renvoyant vers les profils TikTok. Il suffit de l'insérer avec le bon filtre d'offre.

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/pages/DiagnosticResult.tsx` | Import + ajout de `<TrustedBy>` dans chaque bloc offre |

