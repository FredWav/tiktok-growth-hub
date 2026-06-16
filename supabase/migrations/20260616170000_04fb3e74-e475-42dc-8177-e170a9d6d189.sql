-- Restrict storage listing on public buckets. Files remain served via getPublicUrl
-- (Storage CDN serves public buckets without policy checks), but anonymous clients
-- can no longer enumerate objects via the .list() API.

DROP POLICY IF EXISTS "Anyone can view trusted avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public objects readable by name (trusted-avatars)" ON storage.objects;
DROP POLICY IF EXISTS "Public objects readable by name (client-screenshots)" ON storage.objects;
