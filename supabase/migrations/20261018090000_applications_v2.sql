-- Formulaire de demande unique (/candidature).
--
-- Une demande porte sur le One Shot, la Wav Academy, le Wav Premium, ou une
-- simple demande de conseil pour choisir. Fred répond personnellement : plus de
-- lien d'agenda automatique. Les textes reprennent la gamme 2026-10
-- (src/config/offers.ts) ; ils seront alimentés par le catalogue versionné.

ALTER TABLE public.commerce_applications DROP CONSTRAINT commerce_applications_offer_check;
ALTER TABLE public.commerce_applications ADD CONSTRAINT commerce_applications_offer_check
  CHECK (offer = ANY (ARRAY['one_shot'::text, 'academy'::text, 'premium'::text, 'conseil'::text]));

CREATE OR REPLACE FUNCTION public.commerce_submit_application(v jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE existing commerce_applications; result_id uuid; offer_name text;
BEGIN
  -- Serialize duplicate/rate-limit checks, including simultaneous tabs and retries.
  PERFORM pg_advisory_xact_lock(hashtextextended(v->>'fingerprint',0));
  PERFORM pg_advisory_xact_lock(hashtextextended(v->>'email',1));
  SELECT * INTO existing FROM commerce_applications WHERE request_id=(v->>'request_id')::uuid;
  IF FOUND THEN
    IF existing.email<>v->>'email' OR existing.fingerprint<>v->>'fingerprint' OR existing.offer<>v->>'offer' THEN RAISE EXCEPTION 'Référence déjà utilisée'; END IF;
    RETURN existing.id;
  END IF;
  IF (SELECT count(*) FROM commerce_applications WHERE email=v->>'email' AND created_at>now()-interval '1 hour')>=5
    OR (SELECT count(*) FROM commerce_applications WHERE fingerprint=v->>'fingerprint' AND created_at>now()-interval '1 hour')>=10 THEN
    RAISE EXCEPTION 'Trop de demandes, réessayer dans une heure';
  END IF;
  INSERT INTO commerce_applications(request_id,offer,first_name,email,account_or_project,objective,timing,commitments,fingerprint)
    VALUES((v->>'request_id')::uuid,v->>'offer',v->>'first_name',v->>'email',v->>'account_or_project',v->>'objective',v->>'timing',v->'commitments',v->>'fingerprint') RETURNING id INTO result_id;
  offer_name := CASE v->>'offer'
    WHEN 'one_shot' THEN 'One Shot'
    WHEN 'academy' THEN 'Wav Academy'
    WHEN 'premium' THEN 'Wav Premium'
    ELSE 'Demande de conseil' END;
  INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
    ('application:'||result_id||':owner','contact@fredwav.com',
     'Nouvelle demande '||offer_name||' · '||(v->>'first_name'),
     (v->>'first_name')||' · '||(v->>'email')||E'\n'||(v->>'account_or_project')||E'\n'||(v->>'objective')||E'\nDémarrage souhaité : '||coalesce(nullif(v->>'timing',''),'non précisé')),
    ('application:'||result_id||':client',v->>'email','Ta demande est bien enregistrée',
     'Bonjour '||(v->>'first_name')||E',\n\n'||
     CASE v->>'offer'
       WHEN 'one_shot' THEN 'Ta demande de One Shot (audit de ton compte et 1 h 30 avec Fred, 399 € TTC) est enregistrée. Fred te répond personnellement sous deux jours ouvrés pour fixer la date du rendez-vous.'
       WHEN 'academy' THEN 'Ta demande pour la Wav Academy (accompagnement collectif à vie, 749 € TTC, prix de lancement jusqu''au 31/12/2026) est enregistrée. Fred te répond sous deux jours ouvrés pour confirmer ta place et ton inscription.'
       WHEN 'premium' THEN 'Ta demande de Wav Premium (accompagnement individuel, dès 1 499 € TTC pour six semaines) est enregistrée. Fred l''étudie personnellement et te répond sous deux jours ouvrés avec une proposition.'
       ELSE 'Ta demande est enregistrée. Fred la lit personnellement et te répond sous deux jours ouvrés pour t''orienter vers la formule adaptée.'
     END||E'\n\nAucun paiement n''est demandé à cette étape.\n\nFred Wav');
  RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION public.commerce_submit_application(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_submit_application(jsonb) TO service_role;
