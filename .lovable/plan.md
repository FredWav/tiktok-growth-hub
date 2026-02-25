## Plan : Générer un vrai PDF

### Problème actuel

Le rapport est téléchargé en `.html`. L'utilisateur veut un vrai fichier `.pdf`.

### Approche retenue : `window.print()` côté client

Générer un PDF natif côté serveur dans une edge function Deno est techniquement très complexe (pas de Puppeteer/Chrome headless disponible dans Supabase Edge Functions). Les alternatives pures JS (jsPDF, pdf-lib) ne supportent pas le rendu HTML riche.

La solution la plus fiable et qualitative : ouvrir le HTML dans un nouvel onglet et déclencher `window.print()` automatiquement, ce qui permet à l'utilisateur d'enregistrer en PDF via la boîte de dialogue d'impression du navigateur (tous les navigateurs modernes ont "Enregistrer en PDF").

### Modifications


| Fichier                                   | Changement                                                                                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/AnalyseExpressResult.tsx`      | Modifier `handleDownloadPdf` : au lieu de télécharger un `.html`, ouvrir le HTML reçu dans un nouvel onglet avec un script `window.print()` auto-injecté |
| `supabase/functions/express-pdf/index.ts` | Ajouter un script `window.onload = () => window.print()` dans le HTML généré + un bouton "Enregistrer en PDF" visible à l'écran (masqué en impression)   |


### Détails techniques

**Edge function** : ajouter dans le `<body>` du HTML généré :

- Un bouton flottant "Enregistrer en PDF" avec `onclick="window.print()"` et la classe `no-print` (déjà dans le CSS `@media print`)
- Un script `window.onload` qui déclenche `window.print()` automatiquement après chargement

**Frontend** : modifier `handleDownloadPdf` pour :

1. Recevoir le HTML de l'edge function (inchangé)
2. Au lieu de créer un blob `.html` et télécharger, ouvrir un nouvel onglet avec `window.open()` et y écrire le HTML via `document.write()`
3. Le `window.print()` se déclenche automatiquement dans le nouvel onglet

Le résultat : l'utilisateur clique "Télécharger le rapport PDF" → un onglet s'ouvre avec le rapport bien formaté → la boîte de dialogue d'impression apparaît automatiquement → il choisit "Enregistrer en PDF" → il obtient un vrai `.pdf`.  
  
  
! ATTENTION à ne pas couper des paragraphe avec le saut de page !