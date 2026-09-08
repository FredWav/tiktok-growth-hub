-- New sales only. Historical subscriptions, consents and applications stay intact.
ALTER TABLE public.wavacademy_subscriptions ADD COLUMN IF NOT EXISTS access_starts_at timestamptz;

CREATE TABLE public.commerce_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  offer text NOT NULL CHECK (offer IN ('academy','premium')),
  first_name text NOT NULL,
  email text NOT NULL,
  account_or_project text NOT NULL,
  objective text NOT NULL,
  timing text NOT NULL DEFAULT '',
  commitments jsonb NOT NULL,
  fingerprint text NOT NULL,
  stage text NOT NULL DEFAULT 'received' CHECK (stage IN ('received','booked','closed','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX commerce_applications_rate ON public.commerce_applications(fingerprint, created_at);

CREATE TABLE public.commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  claim_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.commerce_applications(id),
  offer text NOT NULL CHECK (offer IN ('academy','premium')),
  offer_version text NOT NULL DEFAULT '2026-09-v3',
  invoice_reference text,
  email text NOT NULL,
  first_name text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents IN (74900,199000)),
  currency text NOT NULL DEFAULT 'eur' CHECK (currency = 'eur'),
  start_date date NOT NULL,
  start_time time NOT NULL DEFAULT '00:00',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  amount_received integer NOT NULL DEFAULT 0,
  paid_at timestamptz,
  consent_at timestamptz,
  consent jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','active','needs_reschedule','cancelled','expired')),
  subscription_id uuid UNIQUE REFERENCES public.wavacademy_subscriptions(id),
  wavstats_status text NOT NULL DEFAULT 'pending',
  discord_status text NOT NULL DEFAULT 'pending',
  wavstats_activation_url text,
  last_error text,
  lock_until timestamptz,
  last_processed_at timestamptz NOT NULL DEFAULT '1970-01-01',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((offer = 'academy' AND amount_cents = 74900) OR (offer = 'premium' AND amount_cents = 199000))
);

CREATE FUNCTION public.commerce_dates() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.offer='academy' THEN NEW.start_time := '00:00'; END IF;
  NEW.starts_at := (NEW.start_date + NEW.start_time) AT TIME ZONE 'Europe/Paris';
  NEW.ends_at := ((NEW.start_date + NEW.start_time) + CASE WHEN NEW.offer='academy' THEN interval '6 months'
    ELSE interval '30 days' END) AT TIME ZONE 'Europe/Paris';
  IF TG_OP='UPDATE' AND (NEW.start_date <> OLD.start_date OR NEW.start_time <> OLD.start_time) THEN
    IF OLD.status IN ('active','expired','cancelled') THEN RAISE EXCEPTION 'Accès déjà commencé ou terminé'; END IF;
    NEW.consent_at := NULL; NEW.consent := NULL; NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER commerce_order_dates BEFORE INSERT OR UPDATE ON public.commerce_orders
FOR EACH ROW EXECUTE FUNCTION public.commerce_dates();

CREATE TABLE public.commerce_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.commerce_orders(id),
  method text NOT NULL CHECK (method IN ('stripe','transfer','refund')),
  reference text NOT NULL UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents <> 0),
  received_at timestamptz NOT NULL,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wavacademy_subscriptions ADD COLUMN commerce_order_id uuid UNIQUE REFERENCES public.commerce_orders(id);
