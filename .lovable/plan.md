

## Plan : Corriger le PDF blanc

### Cause

Le composant `PdfReportTemplate` est positionné hors écran (`left: -9999px`). `html2canvas` ne peut pas capturer les éléments hors du viewport — il produit un canvas vide, donc un PDF blanc.

### Solution

Dans `handleDownloadPdf`, temporairement repositionner l'élément dans le viewport (mais visuellement caché via `opacity: 0` et `overflow: hidden` sur un wrapper), capturer le PDF, puis remettre l'élément hors écran.

### Modifications

| Fichier | Changement |
|---------|-----------|
| `src/components/express-result/PdfReportTemplate.tsx` | Supprimer le positionnement hors écran du wrapper. Utiliser `visibility: hidden; height: 0; overflow: hidden` à la place (reste dans le flux DOM mais invisible) |
| `src/pages/AnalyseExpressResult.tsx` | Dans `handleDownloadPdf`, temporairement rendre l'élément visible (`visibility: visible; height: auto; position: fixed; left: 0; top: 0`) avant la capture, puis restaurer après |

### Détail technique

**`PdfReportTemplate.tsx`** — ligne 99, changer le style du wrapper :

```tsx
// Avant (invisible pour html2canvas)
<div id="pdf-report-template" style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>

// Après (dans le DOM mais caché visuellement, sans décaler hors viewport)
<div id="pdf-report-template" style={{ position: "fixed", left: 0, top: 0, width: "800px", visibility: "hidden", zIndex: -9999, overflow: "hidden", height: 0 }}>
```

**`AnalyseExpressResult.tsx`** — dans `handleDownloadPdf`, rendre visible avant capture :

```typescript
const handleDownloadPdf = async () => {
  const element = document.getElementById("pdf-report-template");
  if (!element) return;
  setPdfLoading(true);

  // Rendre visible temporairement pour html2canvas
  element.style.visibility = "visible";
  element.style.height = "auto";
  element.style.overflow = "visible";

  try {
    await (html2pdf() as any).set({
      margin: [10, 10, 10, 10],
      filename: `analyse-tiktok-${username}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    }).from(element).save();
    toast.success("Rapport PDF téléchargé !");
  } catch (err: any) {
    toast.error(err.message || "Erreur lors du téléchargement");
  } finally {
    // Recacher
    element.style.visibility = "hidden";
    element.style.height = "0";
    element.style.overflow = "hidden";
    setPdfLoading(false);
  }
};
```

Cela garantit que `html2canvas` voit un élément rendu dans le DOM avec des dimensions réelles, et produit un canvas non vide.

