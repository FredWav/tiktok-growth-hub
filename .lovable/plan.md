

## Plan : Ajouter des logs complets et tester tous les chemins

### Analyse des chemins utilisateur

12 combinaisons audience×budget possibles (l'objectif et le temps n'affectent pas le routage d'offre) :

```text
Audience  | Budget    | Offre DB               | Offre Result       | Min blocage
----------|-----------|------------------------|--------------------|------------
0-5k      | 0         | express                | EXPRESS            | 10 chars
0-5k      | 1-200     | one_shot               | ONE_SHOT           | 10 chars
0-5k      | 200-500   | one_shot               | ONE_SHOT           | 10 chars
0-5k      | 500+      | one_shot               | ONE_SHOT           | 10 chars
5k-50k    | 0         | express                | EXPRESS            | 150 chars
5k-50k    | 1-200     | one_shot               | ONE_SHOT           | 150 chars
5k-50k    | 200-500   | one_shot_plus_premium  | ONE_SHOT_PLUS_PREM | 150 chars
5k-50k    | 500+      | premium                | PREMIUM            | 150 chars
50k+      | 0         | express                | EXPRESS            | 150 chars
50k+      | 1-200     | one_shot               | ONE_SHOT           | 150 chars
50k+      | 200-500   | premium                | PREMIUM            | 150 chars
50k+      | 500+      | premium                | PREMIUM            | 150 chars
```

4 objectifs × 4 temps = 16 variantes par cellule (mais n'affectent que le score et le texte, pas le routage).

### Verdict de l'audit

**La logique est cohérente.** `getRecommendedOffer()` (DiagnosticStart) et `getOffer()` (DiagnosticResult) ont exactement la meme logique. Les `saveLead` accumulent les champs sans ecrasement. Le notify-diagnostic envoie tous les champs. Aucun doublon possible grace au `leadIdRef`.

### Changements prevus

**1. `src/pages/DiagnosticStart.tsx`** — Ajouter des console.log :
- `saveLead` : log des fields, currentStep, mode (insert/update), resultat/erreur
- `handleIdentityNext` : log des donnees validees
- `handleEmailNext` : log email valide
- `handleBlockerNext` : log du blocage, offre recommandee, payload notify-diagnostic, et capturer le resultat de l'invoke (actuellement fire-and-forget)
- `selectOption` : log field/value/dbField/stepNum
- Chaque transition de step

**2. `src/pages/DiagnosticProcessing.tsx`** — Log si redirect (isComplete=false)

**3. `src/pages/DiagnosticResult.tsx`** — Log du score calcule, de l'offre routee, et des donnees du context

### Apres implementation

Tester via le browser les 4 chemins d'offre principaux en verifiant les console logs a chaque etape :
1. 0-5k + budget 0 → Express
2. 0-5k + budget 1-200 → One Shot  
3. 5k-50k + budget 200-500 → One Shot + Premium
4. 50k+ + budget 500+ → Premium

