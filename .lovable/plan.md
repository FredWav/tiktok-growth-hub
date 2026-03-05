

## Diagnostic

Le lien `https://fredwav.com/start?utm_source=Tiktok&utm_medium=mp&utm_campaign=0326` fonctionne -- j'ai pu le charger sans problème. Le problème est que **la page `/start` (DiagnosticStart) n'utilise PAS le composant `Layout`**. Elle a son propre markup `min-h-screen` sans Header ni Footer. Conséquence : **le `TikTokBrowserBanner` n'apparaît jamais** sur cette page car il est uniquement dans `Layout.tsx`.

Le prospect dans le webview TikTok voit la page mais ne peut probablement pas interagir correctement (formulaires, redirections Stripe, liens externes) sans aucune indication qu'il faut ouvrir dans Safari/Chrome.

## Plan

### Ajouter le TikTokBrowserBanner sur la page DiagnosticStart

Dans `src/pages/DiagnosticStart.tsx`, importer et afficher `<TikTokBrowserBanner />` en haut de la page (avant le contenu), pour que les prospects arrivant depuis TikTok voient l'avertissement.

| Fichier | Action |
|---------|--------|
| `src/pages/DiagnosticStart.tsx` | Ajouter `<TikTokBrowserBanner />` en haut du render |

