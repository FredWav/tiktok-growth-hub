## Plan : sync backend pour la refonte « Réserver un appel »

Le code (front + migration + edge function) est déjà mergé dans le repo. Il ne reste qu'à pousser les changements backend côté Lovable Cloud.

### Actions

1. **Appliquer la migration** `20260530000000_replace_qualification_questions_wav_premium_applications.sql` via l'outil de migration Supabase. Contenu déjà vérifié :
   - Ajout colonnes `profil`, `motivation`, `accompagnement_type`, `accompagnement_critere` (text)
   - `current_level` / `blockers` rendus nullable + suppression des CHECK associés
   - Ajout CHECK non-vide sur `profil`, `motivation`, `accompagnement_type`
   - Remplacement policy RLS INSERT « Anyone can insert valid applications » (exige désormais les 3 nouveaux champs + `goals`, plus `current_level`/`blockers`)

2. **Redéployer l'edge function** `notify-application` via `supabase--deploy_edge_functions` (le code source est déjà à jour dans `supabase/functions/notify-application/index.ts`).

3. **Vérifications post-déploiement** :
   - (a) `information_schema.columns` confirme les 4 nouvelles colonnes
   - (b) `pg_policies` confirme la nouvelle policy INSERT
   - (c) `notify-application` listée comme déployée
   - (d) `src/integrations/supabase/types.ts` est régénéré automatiquement par Lovable après la migration ; le front est déjà sur main donc déployé via le pipeline Lovable habituel

### Notes
- La migration est non destructive (colonnes historiques conservées) — aucun risque sur les données existantes.
- Pas de changement secrets / config.toml requis.
