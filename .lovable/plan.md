

## Ajout de Google Analytics (gtag.js)

Ajout du script de tracking Google Analytics avec l'identifiant `G-E361JPZX7D`.

### Changements

1. **`index.html`** -- Ajouter les deux balises `<script>` Google Analytics dans le `<head>`, juste avant la fermeture `</head>`.

2. **`src/lib/tracking.ts`** -- Mettre a jour la fonction `trackEvent` pour envoyer les evenements a Google Analytics via `gtag()` au lieu de simplement les afficher dans la console.

### Details techniques

- Le script gtag.js sera charge de maniere asynchrone (`async`) pour ne pas bloquer le rendu de la page.
- La fonction `trackEvent` utilisera `window.gtag('event', ...)` pour envoyer les evenements personnalises.
- Une declaration TypeScript pour `window.gtag` et `window.dataLayer` sera ajoutee pour eviter les erreurs de typage.

