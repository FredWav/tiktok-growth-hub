

## Téléchargement PDF depuis l'admin Analyses Express

### Probleme actuel
Les données complètes de l'analyse (account, persona, pubPattern) ne sont pas stockées en base — seuls le statut et le health_score le sont. Sans ces données, impossible de régénérer le PDF côté admin.

### Plan

#### 1. Migration : ajouter une colonne `result_data` (JSONB)
Ajouter une colonne `result_data jsonb` à la table `express_analyses` pour stocker le JSON complet retourné par l'API d'analyse.

#### 2. Modifier `express-analysis-status/index.ts`
Quand le job est `completed`, sauvegarder `job.result` dans `result_data` en plus du health_score et du statut.

#### 3. Mettre à jour le hook `useExpressAnalyses`
Ajouter `result_data` au type `ExpressAnalysis` pour qu'il soit disponible côté frontend.

#### 4. Ajouter un bouton "Télécharger PDF" dans `ExpressAnalyses.tsx`
- Nouvelle colonne "Actions" dans la table
- Bouton PDF visible uniquement pour les analyses `complete` ayant des `result_data`
- Utilise les fonctions existantes `mapAccountDataForPDF` + `generateCompletePDFHTML` + `html2pdf.js` (même logique que la page résultat client)

### Fichiers modifiés
- **Migration SQL** : ajout colonne `result_data`
- **`express-analysis-status/index.ts`** : stocke `job.result` en base
- **`src/hooks/useExpressAnalyses.ts`** : ajout du champ `result_data`
- **`src/pages/admin/ExpressAnalyses.tsx`** : bouton téléchargement PDF par ligne

