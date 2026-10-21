-- Témoignages du 21/10/2026 (accord de chaque client, demandé par Fred en amont).
--
-- 1. Captures de messages WhatsApp refaites (les anciennes ont disparu avec le stockage
--    Lovable) : fichiers dans client-screenshots/2026-10/.
-- 2. Nouvelles fiches résultats, chiffres tirés des comptes rendus Granola et des messages
--    clients (livrables/temoignages-candidats.md, hors dépôt).
--
-- Rejouable : les captures sont rattachées par nom ou par fichier, les fiches par nom.

BEGIN;

-- 1. Captures --------------------------------------------------------------------------
CREATE TEMP TABLE captures (client_name text, file text, offer text[]) ON COMMIT DROP;
INSERT INTO captures VALUES
  ('Bidjad', 'bidjad.jpg', '{premium}'),
  ('Brouteur Hunter', 'brouteur-hunter.jpg', '{one_shot}'),
  ('Alex Brosse', 'alex-brosse.jpg', '{one_shot}'),
  ('Corinne Fountis', 'corinne-fountis.jpg', '{one_shot}'),
  ('Florence', 'florence-2.jpg', '{}'),
  ('Florence', 'florence-1.jpg', '{}');

-- Fiches existantes (une par client) : nouvelle image, de nouveau affichée.
UPDATE public.client_screenshots s SET
  image_url = 'https://ykcjzdqpvffdzlxxtjqc.supabase.co/storage/v1/object/public/client-screenshots/2026-10/' || c.file,
  is_active = true
FROM captures c
WHERE s.client_name = c.client_name AND c.client_name <> 'Florence'
  AND s.image_url NOT LIKE '%/client-screenshots/2026-10/%';

INSERT INTO public.client_screenshots (image_url, client_name, offer, display_locations, display_order, is_active)
SELECT 'https://ykcjzdqpvffdzlxxtjqc.supabase.co/storage/v1/object/public/client-screenshots/2026-10/' || c.file,
  c.client_name, c.offer, '{preuves,offres,diagnostic_result}', 0, true
FROM captures c
WHERE NOT EXISTS (SELECT 1 FROM public.client_screenshots s
  WHERE s.image_url LIKE '%/client-screenshots/2026-10/' || c.file);

-- 2. Fiches résultats -------------------------------------------------------------------
CREATE TEMP TABLE resultats (
  name text, niche text, metric text, result text, result_detail text, offers text[], display_order int
) ON COMMIT DROP;
INSERT INTO resultats VALUES
  ('Bidjad', NULL, '700 → 4 000', 'vues en moyenne par vidéo', '19 % d''engagement', '{premium}', 8),
  ('Maxime', 'IA & automatisation', '×2', 'abonnés Instagram en un mois (600 → 1 223)',
    'Facebook : 54 → 1 000 abonnés · 160 000 vues Instagram en un mois', '{premium}', 9),
  ('Créateur survivalisme', 'Survivalisme · 31k abonnés', '+10 000', 'abonnés et premiers revenus TikTok',
    'RPM × 4, record à 11 € · 9 séances', '{premium}', 10),
  ('Sophie', 'Miss Stinguette', '+6 000', 'abonnés en un mois et demi',
    'première collaboration rémunérée : 250 €', '{academy}', 11),
  ('Vanessa', 'Jox Art', '500k', 'vues sur une vidéo ASMR', '+800 abonnés', '{academy}', 12),
  ('David (quiz cinéma)', 'Cinéma · quiz Instagram', '+2 000', 'abonnés en une semaine',
    'cap des 10 000 franchi · de 5 à 50 réponses par story', '{academy}', 13),
  ('Florence', 'Voyage', '10 000+', 'vues sur sa vidéo avis Amsterdam', '+30 abonnés Instagram', '{}', 14),
  ('Eddy Maniez', NULL, '34 000', 'vues sur une vidéo', '3 ventes et contacts qualifiés', '{}', 15),
  ('Célia', 'Audacieuse Nature', '27 000', 'vues avec 377 abonnés', '316 enregistrements, 120 partages', '{}', 16),
  ('Bob', NULL, '350k', 'vues sur une vidéo en deux jours', NULL, '{}', 17),
  ('Élodie', 'Yoga', '177 000', 'vues sur une vidéo', '2 000 likes', '{}', 18),
  ('Sébastien', NULL, '1 M', 'de vues sur une série de vidéos', NULL, '{}', 19),
  ('Guigui & Jojo', 'Rock & metal français · live sessions', '4 962', 'abonnés TikTok et 57K j''aime',
    'meilleure vidéo à 185 600 vues · YouTube : de 100 à 3 670 abonnés', '{}', 27),
  ('Alex (Le Zinzin)', NULL, '×4', 'vues par vidéo (1 500 → 6 000)', 'lancé sur quatre réseaux', '{}', 28),
  ('Bernard', 'Le Prévoyant', '10k', 'vues organiques avec 131 abonnés', NULL, '{}', 29),
  ('Expatrié en Thaïlande', 'Expatriation · Thaïlande', '40 000', 'vues en moins de 24 h, à 100 abonnés',
    'compte reparti de zéro', '{}', 31),
  ('Clara', 'Freelance', '1re vente', 'après le repositionnement de son message', 'conclue en message privé', '{}', 32),
  ('Brouteur Hunter', NULL, '1,5 M', 'de vues sur une vidéo', 'un premier post au-delà du million de vues', '{one_shot}', 7);

