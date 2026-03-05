

## Diagnostic

Après recherche, voici l'état des lieux technique pour forcer l'ouverture dans un navigateur externe depuis le webview TikTok :

- **Android** : l'`intent://` scheme fonctionne déjà dans le code actuel -- ça ouvre Chrome automatiquement. C'est une vraie solution technique.
- **iOS** : **il n'existe aucun moyen fiable de forcer l'ouverture dans Safari** depuis un webview in-app. Les schemes comme `x-safari-https://` ou `googlechrome://` sont bloqués par TikTok. C'est une limitation système iOS que tous les développeurs web subissent.

La meilleure solution technique possible sur iOS est de **rediriger automatiquement** dès la détection du webview TikTok, sans attendre que l'utilisateur clique. Sur Android, on peut déclencher l'intent immédiatement. Sur iOS, on peut au moins tenter le `googlechrome://` scheme (si Chrome est installé) et sinon afficher l'URL de manière très visible et impossible à ignorer.

## Plan

### Redirection automatique au lieu d'un banner passif

Transformer le `TikTokBrowserBanner` en une **page de redirection bloquante** plutôt qu'un simple banner informatif :

1. **Android** : déclencher automatiquement l'intent Chrome dès le chargement (pas besoin de cliquer)
2. **iOS** : tenter `googlechrome://` en auto, et afficher immédiatement un **overlay plein écran** (pas un petit banner) avec l'URL copiable + instructions visuelles claires pour ouvrir dans Safari via le menu natif TikTok
3. Le contenu de la page est masqué derrière l'overlay tant que l'utilisateur est dans le webview TikTok -- ça force l'action

| Fichier | Action |
|---------|--------|
| `src/components/TikTokBrowserBanner.tsx` | Remplacer le banner par un overlay plein écran bloquant avec redirection auto sur Android, tentative Chrome + instructions visuelles sur iOS |

