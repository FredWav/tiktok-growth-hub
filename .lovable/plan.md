

## Mise à jour vers API WavSocialScan v1.1 — Corrections restantes

Le code est déjà largement à jour (job-based workflow, `X-API-Key`), mais il reste 3 écarts avec la doc v1.1 :

### 1. `express-analysis-status/index.ts` — Champ d'erreur incorrect

La doc montre que pour un job `failed`, l'erreur est dans `job.error` (au top-level), pas dans `job.result.error` :

```json
{ "status": "failed", "error": "Account not found", "retry_count": 3 }
```

Ligne 62 actuelle : `job.result?.error` → corriger en `job.error`

### 2. `AnalyseExpressResult.tsx` — Labels d'étapes obsolètes

L'API retourne maintenant des chaînes descriptives dans `current_step` (ex: `"Analyzing TikTok account..."`, `"Fetching account data"`, `"Completed"`), pas des clés courtes comme `scraping`, `metrics`. Le mapping `stepLabels` ne correspondra plus.

Correction : afficher directement `current_step` tel quel au lieu de passer par un mapping.

### 3. `AnalyseExpressResult.tsx` — Viral potential (échelle)

La doc montre `viral_potential: 0.75` (échelle 0-1), mais l'UI affiche `{viral_potential}/10`. Corriger pour afficher en pourcentage (`75%`).

### 4. `AnalyseExpressResult.tsx` — Timeout trop court

Actuellement 3 minutes (`MAX_POLL_DURATION = 180_000`). L'API recommande un timeout de 10 minutes. Augmenter à 10 minutes.

---

### Résumé des fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/express-analysis-status/index.ts` | `job.error` au lieu de `job.result?.error` |
| `src/pages/AnalyseExpressResult.tsx` | Supprimer `stepLabels`, afficher `current_step` directement, corriger viral_potential (×100%), augmenter timeout à 10 min |

