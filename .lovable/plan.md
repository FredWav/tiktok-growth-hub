

## Probleme identifie

Le polling admin lit juste la table `express_analyses` dans la DB. Mais quand on relance un job, **rien ne met a jour la DB** quand le job se termine cote API. La function `express-analysis-status` fait ca, mais elle est appelee uniquement depuis la page resultat client (et requiert un `session_id` Stripe).

Le job `0056b888` pour `@capsulescards` est bien `completed` cote API mais reste `processing` en DB.

## Solution

### 1. Nouvelle edge function `check-express-job`

Creer `supabase/functions/check-express-job/index.ts` :
- Recoit `{ job_id, analysis_id }` en POST
- Verifie que l'appelant est admin
- Appelle l'API WavSocialScan `GET /jobs/{job_id}` pour verifier le statut
- Si `completed` : met a jour `express_analyses` (status, result_data, health_score, completed_at)
- Si `failed` : met a jour avec erreur
- Si toujours en cours : retourne le statut sans modification
- Pas besoin de `session_id` Stripe (l'admin a deja le droit)

### 2. Modifier le polling dans `ExpressAnalyses.tsx`

Remplacer le polling qui lit la DB par un appel a `check-express-job` :
- A chaque tick (5s), appeler la edge function avec `job_id` et `analysis_id`
- La function verifie le statut sur l'API ET met a jour la DB
- Quand le statut est `complete` ou `failed`, arreter le polling et rafraichir le cache

### 3. Config TOML

Ajouter `[functions.check-express-job]` avec `verify_jwt = false`.

### Fichiers
- `supabase/functions/check-express-job/index.ts` (nouveau)
- `src/pages/admin/ExpressAnalyses.tsx` (polling modifie)
- `supabase/config.toml` (ajout function)

