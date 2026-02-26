

## Aligner la génération PDF admin sur la logique user

### Différences identifiées

La fonction `downloadPDF` dans l'admin diffère de `handleDownloadPdf` côté user sur plusieurs points :

1. **Margins** : admin = `0`, user = `[10, 0, 10, 0]`
2. **html2canvas** : admin manque `allowTaint: true`
3. **pagebreak** : admin n'a pas les sélecteurs `avoid` (`.video-item`, `.stat-card`, etc.)
4. **Élément DOM** : admin appende au DOM puis nettoie — user utilise un élément détaché (plus propre, même résultat)
5. **Extraction persona/pubPattern** : admin extrait `result?.persona` et `result?.pubPattern` mais la structure stockée peut être `account.persona` ou `result.persona` selon le format retourné par l'API — le user utilise `data.persona` et `persona?.style_contenu?.publication_pattern`

### Plan

Réécrire `downloadPDF` dans `ExpressAnalyses.tsx` pour copier exactement la logique user :

```typescript
async function downloadPDF(analysis: any) {
  const result = analysis.result_data;
  const account = result?.account || result;
  const persona = result?.persona;
  const pubPattern = persona?.style_contenu?.publication_pattern;

  const pdfData = mapAccountDataForPDF(account, persona, pubPattern);
  const htmlContent = generateCompletePDFHTML(pdfData, account.ai_insights || '', account.recent_videos || []);

  const element = document.createElement("div");
  element.innerHTML = htmlContent;

  await html2pdf().set({
    margin: [10, 0, 10, 0],
    filename: `analyse-express-${analysis.tiktok_username}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
      avoid: [".video-item", ".stat-card", ".stats-grid", ".stats-section",
              ".bio-section", ".hashtags-section", ".header", ".hashtags-grid"],
    },
  }).from(element).save();
}
```

### Fichier modifié
- `src/pages/admin/ExpressAnalyses.tsx` — remplacement de la fonction `downloadPDF`

