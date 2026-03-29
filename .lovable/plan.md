

## Plan : Lancer une analyse manuelle depuis /admin/analyses + fix build error

### Probleme actuel
1. L'analyse de @tanguycimalando est bloquee en "processing"
2. Pas de moyen de lancer une analyse manuellement sans passer par le flux Stripe
3. **Build error** : `check-vip-expiry/index.ts` utilise `npm:@supabase/supabase-js@2.57.2` au lieu de `https://esm.sh/...`

### Modifications

**1. Fix build error — `supabase/functions/check-vip-expiry/index.ts`**
Ligne 2 : remplacer `import { createClient } from "npm:@supabase/supabase-js@2.57.2"` par `import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"`

**2. Ajouter un formulaire de lancement manuel — `src/pages/admin/ExpressAnalyses.tsx`**
Ajouter en haut de la page un champ input + bouton "Lancer une analyse" :
- L'admin entre un username TikTok (avec ou sans @)
- Au clic, appel a `retry-express-analysis` modifie (ou une nouvelle edge function `manual-express-analysis`)
- Cree un enregistrement dans `express_analyses` avec un `stripe_session_id` fictif (`manual-{timestamp}`)
- Lance l'analyse via l'API WavSocialScan
- Polling automatique jusqu'a completion
- Le bouton PDF apparait quand c'est termine

**3. Nouvelle edge function `manual-express-analysis`**
Creer `supabase/functions/manual-express-analysis/index.ts` :
- Verifie le role admin (meme pattern que `retry-express-analysis`)
- Recoit `{ tiktok_username }`
- Appelle `POST /accounts/{username}/analyze` sur l'API WavSocialScan
- Cree un enregistrement `express_analyses` avec `stripe_session_id: "manual-{Date.now()}"`, `status: "processing"`, `job_id`
- Retourne `{ job_id, analysis_id }`

**4. UI dans ExpressAnalyses.tsx**
- Input avec placeholder `@username`
- Bouton "Lancer l'analyse"
- Apres lancement, l'analyse apparait dans le tableau avec le polling existant via `check-express-job`
- Le PDF est telechargeable une fois l'analyse complete (deja gere)

### Fichiers modifies
- `supabase/functions/check-vip-expiry/index.ts` (fix import)
- `supabase/functions/manual-express-analysis/index.ts` (nouveau)
- `src/pages/admin/ExpressAnalyses.tsx` (ajout formulaire + logique)
- `supabase/config.toml` (ajouter config pour `manual-express-analysis`)

