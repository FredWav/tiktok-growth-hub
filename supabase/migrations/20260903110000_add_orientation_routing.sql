-- Routeur commercial v2 pour /reserverunappel.
-- Les colonnes historiques restent intactes pour conserver les anciennes candidatures.

ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS form_version text,
  ADD COLUMN IF NOT EXISTS account_url text,
  ADD COLUMN IF NOT EXISTS business_stage text,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS main_blocker text,
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS qualification_route text,
  ADD COLUMN IF NOT EXISTS recommended_offer text,
  ADD COLUMN IF NOT EXISTS qualification_score integer;

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_orientation_form_version
    CHECK (form_version IS NULL OR form_version = 'orientation_v2'),
  ADD CONSTRAINT check_orientation_account_url
    CHECK (account_url IS NULL OR (trim(account_url) <> '' AND char_length(account_url) <= 500)),
  ADD CONSTRAINT check_orientation_business_stage
    CHECK (business_stage IS NULL OR business_stage = ANY (ARRAY[
      'debut',
      'irregulier',
      'stagnation',
      'visibilite_sans_revenus',
      'activite_a_accelerer'
    ])),
  ADD CONSTRAINT check_orientation_primary_goal
    CHECK (primary_goal IS NULL OR primary_goal = ANY (ARRAY[
      'comprendre_contenus',
      'gagner_visibilite',
      'attirer_clients',
      'mieux_vendre',
      'structurer_strategie'
    ])),
  ADD CONSTRAINT check_orientation_main_blocker
    CHECK (main_blocker IS NULL OR (char_length(trim(main_blocker)) BETWEEN 20 AND 2000)),
  ADD CONSTRAINT check_orientation_work_mode
    CHECK (work_mode IS NULL OR work_mode = ANY (ARRAY[
      'outils_autonomes',
      'plan_ponctuel',
      'suivi_collectif',
      'suivi_individuel',
      'a_definir',
      'autonome',
      'regard_strategique'
    ])),
  ADD CONSTRAINT check_orientation_route
    CHECK (qualification_route IS NULL OR qualification_route = ANY (ARRAY['wavstats', 'express', 'call'])),
  ADD CONSTRAINT check_orientation_recommended_offer
    CHECK (recommended_offer IS NULL OR recommended_offer = ANY (ARRAY['wavstats', 'express', 'academy', 'sprint', 'one_shot', 'premium'])),
  ADD CONSTRAINT check_orientation_score
    CHECK (qualification_score IS NULL OR qualification_score BETWEEN 0 AND 9);

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
  AND budget = ANY (ARRAY[
    'total_no_budget',
    'total_15_a_100',
    'total_100_a_300',
    'total_300_a_900',
    'total_900_plus'
  ])
  AND (
    (
      form_version = 'orientation_v2'
      AND trim(account_url) <> ''
      AND business_stage IS NOT NULL
      AND primary_goal IS NOT NULL
      AND char_length(trim(main_blocker)) BETWEEN 20 AND 2000
      AND work_mode IS NOT NULL
      AND qualification_route IS NOT NULL
      AND recommended_offer IS NOT NULL
      AND qualification_score BETWEEN 0 AND 9
    )
    OR
    (
      form_version IS NULL
      AND trim(profil) <> ''
      AND trim(success_30_days) <> ''
      AND trim(why_now) <> ''
      AND trim(availability) <> ''
      AND cardinality(objectives) > 0
      AND cardinality(help_topics) > 0
      AND (
        (tiktok_username IS NOT NULL AND trim(tiktok_username) <> '')
        OR (instagram_username IS NOT NULL AND trim(instagram_username) <> '')
        OR (youtube_url IS NOT NULL AND trim(youtube_url) <> '')
        OR (facebook_url IS NOT NULL AND trim(facebook_url) <> '')
        OR (other_social_url IS NOT NULL AND trim(other_social_url) <> '')
      )
    )
  )
);
