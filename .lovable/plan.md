

## Plan : Exclure les débutants du Wav Premium

### Logique actuelle
Le `level` (beginner/intermediate/advanced) est collecté à l'étape 2 mais n'influence **pas** le résultat. Seul le `budget` détermine l'offre recommandée. Un débutant qui sélectionne "500€+" est envoyé vers le Wav Premium.

### Modification sur `src/pages/DiagnosticStart.tsx`

**Changer `handleBudgetSelect`** pour croiser `level` et `budget` :
- Si `budget === "high"` **ET** `level === "beginner"` → forcer le résultat vers `low` (One Shot) avec un message adapté
- Sinon, comportement actuel inchangé

Concrètement, dans `handleBudgetSelect`, avant d'appeler `saveLead` :
```text
effectiveBudget = (budget === "high" && data.level === "beginner") ? "low" : budget
```

On utilise `effectiveBudget` pour `getRecommendedOffer()` et pour `setData`, mais on sauvegarde le `budget` original en base pour l'analytics.

**Optionnel** : adapter le texte du résultat One Shot pour les débutants redirigés, par exemple : "Le Wav Premium est réservé aux créateurs qui publient déjà. Pour ton niveau actuel, le One Shot est le meilleur point de départ : 1h30 pour poser les fondations de ta stratégie."

Un seul fichier modifié.

