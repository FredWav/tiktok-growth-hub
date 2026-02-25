

## Plan : Corriger définitivement le PDF blanc

### Cause racine

Le problème persiste car après avoir changé `visibility` et `height` via JavaScript, le navigateur n'a pas le temps de faire un **repaint/reflow** avant que `html2canvas` ne capture l'élément. De plus, `zIndex: -9999` peut empêcher le rendu dans certains navigateurs.

### Solution

1. Sauvegarder les styles originaux avant modification
2. Rendre l'élément **complètement visible** (y compris `zIndex` positif et `pointerEvents: none` pour ne pas interférer avec l'UI)
3. Attendre un **tick de repaint** (`requestAnimationFrame` + petit délai) avant la capture
4. Restaurer tous les styles après

### Modifications

| Fichier | Changement |
|---------|-----------|
| `src/components/express-result/PdfReportTemplate.tsx` | Simplifier le style initial : `position: fixed`, `left: 0`, `top: 0`, `width: 800px`, `visibility: hidden`, `height: 0`, `overflow: hidden`, `pointerEvents: none` (sans `zIndex` négatif extrême) |
| `src/pages/AnalyseExpressResult.tsx` | Refactorer `handleDownloadPdf` pour : sauvegarder les styles originaux, tout rendre visible, attendre un repaint via `requestAnimationFrame` + `setTimeout(100ms)`, capturer, puis restaurer |

### Détail technique

**`PdfReportTemplate.tsx`** — ligne 99, wrapper :

```tsx
<div id="pdf-report-template" style={{ 
  position: "fixed", left: 0, top: 0, width: "800px", 
  visibility: "hidden", height: 0, overflow: "hidden", 
  pointerEvents: "none", zIndex: -1 
}}>
```

**`AnalyseExpressResult.tsx`** — `handleDownloadPdf` complet :

```typescript
const handleDownloadPdf = async () => {
  if (!username) return;
  const element = document.getElementById("pdf-report-template");
  if (!element) return;
  setPdfLoading(true);

  // Sauvegarder les styles originaux
  const orig = {
    visibility: element.style.visibility,
    height: element.style.height,
    overflow: element.style.overflow,
    zIndex: element.style.zIndex,
    pointerEvents: element.style.pointerEvents,
  };

  // Rendre visible pour html2canvas
  element.style.visibility = "visible";
  element.style.height = "auto";
  element.style.overflow = "visible";
  element.style.zIndex = "99999";
  element.style.pointerEvents = "none";

  // Attendre le repaint du navigateur
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 150);
    });
  });

  try {
    await (html2pdf() as any).set({
      margin: [10, 10, 10, 10],
      filename: `analyse-tiktok-${username}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    }).from(element).save();
    toast.success("Rapport PDF téléchargé !");
  } catch (err: any) {
    toast.error(err.message || "Erreur lors du téléchargement");
  } finally {
    // Restaurer les styles originaux
    element.style.visibility = orig.visibility;
    element.style.height = orig.height;
    element.style.overflow = orig.overflow;
    element.style.zIndex = orig.zIndex;
    element.style.pointerEvents = orig.pointerEvents;
    setPdfLoading(false);
  }
};
```

Le `requestAnimationFrame` + `setTimeout(150ms)` garantit que le navigateur a effectivement rendu le contenu avant que `html2canvas` ne le capture. Le `zIndex: 99999` assure que l'élément est au premier plan pour le rendu.

