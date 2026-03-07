

## Audit complet du pipeline diagnostic : problemes identifies et corrections

### Problemes critiques trouves

**1. BUG : Le champ `temps` ecrase `level` (audience) en base**
Dans `DiagnosticStart.tsx` ligne 299-302, l'etape 5 (Temps) sauvegarde dans le champ DB `level` — le meme champ utilise par l'etape 2 (Audience). Resultat : en base, `level` contient la valeur temps au lieu de l'audience.

**2. Pas de colonne `temps` dans `diagnostic_leads`**
La table n'a pas de colonne dediee pour stocker le temps hebdomadaire.

**3. `notify-diagnostic` ne transmet pas le `temps`**
Le payload envoye a l'edge function ne contient pas `temps`. Discord et l'email SMTP ne l'affichent pas.

**4. Admin Diagnostics completement desynchronise**
- `stepLabels` s'arrete a 5 (ancien flow) au lieu de 7
- `budgetLabels` et `offerLabels` utilisent les anciennes valeurs (`none`, `low`, `mid`, `high`, `discord`, `vip`)
- Le detail du lead n'affiche ni le `temps` ni l'`email` correctement
- L'export CSV n'inclut pas le `temps`

---

### Plan de corrections

**1. Migration DB** : Ajouter colonne `temps text` a `diagnostic_leads`

**2. `src/pages/DiagnosticStart.tsx`**
- Step 5 : changer le dbField de `"level"` a `"temps"` pour sauvegarder dans la bonne colonne

**3. `supabase/functions/notify-diagnostic/index.ts`**
- Ajouter `temps` au destructuring du body
- Ajouter un champ "⏱️ Temps/semaine" dans l'embed Discord et le tableau HTML de l'email SMTP

**4. `src/pages/DiagnosticStart.tsx`**
- Ajouter `temps: data.temps` dans le body de `supabase.functions.invoke("notify-diagnostic")`

**5. `src/pages/admin/Diagnostics.tsx`**
- Mettre a jour `stepLabels` pour 7 etapes : 0 Accueil, 1 Identite, 2 Audience, 3 Objectif, 4 Budget, 5 Temps, 6 Email, 7 Blocage
- Mettre a jour `budgetLabels` avec les nouvelles valeurs (`"0"`, `"1-200"`, `"200-500"`, `"500+"`)
- Mettre a jour `offerLabels` avec `express`, `one_shot`, `one_shot_plus_premium`, `premium`
- Ajouter colonne "Temps" dans le tableau
- Ajouter "Temps" dans le dialog de detail
- Ajouter "Temps" dans l'export CSV

**6. `src/hooks/useDiagnosticLeads.ts`**
- Ajouter `temps: string | null` au type `DiagnosticLead`

