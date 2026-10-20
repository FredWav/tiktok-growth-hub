-- Rétractation : toutes les prestations vendues peuvent être choisies.
-- One Shot et Analyse vidéo manquaient, et « Packs de hooks », proposé par le
-- formulaire, était refusé par la base.
ALTER TABLE public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_offer_check;
ALTER TABLE public.withdrawal_requests ADD CONSTRAINT withdrawal_requests_offer_check
  CHECK (offer = ANY (ARRAY['analyse_express'::text, 'analyse_video'::text, 'one_shot'::text,
    'wav_academy'::text, 'wav_premium'::text, 'hooks_packs'::text, 'other'::text]));