CREATE TABLE public.commerce_unmatched_payments (
  session_id text PRIMARY KEY,
  reason text NOT NULL,
  amount_cents integer,
  currency text,
  received_at timestamptz,
  email text,
  resolved_order_id uuid REFERENCES public.commerce_orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_mail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.commerce_orders(id),
  actor uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment mutations are serialized; retries reuse the same immutable receipt.
CREATE FUNCTION public.commerce_record_payment(p_order uuid,p_method text,p_reference text,p_amount integer,p_received timestamptz,p_actor uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders; existing commerce_receipts;
BEGIN
  SELECT * INTO o FROM commerce_orders WHERE id=p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande inconnue'; END IF;
  SELECT * INTO existing FROM commerce_receipts WHERE reference=p_reference;
  IF FOUND THEN
    IF existing.order_id<>p_order OR existing.amount_cents<>p_amount OR existing.method<>p_method THEN RAISE EXCEPTION 'Référence déjà utilisée'; END IF;
    RETURN;
  END IF;
  IF o.lock_until > now() THEN RAISE EXCEPTION 'Traitement en cours, réessayer'; END IF;
  IF p_received > now() OR length(trim(p_reference))<3 THEN RAISE EXCEPTION 'Encaissement invalide'; END IF;
  IF p_method='refund' THEN
    IF p_amount>=0 OR -p_amount>o.amount_received THEN RAISE EXCEPTION 'Remboursement invalide'; END IF;
  ELSIF p_amount<=0 OR o.amount_received+p_amount>o.amount_cents OR o.status IN ('cancelled','expired') THEN
    RAISE EXCEPTION 'Montant ou état incompatible';
  END IF;
  INSERT INTO commerce_receipts(order_id,method,reference,amount_cents,received_at,recorded_by)
    VALUES(p_order,p_method,p_reference,p_amount,p_received,p_actor);
  UPDATE commerce_orders SET amount_received=amount_received+p_amount,
    paid_at=CASE WHEN amount_received+p_amount=amount_cents THEN p_received ELSE paid_at END,
    status=CASE WHEN p_method='refund' THEN 'cancelled'
      WHEN (p_received AT TIME ZONE 'Europe/Paris')::date > start_date OR (offer='premium' AND p_received>starts_at) THEN 'needs_reschedule'
      WHEN amount_received+p_amount=amount_cents AND consent_at IS NOT NULL THEN 'scheduled' ELSE status END
    WHERE id=p_order;
  INSERT INTO commerce_audit(order_id,actor,action,details)
    VALUES(p_order,p_actor,p_method,jsonb_build_object('reference',p_reference,'amount_cents',p_amount));
END $$;
REVOKE ALL ON FUNCTION public.commerce_record_payment(uuid,text,text,integer,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_record_payment(uuid,text,text,integer,timestamptz,uuid) TO service_role;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['commerce_applications','commerce_orders','commerce_receipts','commerce_unmatched_payments','commerce_mail','commerce_audit'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role=''admin''))',t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
  END LOOP;
END $$;

ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS result_email_sent_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS support_requested_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS refund_reference text;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS report_version text NOT NULL DEFAULT 'legacy';
ALTER TABLE public.express_analyses ALTER COLUMN report_version SET DEFAULT 'sample-v3';

-- Result + notification enter the database in the same transaction.
CREATE FUNCTION public.express_notification_outbox() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='complete' AND OLD.status IS DISTINCT FROM 'complete' AND NEW.email IS NOT NULL THEN
    INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
      ('express-result:'||NEW.id,NEW.email,'Ton Analyse Express est prête',
       'Analyse automatisée de @'||NEW.tiktok_username||E'\nConsulte ton rapport : https://fredwav.com/analyse-express/result?session_id='||NEW.stripe_session_id)
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  IF NEW.support_requested_at IS NOT NULL AND OLD.support_requested_at IS NULL THEN
    INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
      ('express-support:'||NEW.id,'contact@fredwav.com','Analyse Express : intervention requise',
       'Dossier '||NEW.id||' · @'||NEW.tiktok_username||E'\nIntervention sous deux jours ouvrés. Si résolution impossible, effectuer le remboursement intégral puis en enregistrer la référence.')
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER express_notification_outbox AFTER UPDATE ON public.express_analyses
FOR EACH ROW EXECUTE FUNCTION public.express_notification_outbox();

CREATE FUNCTION public.commerce_submit_application(v jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
    ('application:'||result_id||':owner','contact@fredwav.com','Nouvelle demande '||(v->>'offer'),
     (v->>'first_name')||' · '||(v->>'email')||E'\n'||(v->>'account_or_project')||E'\n'||(v->>'objective')||E'\nDémarrage souhaité : '||(v->>'timing')),
    ('application:'||result_id||':client',v->>'email','Ta demande est enregistrée',
     CASE WHEN v->>'offer'='academy' THEN 'Wav Academy : 749 € TTC pour six mois. Choisis le créneau de ton appel commercial (sans diagnostic gratuit) : https://calendar.app.google/UZC5UY38shFuSqmy6'
     ELSE 'Wav Premium : 1 990 € TTC pour trente jours. Fred étudie personnellement ta candidature et répond sous deux jours ouvrés. Aucun paiement à cette étape.' END);
  RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION public.commerce_submit_application(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_submit_application(jsonb) TO service_role;

CREATE FUNCTION public.commerce_accept(p_token uuid,p_start date,p_early boolean,p_consent jsonb) RETURNS void
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
     'Wav '||o.offer||' · '||o.amount_cents/100.0||E' EUR TTC\nDébut (Paris) : '||(o.starts_at AT TIME ZONE 'Europe/Paris')||E'\nFin (Paris) : '||(o.ends_at AT TIME ZONE 'Europe/Paris')||E'\nCGV version '||(p_consent->>'version')||E' : https://fredwav.com/cgv\n'||(p_consent->>'cgv')||E'\n'||coalesce(p_consent->>'early','Démarrage après le délai légal.'))
    ON CONFLICT(dedupe_key) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.commerce_accept(uuid,date,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_accept(uuid,date,boolean,jsonb) TO service_role;

CREATE FUNCTION public.commerce_revenue() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('total',coalesce(sum(r.amount_cents),0)/100.0,
    'academy',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='academy'),0)/100.0,
    'premium',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='premium'),0)/100.0)
  FROM commerce_receipts r JOIN commerce_orders o ON o.id=r.order_id
  WHERE r.received_at >= date_trunc('month',now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
$$;
REVOKE ALL ON FUNCTION public.commerce_revenue() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_revenue() TO service_role;
