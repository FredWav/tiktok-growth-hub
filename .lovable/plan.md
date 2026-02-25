

## Plan : Passer au système de Jobs asynchrones de l'API WavSocialScan v1.1

### Diagnostic

L'API a changé son workflow :
- **Avant** : `POST /analyze` lance l'analyse, puis on poll `GET /accounts/:username` pour vérifier si le `health_score` est disponible.
- **Maintenant** : `POST /analyze` retourne un `job_id` avec `status: "pending"`. On poll `GET /jobs/:jobId` pour suivre la progression. Quand `status === "completed"`, le champ `result` contient les données.

```text
Ancien flux :
  POST /accounts/:username/analyze → poll GET /accounts/:username → check health_score.total

Nouveau flux :
  POST /accounts/:username/analyze → { job_id } 
  poll GET /jobs/:job_id → { status, progress, current_step }
  quand status === "completed" → result contient les données
```

### Modifications

**Fichier 1 : `supabase/functions/express-analysis/index.ts`**

- Après le `POST /analyze`, récupérer le `job_id` de la réponse (status 202)
- Retourner `{ username, job_id, status: "processing" }` au client (au lieu de juste `username`)

**Fichier 2 : `supabase/functions/express-analysis-status/index.ts`**

- Changer le body attendu : accepter `{ session_id, job_id }` (le `job_id` vient du client)
- Remplacer l'appel `GET /accounts/:username` par `GET /jobs/:jobId`
- Adapter la logique de statut :
  - Si `status === "completed"` et `result` présent → retourner `{ status: "complete", data: result, username }`
  - Si `status === "failed"` → retourner `{ status: "failed", error: result.error, username }`
  - Sinon (queued/processing/retrying) → retourner `{ status: "processing", progress, current_step, username }`

**Fichier 3 : `src/pages/AnalyseExpressResult.tsx`**

- Stocker le `job_id` reçu de `express-analysis` dans un state
- Passer le `job_id` à chaque appel de polling vers `express-analysis-status`
- Afficher la progression (`progress` %) et l'étape en cours (`current_step`) pendant le chargement
- Gérer le statut `failed` avec un message d'erreur approprié
- Changer l'intervalle de polling de 3s à 5s (recommandation API : 5-10s)

### Détails techniques

- Le `job_id` est un UUID retourné par l'API lors du POST /analyze (status HTTP 202)
- La vérification Stripe reste dans les deux fonctions pour la sécurité
- Le `progress` (0-100) et `current_step` permettent d'afficher une vraie barre de progression au lieu d'un simple skeleton
- Le statut `failed` avec `retry_count` permet d'informer l'utilisateur précisément
- Le polling à 5s respecte la recommandation de l'API (ne pas poller plus d'1 fois/seconde)