-- Guillaume = le duo Guigui & Jojo (précision de Fred, 21/10).
UPDATE public.trusted_clients SET name = 'Guigui & Jojo', tiktok_url = 'https://www.tiktok.com/@guiguiandjojo',
  avatar_url = 'https://ykcjzdqpvffdzlxxtjqc.supabase.co/storage/v1/object/public/trusted-avatars/guigui-and-jojo.jpg'
WHERE name IN ('Guillaume', 'Guigui & Jojo');

UPDATE public.trusted_clients t SET
  niche = coalesce(r.niche, t.niche), metric = r.metric, result = r.result, result_detail = r.result_detail,
  offers = CASE WHEN cardinality(t.offers) > 0 THEN t.offers ELSE r.offers END, updated_at = now()
FROM resultats r
WHERE lower(t.name) = lower(r.name);

INSERT INTO public.trusted_clients (name, niche, metric, result, result_detail, offers, display_order, featured, anonymous, is_active)
SELECT r.name, r.niche, r.metric, r.result, r.result_detail, r.offers, r.display_order, false, false, true
FROM resultats r
WHERE NOT EXISTS (SELECT 1 FROM public.trusted_clients t WHERE lower(t.name) = lower(r.name));

-- 3. Avis Discord (salon « vos-avis » de l'ancien serveur Wav Academy), captures sans les dates.
UPDATE public.client_screenshots s SET
  image_url = 'https://ykcjzdqpvffdzlxxtjqc.supabase.co/storage/v1/object/public/client-screenshots/2026-10/discord-' || d.file,
  is_active = true
FROM (VALUES ('Estelle', 'estelle.png'), ('Delphine', 'delphine.png'), ('Alex', 'alex.png'), ('Betty', 'betty.png')) AS d(client_name, file)
WHERE s.client_name = d.client_name;

-- 4. Captures affichées aussi sur la page de leur offre (OfferPage : display_locations contient l'offre).
-- Les avis Discord sont ceux de membres de la Wav Academy.
UPDATE public.client_screenshots SET offer = '{academy}'
WHERE client_name IN ('Estelle', 'Delphine', 'Alex', 'Betty') AND image_url LIKE '%/2026-10/discord-%';
UPDATE public.client_screenshots s SET display_locations = s.display_locations || o.offre
FROM (SELECT id, unnest(offer) AS offre FROM public.client_screenshots) o
WHERE o.id = s.id AND s.is_active AND o.offre IN ('one_shot', 'academy', 'premium')
  AND NOT o.offre = ANY (s.display_locations);

COMMIT;
