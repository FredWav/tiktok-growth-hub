-- ============================================================
-- Refonte des questions de qualification de wav_premium_applications
-- ------------------------------------------------------------
-- Remplace Niveau (current_level) + Points de blocage (blockers)
-- par 4 nouvelles questions : profil, motivation,
-- accompagnement_type (obligatoires) et accompagnement_critere
-- (facultatif). La question Q5 « Qu'est-ce qui t'amène à réserver
-- cet appel ? » réutilise la colonne existante `goals`, qui reste
-- obligatoire (NOT NULL + check_goals_not_empty + RLS).
--
-- Les colonnes current_level / blockers sont CONSERVÉES (rendues
-- nullable) pour ne pas perdre les candidatures historiques.
-- ============================================================

-- 1. Nouvelles colonnes
ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS profil text,
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS accompagnement_type text,
  ADD COLUMN IF NOT EXISTS accompagnement_critere text;

-- 2. Retirer la protection des champs abandonnés (current_level, blockers)
ALTER TABLE public.wav_premium_applications
  DROP CONSTRAINT IF EXISTS check_current_level_not_empty,
  DROP CONSTRAINT IF EXISTS check_blockers_not_empty;

ALTER TABLE public.wav_premium_applications
  ALTER COLUMN current_level DROP NOT NULL,
  ALTER COLUMN blockers DROP NOT NULL;

-- 3. Protéger les nouveaux champs obligatoires (miroir du pattern existant).
--    NB : un CHECK est satisfait lorsque l'expression vaut NULL, donc les
--    lignes historiques (nouvelles colonnes à NULL) passent sans souci ;
--    la présence réelle sur les nouveaux inserts est garantie par la
--    policy RLS ci-dessous (4), qui rejette NULL et chaîne vide.
ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_profil_not_empty
    CHECK (trim(profil) <> ''),
  ADD CONSTRAINT check_motivation_not_empty
    CHECK (trim(motivation) <> ''),
  ADD CONSTRAINT check_accompagnement_type_not_empty
    CHECK (trim(accompagnement_type) <> '');

-- 4. Remplacer la policy INSERT : on retire les exigences current_level /
--    blockers, on conserve goals (= Q5) et on ajoute les 3 nouveaux
--    champs obligatoires.
DROP POLICY IF EXISTS "Anyone can insert valid applications" ON public.wav_premium_applications;

CREATE POLICY "Anyone can insert valid applications"
ON public.wav_premium_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  trim(first_name) <> ''
  AND trim(last_name) <> ''
  AND trim(email) <> ''
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND trim(goals) <> ''
  AND trim(profil) <> ''
  AND trim(motivation) <> ''
  AND trim(accompagnement_type) <> ''
);
