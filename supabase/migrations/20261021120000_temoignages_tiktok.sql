-- Témoignages vidéo publiés sur TikTok (en plus de YouTube) : identifiant numérique de la vidéo,
-- lu dans un lien https://www.tiktok.com/@compte/video/<identifiant>.
ALTER TABLE public.trusted_clients
  ADD COLUMN tiktok_video_id text CHECK (tiktok_video_id ~ '^[0-9]{15,22}$');
CREATE UNIQUE INDEX trusted_clients_tiktok_video_id ON public.trusted_clients (tiktok_video_id) WHERE tiktok_video_id IS NOT NULL;
