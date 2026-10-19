-- Reprise des résultats et vidéos de témoignages, jusqu'ici écrits dans le code
-- (src/data/clientResults.ts, src/data/videoTestimonials.ts, listes de vidéos des pages),
-- dans les fiches de l'admin (trusted_clients). Ajout de Gautier et Hugo (octobre 2026).
--
-- À exécuter une fois après la reprise des données (docs/BASCULE.md) ; sans effet
-- si on le rejoue : les fiches existantes sont mises à jour par nom, les autres créées.

BEGIN;

CREATE TEMP TABLE temoignages_code (
  name text, match_name text, avatar_url text, niche text, metric text, result text, result_detail text,
  youtube_id text, video_caption text, offers text[], display_order int, featured boolean, anonymous boolean
) ON COMMIT DROP;

INSERT INTO temoignages_code VALUES
  -- Résultats documentés ; ordre choisi par Fred : PlotBreaker, Lune de Lu, Gautier en tête.
  ('PlotBreaker', 'PlotBreaker', '/plotbreaker.jpg', 'Analyse films & séries', '+3 000', 'abonnés supplémentaires',
    'cap des 10 000 abonnés franchi', 'XMMmmLLKue4', '+3 000 abonnés, cap des 10 000 franchi', '{academy}', 1, true, false),
  ('Antoine au Vietnam', 'Antoine Au Vietnam', NULL, 'Expatriation · Vietnam', '1,3 M', 'de vues sur sa meilleure vidéo',
    NULL, 'p3nCwuBZRGI', 'Vidéos jusqu''à 1,3 M de vues', '{one_shot}', 4, false, false),
  ('Lucille', 'Lucille', NULL, 'Films d''horreur', '×16', 'de 180 à 3 000+ abonnés',
    'en 2 mois, sur une niche pointue', 'Hgkn3ifjSS0', 'De 180 à 3 000+ abonnés en 2 mois', '{premium}', 2, true, false),
  ('David', 'David Agaesse', NULL, 'Élevage canin · épagneul breton', '×4', 'abonnés qualifiés en 1 mois',
    'portée ×2, surtout sur Facebook', 'LOi7RTx12nE', 'Abonnés qualifiés ×4 en 1 mois', '{premium}', 5, true, false),
  ('Le Sapac', 'Le Sapac', NULL, 'Streaming · jeux vidéo (WoW)', '10–20k', 'vues régulières par vidéo',
    '+ des revenus Twitch en hausse', 'wu2CPcqp-yU', 'Vidéos régulières à 10–20 k vues', '{premium}', 6, false, false),
  ('Alex Brosse', 'Alex Brosse', NULL, NULL, '×3', 'abonnés triplés', NULL, NULL, NULL, '{one_shot}', 7, false, false),
  -- Nouveaux témoignages vidéo (chiffres des comptes rendus Granola de juin 2026).
  ('Gautier', 'Gautier', NULL, 'Mythologie & histoire · Au nom des dieux', '1 M', 'de vues Instagram en 4 semaines',
    'Facebook : +7 000 abonnés · couverture +76 %', 'OmWZtVReYpc',
    '1 M de vues Instagram en 4 semaines', '{one_shot}', 3, false, false),
  ('Hugo', 'Hugo', NULL, 'Rap · concept « Uber Rap »', '8 %', 'd''engagement sur son nouveau compte rap',
    '≈ 1 000 vues par vidéo', 'JmQDLrvGz1M', 'Nouveau compte rap : 8 % d''engagement', '{one_shot}', 30, false, false),
  -- Vidéos de personnes non nommées dans le code : pas de légende.
  ('Témoignage vidéo Bzw7nwqB2rQ', 'Témoignage vidéo Bzw7nwqB2rQ', NULL, NULL, NULL, NULL, NULL, 'Bzw7nwqB2rQ', NULL, '{}', 20, false, true),
  ('Témoignage vidéo Jh5yrsotoHM', 'Témoignage vidéo Jh5yrsotoHM', NULL, NULL, NULL, NULL, NULL, 'Jh5yrsotoHM', NULL, '{}', 21, false, true),
  ('Témoignage vidéo g9QYqO-xiqw', 'Témoignage vidéo g9QYqO-xiqw', NULL, NULL, NULL, NULL, NULL, 'g9QYqO-xiqw', NULL, '{premium}', 22, false, true),
  ('Témoignage vidéo cc1cRfCEJGE', 'Témoignage vidéo cc1cRfCEJGE', NULL, NULL, NULL, NULL, NULL, 'cc1cRfCEJGE', NULL, '{}', 23, false, true),
  ('Témoignage vidéo hwTyjA6BORY', 'Témoignage vidéo hwTyjA6BORY', NULL, NULL, NULL, NULL, NULL, 'hwTyjA6BORY', NULL, '{}', 24, false, true),
  ('Témoignage vidéo FrMFqiAqAkU', 'Témoignage vidéo FrMFqiAqAkU', NULL, NULL, NULL, NULL, NULL, 'FrMFqiAqAkU', NULL, '{}', 25, false, true),
  ('Témoignage vidéo s-VaJvfFqbM', 'Témoignage vidéo s-VaJvfFqbM', NULL, NULL, NULL, NULL, NULL, 's-VaJvfFqbM', NULL, '{}', 26, false, true);

-- Fiches existantes : on complète sans écraser la photo ni le lien TikTok déjà saisis.
UPDATE public.trusted_clients t SET
  niche = c.niche, metric = c.metric, result = c.result, result_detail = c.result_detail,
  youtube_id = c.youtube_id, video_caption = c.video_caption, featured = c.featured,
  anonymous = c.anonymous, display_order = c.display_order,
  avatar_url = coalesce(t.avatar_url, c.avatar_url), updated_at = now()
FROM temoignages_code c
WHERE lower(t.name) = lower(c.match_name);

INSERT INTO public.trusted_clients (name, avatar_url, niche, metric, result, result_detail, youtube_id, video_caption,
  offers, display_order, featured, anonymous, is_active)
SELECT c.name, c.avatar_url, c.niche, c.metric, c.result, c.result_detail, c.youtube_id, c.video_caption,
  c.offers, c.display_order, c.featured, c.anonymous, true
FROM temoignages_code c
WHERE NOT EXISTS (SELECT 1 FROM public.trusted_clients t WHERE lower(t.name) = lower(c.match_name));

COMMIT;
