-- Témoignages gérés depuis l'admin.
--
-- Une fiche par personne (table historique trusted_clients) : photo, niche,
-- résultat chiffré, vidéo YouTube et sa légende. Les résultats et vidéos, écrits
-- jusqu'ici dans le code, y sont repris (supabase/seed/temoignages-2026-10.sql).
-- Le site lit les fiches actives ; une copie est prise au build pour le référencement.

ALTER TABLE public.trusted_clients
  ADD COLUMN niche text,
  -- Accroche chiffrée (« ×16 », « 1,3 M ») et sa description ; la carte résultat
  -- ne s'affiche que si les deux sont remplies.
  ADD COLUMN metric text,
  ADD COLUMN result text,
  ADD COLUMN result_detail text,
  ADD COLUMN youtube_id text CHECK (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  ADD COLUMN video_caption text,
  -- Mise en avant sur l'accueil.
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  -- Vidéo d'une personne non nommée : aucune légende, pas de carte résultat.
  ADD COLUMN anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX trusted_clients_youtube_id ON public.trusted_clients (youtube_id) WHERE youtube_id IS NOT NULL;

COMMENT ON TABLE public.trusted_clients IS 'Témoignages : une fiche par personne (photo, résultat chiffré, vidéo), gérée dans l''admin.';
