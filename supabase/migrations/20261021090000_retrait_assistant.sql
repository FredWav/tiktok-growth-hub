-- Assistant de l'admin retiré : les droits de son dossier d'images disparaissent.
-- Le dossier « observations » (vide) se supprime par l'API Storage, pas en SQL.
DROP POLICY IF EXISTS "Admins can upload observation images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all observation images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete observation images" ON storage.objects;
