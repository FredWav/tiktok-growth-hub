

## Plan : HTML vers PDF via une API de conversion externe

### Diagnostic

`pdf-lib` est une bibliothèque de bas niveau qui exige un encodage WinAnsi strict. Chaque caractère spécial (emoji, retour à la ligne, Unicode étendu) doit être manuellement filtré avant chaque appel `drawText`. C'est fragile car les données viennent d'une API externe imprévisible.

### Approche : générer le beau HTML + convertir via une API externe

La solution la plus fiable est de :
1. Recréer le template HTML stylisé (le "superbe HTML" d'avant) directement dans l'edge function
2. Envoyer ce HTML à une API de conversion HTML→PDF (qui utilise un vrai moteur de rendu navigateur côté serveur)
3. Récupérer le PDF binaire et le retourner au frontend

### API recommandée : **html2pdf.app** ou **PDFShift**

Ces services acceptent un HTML complet (avec CSS inline) et retournent un vrai PDF binaire. Le rendu est identique à un navigateur : polices, couleurs, barres de progression, mise en page — tout fonctionne.

| Service | Free tier | Fiabilité |
|---------|-----------|-----------|
| html2pdfapi.com | 200 PDF/mois | Haute |
| pdfshift.io | 50 PDF/mois | Haute |

Le volume d'Analyse Express étant faible, le free tier suffit.

### Modifications

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-pdf/index.ts` | Remplacement complet : générer le HTML stylisé + appeler l'API de conversion + retourner le PDF en base64 |

Le frontend (`AnalyseExpressResult.tsx`) reste inchangé — il reçoit déjà un `pdf_base64` et le télécharge.

### Détails techniques

**1. Générer le HTML dans l'edge function**

Le template HTML inclura tout le CSS inline (même style doré/noir que le site) :
- En-tête FredWav avec logo texte + date
- Profil : display_name, @username, bio, niche badge
- Health Score : score global + barres de progression CSS
- Métriques : grilles flexbox avec moyennes et médianes
- Top Hashtags : badges dorés
- Meilleurs créneaux : tableau formaté
- Régularité : barres de progression
- Persona : forces et faiblesses
- Analyse IA : texte formaté avec titres, listes, paragraphes
- Footer : "Généré par FredWav"

Aucune restriction d'encodage — le HTML supporte nativement les emojis, accents, caractères spéciaux.

**2. Appeler l'API de conversion**

```typescript
const response = await fetch("https://api.html2pdfapi.com/v1/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    html: htmlString,
    format: "A4",
    margin: { top: 20, bottom: 20, left: 20, right: 20 },
  }),
});
const pdfBuffer = await response.arrayBuffer();
```

**3. Retourner le PDF**

Encoder le buffer en base64 et retourner `{ pdf_base64: "..." }` — le frontend existant gère déjà le téléchargement.

### Secret requis

Un nouveau secret `HTML2PDF_API_KEY` devra être ajouté (clé gratuite obtenue en s'inscrivant sur le service choisi).

### Avantages vs pdf-lib

- Zéro problème d'encodage (le HTML gère tout nativement)
- Rendu identique au navigateur (CSS, fonts, emojis)
- Code beaucoup plus simple (HTML template vs. coordonnées manuelles)
- Maintenance facile (modifier le HTML, pas des coordonnées pixel)

