

## Plan : Corriger l'erreur d'encodage WinAnsi dans le PDF

### Problème
`pdf-lib` avec les polices standard (Helvetica) utilise l'encodage WinAnsi qui ne supporte pas les emojis (💊, 📈, 🕐, 📊, 🎯, 🤖) ni certains caractères Unicode spéciaux. Cela provoque l'erreur `WinAnsi cannot encode`.

### Solution
Remplacer tous les emojis et caractères non-WinAnsi par des alternatives ASCII compatibles dans `supabase/functions/express-pdf/index.ts`.

### Modifications

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-pdf/index.ts` | Remplacer tous les emojis et caractères Unicode non-WinAnsi par des alternatives textuelles |

### Détails des remplacements

**Section titles (drawSectionTitle)** :
- `"💊"` → `"+"` (Score de Santé)
- `"📈"` → `">"` (Métriques Clés)
- `"🕐"` → `"*"` (Meilleurs Créneaux)
- `"📊"` → `"="` (Régularité Détaillée)
- `"🎯"` → `">"` (Persona Identifié)
- `"🤖"` → `">"` (Analyse Détaillée IA)

Mieux encore : supprimer les icônes du `drawSectionTitle` et ne garder que le texte en gras avec la ligne dorée. Plus propre et professionnel.

**Caractères dans le texte** :
- `"✓"` (vérifié, forces) → `"[v]"` ou supprimer
- `"•"` (bullet points) → `"-"`
- `"—"` (em dash dans formatNumber) → `"-"`
- `"·"` (score separator) → `-`

**Ajout d'une fonction `sanitize`** pour nettoyer automatiquement tout texte passé au PDF (bio, ai_insights, etc.) en supprimant les caractères hors WinAnsi, car les données venant de l'API peuvent aussi contenir des emojis.

