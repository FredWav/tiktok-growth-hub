

## Plan : Bouton "Relancer l'analyse" dans l'admin

### 1. Nouvelle edge function `retry-express-analysis`

Créer `supabase/functions/retry-express-analysis/index.ts` :
- Reçoit `{ tiktok_username, analysis_id }` en POST
- Vérifie que l'appelant est admin (via auth token + check `user_roles`)
- Appelle l'API WavSocialScan (`POST /accounts/{username}/analyze`) pour obtenir un nouveau `job_id`
- Met à jour le record `express_analyses` : status → `processing`, nouveau `job_id`, reset `error_message`, `result_data`, `health_score`
- Retourne le nouveau `job_id`

### 2. Frontend : bouton relancer + polling dans `ExpressAnalyses.tsx`

Modifier `src/pages/admin/ExpressAnalyses.tsx` :
- Ajouter un bouton "Relancer" (icône `RefreshCw`) visible quand l'analyse est `failed` ou `complete` avec `ai_insights` manquant
- Au clic, appeler la edge function `retry-express-analysis`
- Mettre le statut local en "processing" et lancer un polling sur `express-analysis-status` avec le nouveau `job_id` jusqu'à completion
- Une fois terminé, invalider le query cache (`queryClient.invalidateQueries`) pour rafraîchir la liste
- Le bouton Download PDF existant fonctionnera ensuite normalement avec les nouvelles données

### 3. Config TOML

Ajouter dans `supabase/config.toml` :
```toml
[functions.retry-express-analysis]
verify_jwt = false
```

### Fichiers modifiés/créés
- `supabase/functions/retry-express-analysis/index.ts` (nouveau)
- `src/pages/admin/ExpressAnalyses.tsx` (bouton relancer + logique polling)
- `supabase/config.toml` (config JWT)

