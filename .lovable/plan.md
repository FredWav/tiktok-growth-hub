

## Suivi des Analyses Express dans le panneau admin

### Objectif
Stocker chaque analyse express en base de données avec son statut (processing, complete, failed) pour que l'admin puisse voir l'historique et savoir si ça s'est bien passé.

### 1. Créer la table `express_analyses`

```sql
CREATE TABLE public.express_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL,
  tiktok_username text NOT NULL,
  job_id text,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, complete, failed
  error_message text,
  health_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.express_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all express_analyses"
  ON public.express_analyses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Modifier les edge functions pour écrire en base

**`express-analysis/index.ts`** : Après le paiement vérifié, insérer une ligne `status: 'processing'` avec le `tiktok_username`, `stripe_session_id` et `job_id`.

**`express-analysis-status/index.ts`** : Quand le job est `completed` ou `failed`, mettre à jour la ligne correspondante avec le statut final, le `health_score` (si disponible), et `completed_at`.

### 3. Créer la page admin `/admin/analyses`

**Nouveau fichier `src/pages/admin/ExpressAnalyses.tsx`** :
- Table listant toutes les analyses express (date, username, statut, health score)
- Badge de couleur selon le statut : vert (complete), jaune (processing), rouge (failed)
- Tri par date décroissante

### 4. Hook `useExpressAnalyses`

**Nouveau fichier `src/hooks/useExpressAnalyses.ts`** :
- Query React Query pour récupérer les analyses depuis la table `express_analyses`

### 5. Ajouter au menu admin et aux routes

**`src/components/layout/AdminLayout.tsx`** : Ajouter un lien "Analyses Express" avec l'icône `Zap` dans la navigation.

**`src/App.tsx`** : Ajouter la route `/admin/analyses` (protégée admin).

### 6. KPI sur le Dashboard admin

**`src/pages/admin/Dashboard.tsx`** : Ajouter une carte avec le nombre d'analyses du mois et le taux de succès.

### Fichiers modifiés/créés
- **Migration SQL** : table `express_analyses`
- **Modifiés** : `express-analysis/index.ts`, `express-analysis-status/index.ts`, `AdminLayout.tsx`, `App.tsx`, `Dashboard.tsx`
- **Nouveaux** : `src/pages/admin/ExpressAnalyses.tsx`, `src/hooks/useExpressAnalyses.ts`

