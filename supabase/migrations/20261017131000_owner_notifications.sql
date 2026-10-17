-- Notifications internes et mail d'inscription.
--
-- Toutes les notifications internes partent vers contact@fredwav.com (OWNER_EMAIL
-- de supabase/functions/_shared/owner.ts). On reprend les définitions réelles de la
-- production en améliorant le libellé de l'offre, et on récupère le mail
-- d'inscription lisible de la migration du 16/09/2026, jamais appliquée en prod.
-- Les textes client (anciens prix) seront réécrits avec le catalogue v2.

CREATE OR REPLACE FUNCTION public.express_notification_outbox() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Le mail client de livraison est mis en file par sendExpressResultMail (version HTML).
  -- Ce trigger ne doit plus insérer la variante texte brut : elle gagnait le dedupe_key.
  IF NEW.support_requested_at IS NOT NULL AND OLD.support_requested_at IS NULL THEN
    INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
      ('express-support:'||NEW.id,'contact@fredwav.com','Analyse Express : intervention requise',
       'Dossier '||NEW.id||' · @'||NEW.tiktok_username||E'\nIntervention sous deux jours ouvrés. Si résolution impossible, effectuer le remboursement intégral puis en enregistrer la référence.')
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.express_notification_outbox() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.commerce_submit_application(v jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE existing commerce_applications; result_id uuid;
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
  INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
    ('application:'||result_id||':owner','contact@fredwav.com',
     'Nouvelle demande '||CASE WHEN v->>'offer'='academy' THEN 'Wav Academy' ELSE 'Wav Premium' END||' · '||(v->>'first_name'),
     (v->>'first_name')||' · '||(v->>'email')||E'\n'||(v->>'account_or_project')||E'\n'||(v->>'objective')||E'\nDémarrage souhaité : '||coalesce(nullif(v->>'timing',''),'non précisé')),
    ('application:'||result_id||':client',v->>'email','Ta demande est enregistrée',
     CASE WHEN v->>'offer'='academy' THEN 'Wav Academy : 749 € TTC pour six mois. Choisis le créneau de ton appel commercial (sans diagnostic gratuit) : https://calendar.app.google/UZC5UY38shFuSqmy6'
     ELSE 'Wav Premium : 1 990 € TTC pour trente jours. Fred étudie personnellement ta candidature et répond sous deux jours ouvrés. Aucun paiement à cette étape.' END);
  RETURN result_id;
END $$;

-- Mail de confirmation d'inscription lisible (montant, offre, dates) : repris de la
-- migration du 16/09/2026 jamais appliquée en production.

-- 74900 -> « 749 € », 119050 -> « 1 190,50 € ».
CREATE OR REPLACE FUNCTION public.commerce_format_euros(p_cents integer) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT replace(to_char(p_cents / 100, 'FM999G999G990'), ',', ' ')
    || CASE WHEN p_cents % 100 = 0 THEN '' ELSE ',' || lpad((p_cents % 100)::text, 2, '0') END
    || ' €';
$$;
REVOKE ALL ON FUNCTION public.commerce_format_euros(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_format_euros(integer) TO service_role;

REVOKE ALL ON FUNCTION public.commerce_submit_application(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_submit_application(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.commerce_accept(p_token uuid,p_start date,p_early boolean,p_consent jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders;
BEGIN
  SELECT * INTO o FROM commerce_orders WHERE token=p_token FOR UPDATE;
  IF NOT FOUND OR o.status IN ('needs_reschedule','cancelled','expired') OR o.start_date<>p_start OR o.lock_until>now() THEN RAISE EXCEPTION 'Modalités modifiées, actualiser la page'; END IF;
  IF p_consent ? 'starts_at' AND (p_consent->>'starts_at')::timestamptz<>o.starts_at THEN RAISE EXCEPTION 'Horaire modifié, actualiser la page'; END IF;
  IF o.consent_at IS NOT NULL THEN RETURN; END IF;
  IF o.starts_at < now()+interval '14 days' AND NOT p_early THEN RAISE EXCEPTION 'Démarrage anticipé à demander ou date à replanifier'; END IF;
  UPDATE commerce_orders SET consent_at=now(),consent=p_consent,
    status=CASE WHEN amount_received=amount_cents THEN 'scheduled' ELSE 'pending' END WHERE id=o.id;
  INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
    ('consent:'||o.id||':'||now(),o.email,'Confirmation des modalités de ton inscription',
     'Bonjour '||o.first_name||E',\n\nVoici le récapitulatif de ton inscription.\n\n'
     ||'Offre : '||CASE WHEN o.offer='academy' THEN 'Wav Academy' ELSE 'Wav Premium' END||E'\n'
     ||'Montant : '||public.commerce_format_euros(o.amount_cents)||E' TTC\n'
     ||'Début : '||to_char(o.starts_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY "à" HH24"h"MI')||E' (heure de Paris)\n'
     ||'Fin : '||to_char(o.ends_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY "à" HH24"h"MI')||E' (heure de Paris)\n\n'
     ||'CGV (version '||(p_consent->>'version')||E') : https://fredwav.com/cgv\n'
     ||(p_consent->>'cgv')||E'\n'||coalesce(p_consent->>'early','Démarrage après le délai légal de rétractation.')
     ||E'\n\nRéférence de commande : '||o.id)
    ON CONFLICT(dedupe_key) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.commerce_accept(uuid,date,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_accept(uuid,date,boolean,jsonb) TO service_role;
