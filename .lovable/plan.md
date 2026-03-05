

## Diagnostic : liens de tracking depuis TikTok

J'ai analysé le flux complet. Voici les problèmes identifiés :

### Problème 1 : Le bouton "Ouvrir dans mon navigateur" ne fonctionne pas sur iOS
Sur iOS, le `TikTokBrowserBanner` utilise `navigator.clipboard.writeText()` qui est **souvent bloqué dans le webview TikTok** (pas de permission clipboard). Le prospect voit soit rien, soit un message qu'il ignore. Il n'y a **aucun moyen automatique d'ouvrir Safari** depuis le webview TikTok sur iOS -- c'est une limitation système.

### Problème 2 : Le tracking `page_views` ne capture rien sans consentement cookies
Un visiteur TikTok arrive pour la première fois → pas de `cookie_consent` en localStorage → `trackPageView()` return immédiatement sans rien enregistrer. Le visiteur ne verra jamais la bannière cookies s'il est bloqué avant. C'est le comportement GDPR attendu, mais ça signifie que le trafic TikTok est largement invisible dans les analytics custom.

### Problème 3 : Les UTMs sont perdus si le prospect copie/colle l'URL manuellement
Si le prospect suit l'instruction "copie dans Safari", il copie l'URL complète (avec UTMs), donc ça devrait fonctionner -- à condition que le clipboard fonctionne.

---

## Plan de correction

### A. Améliorer le banner TikTok (iOS)

Remplacer la logique iOS actuelle par une approche plus robuste :
1. Essayer `navigator.clipboard.writeText()` en premier
2. Si ça échoue (ce qui arrive souvent dans TikTok), afficher l'URL en texte sélectionnable dans le banner pour que l'utilisateur puisse la copier manuellement (long press)
3. Ajouter des instructions plus claires : "Appuie sur les 3 points en haut → Ouvrir dans Safari"

### B. Rendre le tracking UTM indépendant du consentement cookies

Les UTMs ne sont pas des cookies/données personnelles -- ce sont des paramètres marketing de l'URL. On peut les capturer en localStorage **avant** le consentement cookies (c'est déjà le cas dans `captureUtmParams()`). Le problème est que `page_views` ne s'insère pas sans consentement.

Solution : séparer la capture UTM du tracking page_views. `captureUtmParams()` fonctionne déjà sans condition de consentement -- c'est correct. Les UTMs seront ensuite rattachés aux leads (diagnostic, one-shot, etc.) indépendamment du tracking de pages.

Pas de changement nécessaire ici -- le flow est déjà correct pour les leads.

### C. Ajouter un fallback pour la copie d'URL sur iOS TikTok

Dans `TikTokBrowserBanner`, si le clipboard échoue, afficher un champ texte en lecture seule avec l'URL complète + instruction pour appuyer longuement et copier.

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/TikTokBrowserBanner.tsx` | Améliorer le fallback iOS avec URL affichée + instructions "3 points → Ouvrir dans Safari" |

