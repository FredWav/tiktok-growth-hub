-- Backfill full_name for existing nameless prospects using their tiktok handle.
-- Targets only rows where full_name is null or empty AND tiktok is set.
UPDATE public.clients
SET full_name = '@' || tiktok
WHERE (full_name IS NULL OR trim(full_name) = '')
  AND tiktok IS NOT NULL
  AND trim(tiktok) <> '';

-- For the remaining nameless prospects (no tiktok either), use their email.
UPDATE public.clients
SET full_name = email
WHERE (full_name IS NULL OR trim(full_name) = '')
  AND email IS NOT NULL
  AND trim(email) <> '';
