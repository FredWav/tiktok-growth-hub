ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS instagram_username text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS other_social_url text,
  ADD COLUMN IF NOT EXISTS objectives text[],
  ADD COLUMN IF NOT EXISTS success_30_days text,
  ADD COLUMN IF NOT EXISTS why_now text,
  ADD COLUMN IF NOT EXISTS help_topics text[],
  ADD COLUMN IF NOT EXISTS availability text;

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_instagram_username_not_empty
    CHECK (instagram_username IS NULL OR (trim(instagram_username) <> '' AND char_length(instagram_username) <= 100)),
  ADD CONSTRAINT check_youtube_url_not_empty
    CHECK (youtube_url IS NULL OR (trim(youtube_url) <> '' AND char_length(youtube_url) <= 500)),
  ADD CONSTRAINT check_facebook_url_not_empty
    CHECK (facebook_url IS NULL OR (trim(facebook_url) <> '' AND char_length(facebook_url) <= 500)),
  ADD CONSTRAINT check_other_social_url_not_empty
    CHECK (other_social_url IS NULL OR (trim(other_social_url) <> '' AND char_length(other_social_url) <= 500)),
  ADD CONSTRAINT check_objectives_not_empty
    CHECK (objectives IS NULL OR cardinality(objectives) BETWEEN 1 AND 9),
  ADD CONSTRAINT check_success_30_days_not_empty
    CHECK (success_30_days IS NULL OR (trim(success_30_days) <> '' AND char_length(success_30_days) <= 3000)),
  ADD CONSTRAINT check_why_now_not_empty
    CHECK (why_now IS NULL OR (trim(why_now) <> '' AND char_length(why_now) <= 3000)),
  ADD CONSTRAINT check_help_topics_not_empty
    CHECK (help_topics IS NULL OR cardinality(help_topics) BETWEEN 1 AND 9),
  ADD CONSTRAINT check_availability_not_empty
    CHECK (availability IS NULL OR (trim(availability) <> '' AND char_length(availability) <= 300));

DROP POLICY IF EXISTS "Anyone can insert applications" ON public.wav_premium_applications;
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
  AND trim(profil) <> ''
  AND trim(goals) <> ''
  AND trim(success_30_days) <> ''
  AND trim(why_now) <> ''
  AND trim(availability) <> ''
  AND budget = ANY (ARRAY[
    'total_no_budget',
    'total_15_a_100',
    'total_100_a_300',
    'total_300_a_900',
    'total_900_plus'
  ])
  AND cardinality(objectives) > 0
  AND cardinality(help_topics) > 0
  AND (
    (tiktok_username IS NOT NULL AND trim(tiktok_username) <> '')
    OR (instagram_username IS NOT NULL AND trim(instagram_username) <> '')
    OR (youtube_url IS NOT NULL AND trim(youtube_url) <> '')
    OR (facebook_url IS NOT NULL AND trim(facebook_url) <> '')
    OR (other_social_url IS NOT NULL AND trim(other_social_url) <> '')
  )
);