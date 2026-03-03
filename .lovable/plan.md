

## Plan : Persistance progressive du diagnostic /start + page admin

### 1. Nouvelle table `diagnostic_leads`

Migration SQL pour créer une table qui stocke chaque lead du diagnostic avec sauvegarde progressive :

```sql
CREATE TABLE public.diagnostic_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  tiktok text,
  level text,
  objective text,
  blocker text,
  budget text,
  recommended_offer text,
  current_step integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diagnostic_leads"
  ON public.diagnostic_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert diagnostic_leads"
  ON public.diagnostic_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own diagnostic lead by id"
  ON public.diagnostic_leads FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_diagnostic_leads_updated_at
  BEFORE UPDATE ON public.diagnostic_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Modifier `src/pages/DiagnosticStart.tsx`

- Importer le client Supabase
- A l'etape 1 (apres validation identite) : `INSERT` une nouvelle ligne dans `diagnostic_leads` avec first_name, last_name, email, tiktok, current_step=1. Stocker le `id` retourne dans un state `leadId`
- A chaque etape suivante (level, objective, blocker, budget) : `UPDATE` la ligne existante avec la nouvelle donnee et current_step incremente
- A la fin (budget selectionne) : `UPDATE` avec budget, recommended_offer (calcule depuis budget), completed=true

### 3. Nouvelle page admin `/admin/diagnostics`

Creer `src/pages/admin/Diagnostics.tsx` :
- Meme structure que `Applications.tsx` (AdminLayout, Table, Dialog detail)
- Stats en haut : total leads, completes, cette semaine
- Tableau avec colonnes : Date, Nom, Email, TikTok, Etape, Budget, Offre recommandee, Complet
- Dialog avec detail complet au clic
- Badge couleur pour l'etape courante et le statut complete/incomplet

### 4. Hook `src/hooks/useDiagnosticLeads.ts`

Query hook pour fetcher les leads depuis `diagnostic_leads`, ordonne par created_at desc.

### 5. Ajouter la route et le lien nav

- `src/App.tsx` : ajouter route `/admin/diagnostics` protegee admin
- `src/components/layout/AdminLayout.tsx` : ajouter item nav "Diagnostics" avec icone `Stethoscope`

