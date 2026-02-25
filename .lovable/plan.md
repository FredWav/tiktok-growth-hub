

## Plan : Générer un vrai fichier PDF binaire avec pdf-lib

### Problème
L'utilisateur veut télécharger un vrai `.pdf`, pas un HTML qui ouvre une boîte d'impression.

### Approche retenue : `pdf-lib` côté serveur

La bibliothèque `pdf-lib` fonctionne nativement dans Deno (pure JS, pas de dépendances natives). Elle permet de créer un vrai document PDF binaire que l'edge function retournera directement. Le frontend le téléchargera comme un fichier `.pdf`.

### Modifications

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-pdf/index.ts` | Remplacement complet : utiliser `pdf-lib` pour générer un PDF binaire au lieu de HTML. Retourner le PDF en `application/pdf` encodé en base64 |
| `src/pages/AnalyseExpressResult.tsx` | Modifier `handleDownloadPdf` : décoder le base64, créer un Blob PDF et déclencher le téléchargement direct du fichier `.pdf` |

### Structure du PDF (même contenu qu'avant, rendu avec pdf-lib)

1. **En-tête** : "FredWav — Analyse TikTok Express", date, @username
2. **Profil** : display_name, @username, bio, niche (pas d'avatar car les images distantes complexifient beaucoup pdf-lib)
3. **Health Score** : score global avec barre colorée + composants avec barres de progression
4. **Métriques** : grille abonnés/likes/vidéos/engagement + moyennes + médianes
5. **Top Hashtags** : liste formatée
6. **Meilleurs créneaux** : top 5 horaires avec jours en français
7. **Régularité** : sous-scores avec barres
8. **Persona** : niche, forces, faiblesses
9. **Analyse IA** : texte formaté (titres en gras, listes à puces, paragraphes)
10. **Pied de page** : "Généré par FredWav" + date

### Détails techniques

**Edge function** :
- Import : `import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts"`
- Polices embarquées : Helvetica (body) + Helvetica-Bold (titres) — polices standard PDF, pas besoin de fichiers externes
- Couleurs mappées : or `rgb(0.769, 0.639, 0.29)`, noir `rgb(0.059, 0.059, 0.059)`, gris `rgb(0.451, 0.451, 0.451)`
- Pagination automatique : vérifier l'espace restant avant chaque section, ajouter une nouvelle page si nécessaire
- Barres de progression : rectangles dessinés avec `page.drawRectangle()`
- Le PDF est sérialisé en `Uint8Array` puis encodé en base64 pour le transport JSON
- Retour : `{ pdf_base64: "..." }` au lieu de `{ html: "..." }`

**Frontend** :
- Décoder le base64 en `Uint8Array`
- Créer un `Blob` avec type `application/pdf`
- Créer un lien temporaire `<a>` avec `URL.createObjectURL(blob)` et attribut `download="analyse-tiktok-USERNAME.pdf"`
- Cliquer programmatiquement pour déclencher le téléchargement
- L'utilisateur reçoit directement un fichier `.pdf` dans ses téléchargements

### Limites acceptées
- Pas d'avatar (charger des images distantes dans pdf-lib est possible mais fragile dans un edge function avec timeout)
- Polices standard PDF (Helvetica) au lieu de Inter/Playfair — aspect professionnel mais pas identique au web
- Le markdown AI insights sera rendu en texte formaté (gras, sauts de ligne, indentation) plutôt qu'en HTML riche

