

## Plan : Remplacer le système PDF par l'approche "HTML string + detached element"

### Pourquoi ça marchera cette fois

L'approche actuelle essaie de rendre un composant React caché puis de le rendre visible pour `html2canvas`. Le problème : `html2canvas` ne capture pas correctement les éléments qui viennent d'être rendus visibles, même avec des délais.

L'approche du fichier uploadé est différente et plus fiable :
- Génère une **string HTML complète** (avec `<style>` intégré)
- Crée un `document.createElement("div")` **détaché du DOM visible**
- Passe ce div directement à `html2pdf()` → pas besoin de visibilité, pas de repaint

### Modifications

| Fichier | Action |
|---------|--------|
| `src/lib/pdf-markdown-parser.ts` | **Créer** — parser markdown → sections structurées |
| `src/lib/pdf-data-mapper.ts` | **Créer** — mapper les données account vers le format PDF |
| `src/pages/AnalyseExpressResult.tsx` | **Modifier** — remplacer `handleDownloadPdf` par la génération HTML string + detached div, supprimer l'import de `PdfReportTemplate` |
| `src/components/express-result/PdfReportTemplate.tsx` | **Supprimer** — plus nécessaire |

### Détail technique

**1. `handleDownloadPdf` refactorisé**

```typescript
const handleDownloadPdf = async () => {
  if (!username || !data?.account) return;
  setPdfLoading(true);
  try {
    const pdfData = mapAccountDataForPDF(data.account);
    const htmlContent = generateCompletePDFHTML(pdfData, data.account.ai_insights || "", data.account.recent_videos || []);
    
    // Élément détaché — pas dans le DOM visible
    const element = document.createElement("div");
    element.innerHTML = htmlContent;
    
    await html2pdf().set({
      margin: [10, 0, 10, 0],
      filename: `analyse-tiktok-${username}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"], avoid: [".stat-card", ".header", ".bio-section"] },
    }).from(element).save();
    
    toast.success("Rapport PDF téléchargé !");
  } catch (err: any) {
    toast.error(err.message || "Erreur lors du téléchargement");
  } finally {
    setPdfLoading(false);
  }
};
```

**2. `generateCompletePDFHTML`** — Fonction qui produit le HTML complet du rapport avec CSS intégré, même design violet/moderne que les fichiers uploadés : header hero avec gradient, grille de stats, bio, hashtags, vidéos top, insights IA formatés, footer.

**3. Le composant `PdfReportTemplate`** est supprimé car on n'a plus besoin d'un composant React rendu dans le DOM.

### Pourquoi c'est fiable

```text
Avant :  Composant React caché → toggle visibility → repaint → html2canvas → PDF (instable)
Après :  String HTML → createElement("div") → html2pdf directement (stable, pas de DOM visible)
```

`html2pdf.js` sait rendre un élément détaché car `html2canvas` l'ajoute temporairement au `<body>` lui-même pour le capturer.

