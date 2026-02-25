

## Plan : Générer le PDF côté client avec html2pdf.js

### Pourquoi côté client ?

`html2pdf.js` est une bibliothèque **navigateur** qui utilise `html2canvas` + `jsPDF` sous le capot. Elle a besoin du DOM du navigateur pour fonctionner — elle ne peut pas tourner dans une edge function (environnement Deno sans DOM).

La bonne approche : générer le PDF directement dans le navigateur de l'utilisateur, en utilisant les données déjà disponibles côté client. Plus besoin d'appeler l'edge function pour le PDF.

### Avantages

- Zéro problème d'encodage (HTML natif, emojis, accents, tout passe)
- Zéro API externe, zéro clé API, gratuit
- Rendu fidèle au HTML affiché
- Bibliothèque stable et maintenue (900K+ téléchargements/semaine)

### Modifications

| Fichier | Changement |
|---------|-----------|
| `package.json` | Ajouter `html2pdf.js` comme dépendance |
| `src/pages/AnalyseExpressResult.tsx` | Remplacer l'appel à l'edge function par la génération client avec html2pdf.js |
| `src/components/express-result/PdfReportTemplate.tsx` | **Nouveau** — composant HTML caché (hors écran) qui contient le template complet du rapport, stylisé avec le même design doré/noir |
| `supabase/functions/express-pdf/index.ts` | Supprimer (plus nécessaire) |

### Détails techniques

**1. Nouveau composant `PdfReportTemplate`**

Un composant React rendu hors écran (`position: absolute; left: -9999px`) qui contient tout le rapport en HTML avec CSS inline :
- En-tête FredWav + date + @username
- Score de santé avec barres de progression CSS
- Grilles de métriques (moyennes, médianes)
- Top hashtags en badges dorés
- Meilleurs créneaux
- Régularité détaillée
- Persona (forces/faiblesses)
- Analyse IA formatée (titres, listes, paragraphes)
- Footer "Généré par FredWav"

Le composant reçoit les mêmes `data` et `username` déjà disponibles dans la page.

**2. Génération PDF dans `handleDownloadPdf`**

```typescript
import html2pdf from 'html2pdf.js';

const handleDownloadPdf = async () => {
  const element = document.getElementById('pdf-report-template');
  if (!element) return;

  await html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: `analyse-tiktok-${username}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }).from(element).save();
};
```

Plus d'appel à l'edge function, plus de Stripe verification pour le PDF (le paiement est déjà vérifié en amont lors de l'analyse).

**3. Suppression de l'edge function `express-pdf`**

L'edge function `express-pdf/index.ts` n'est plus nécessaire et sera supprimée pour nettoyer le code.

### Flux simplifié

```text
Avant :  Client → Edge Function (pdf-lib + sanitize) → PDF base64 → téléchargement
Après :  Client → html2pdf.js (HTML → canvas → PDF) → téléchargement direct
```

