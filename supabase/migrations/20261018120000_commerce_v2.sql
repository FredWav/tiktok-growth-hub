-- Commerce v2 : gamme 2026-10 (One Shot, Wav Academy à vie, Wav Premium).
--
-- 1. Catalogue des accompagnements en base (prix, lancement, capacité mensuelle).
--    Les montants encaissés sont calculés ici, jamais envoyés par le navigateur.
--    Doit rester aligné avec src/config/offers.ts (vérifié par tests/commerce-v2).
-- 2. Places par mois de démarrage : réservation atomique (verrou par offre et par
--    mois), avec échéance. Une demande seule ne consomme aucune place.
-- 3. Commandes : montant et durée libres, Academy sans date de fin, One Shot.
--    Les commandes historiques (offer_version 2026-09-*) gardent leurs dates.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE public.commerce_offers (
  id text PRIMARY KEY CHECK (id IN ('one_shot','academy','premium')),
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  -- Dernier jour (heure de Paris) du prix de lancement, puis next_price_cents.
  launch_until date,
  next_price_cents integer CHECK (next_price_cents > 0),
  monthly_capacity integer NOT NULL CHECK (monthly_capacity >= 0),
  -- Durée par défaut en semaines (Premium). NULL : rendez-vous unique ou accès à vie.
  default_weeks integer CHECK (default_weeks > 0),
  purchase text NOT NULL CHECK (purchase IN ('direct','request')),
  version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((launch_until IS NULL) = (next_price_cents IS NULL))
);
INSERT INTO public.commerce_offers(id,name,price_cents,launch_until,next_price_cents,monthly_capacity,default_weeks,purchase,version) VALUES
  ('one_shot','One Shot',39900,NULL,NULL,10,NULL,'request','2026-10'),
  ('academy','Wav Academy',74900,'2026-12-31',99000,5,NULL,'direct','2026-10'),
  ('premium','Wav Premium',149900,NULL,NULL,2,6,'request','2026-10');

-- Capacité d'un mois précis, quand Fred s'écarte de la capacité par défaut.
CREATE TABLE public.commerce_capacity (
  offer text NOT NULL REFERENCES public.commerce_offers(id),
  month date NOT NULL CHECK (extract(day FROM month) = 1),
  capacity integer NOT NULL CHECK (capacity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (offer, month)
);

ALTER TABLE public.commerce_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.commerce_offers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));
CREATE POLICY admin_read ON public.commerce_capacity FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------
ALTER TABLE public.commerce_orders
  DROP CONSTRAINT commerce_orders_amount_cents_check,
  DROP CONSTRAINT commerce_orders_check,
  DROP CONSTRAINT commerce_orders_offer_check;
ALTER TABLE public.commerce_orders
  ADD CONSTRAINT commerce_orders_offer_check CHECK (offer = ANY (ARRAY['one_shot'::text, 'academy'::text, 'premium'::text])),
  ADD CONSTRAINT commerce_orders_amount_cents_check CHECK (amount_cents > 0 AND amount_cents <= 2000000);
ALTER TABLE public.commerce_orders ALTER COLUMN ends_at DROP NOT NULL;
ALTER TABLE public.commerce_orders ALTER COLUMN offer_version SET DEFAULT '2026-10';
ALTER TABLE public.commerce_orders
  -- Durée du Premium (6, 12 ou 18 semaines sur devis).
  ADD COLUMN duration_weeks integer CHECK (duration_weeks > 0 AND duration_weeks <= 104),
  -- Échéance de la place réservée tant que le paiement n'est pas arrivé.
  ADD COLUMN hold_until timestamptz,
  -- Dernière session Stripe ouverte pour cette commande.
  ADD COLUMN checkout_session_id text,
  -- proposal : proposée par Fred après une demande ; direct : achat en ligne (Academy).
  ADD COLUMN source text NOT NULL DEFAULT 'proposal' CHECK (source IN ('proposal','direct')),
  -- Plus rien à faire automatiquement (accès à vie ouvert, terme atteint, annulation traitée).
  ADD COLUMN automation_done boolean NOT NULL DEFAULT false;
CREATE INDEX commerce_orders_month ON public.commerce_orders (offer, start_date);

CREATE OR REPLACE FUNCTION public.commerce_dates() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Les dates ne sont recalculées qu'à la création ou quand la date convenue change :
  -- une mise à jour technique ne doit jamais transformer un ancien droit.
  IF TG_OP='UPDATE' AND NEW.start_date IS NOT DISTINCT FROM OLD.start_date
     AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.duration_weeks IS NOT DISTINCT FROM OLD.duration_weeks THEN
    RETURN NEW;
  END IF;
  IF NEW.offer='academy' THEN NEW.start_time := '00:00'; END IF;
  IF NEW.offer='premium' AND NEW.offer_version NOT LIKE '2026-09%' THEN
    NEW.duration_weeks := coalesce(NEW.duration_weeks, 6);
  END IF;
  NEW.starts_at := (NEW.start_date + NEW.start_time) AT TIME ZONE 'Europe/Paris';
  NEW.ends_at := CASE
    -- Gamme 2026-09 : Academy six mois, Premium trente jours.
    WHEN NEW.offer_version LIKE '2026-09%' THEN
      ((NEW.start_date + NEW.start_time) + CASE WHEN NEW.offer='academy' THEN interval '6 months' ELSE interval '30 days' END) AT TIME ZONE 'Europe/Paris'
    -- Gamme 2026-10 : Academy à vie (tant qu'elle existe).
    WHEN NEW.offer='academy' THEN NULL
    WHEN NEW.offer='one_shot' THEN ((NEW.start_date + NEW.start_time) + interval '1 day') AT TIME ZONE 'Europe/Paris'
    ELSE ((NEW.start_date + NEW.start_time) + make_interval(weeks => NEW.duration_weeks)) AT TIME ZONE 'Europe/Paris'
  END;
  IF TG_OP='UPDATE' THEN
    IF OLD.status IN ('active','expired','cancelled') THEN RAISE EXCEPTION 'Accès déjà commencé ou terminé'; END IF;
    NEW.consent_at := NULL; NEW.consent := NULL; NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- Prix et places
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.commerce_current_price(p_offer text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE WHEN launch_until IS NOT NULL AND (now() AT TIME ZONE 'Europe/Paris')::date > launch_until
    THEN next_price_cents ELSE price_cents END
  FROM commerce_offers WHERE id=p_offer;
$$;

CREATE FUNCTION public.commerce_month_capacity(p_offer text, p_month date) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(
    (SELECT capacity FROM commerce_capacity WHERE offer=p_offer AND month=p_month),
    (SELECT monthly_capacity FROM commerce_offers WHERE id=p_offer), 0);
$$;

-- Places prises : commandes réglées (même en partie), ou réservées et pas encore échues.
-- Un remboursement (cancelled) libère la place.
CREATE FUNCTION public.commerce_month_taken(p_offer text, p_month date, p_except uuid DEFAULT NULL) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT count(*)::int FROM commerce_orders
  WHERE offer=p_offer AND start_date >= p_month AND start_date < (p_month + interval '1 month')::date
    AND (p_except IS NULL OR id<>p_except)
    AND status<>'cancelled'
    AND (paid_at IS NOT NULL OR amount_received>0 OR (status='pending' AND hold_until>now()));
$$;

CREATE FUNCTION public.commerce_lock_month(p_offer text, p_month date) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT pg_advisory_xact_lock(hashtextextended('commerce-capacity:'||p_offer||':'||p_month::text,0));
$$;

-- Places du mois en cours et des deux suivants, pour le site (aucune donnée personnelle).
CREATE FUNCTION public.commerce_places() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_object_agg(f.id, jsonb_build_object(
    'price_cents', commerce_current_price(f.id),
    'months', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', g.m::text,
        'capacity', commerce_month_capacity(f.id, g.m),
        'remaining', greatest(0, commerce_month_capacity(f.id, g.m) - commerce_month_taken(f.id, g.m))
      ) ORDER BY g.m)
      FROM (SELECT (date_trunc('month', now() AT TIME ZONE 'Europe/Paris') + make_interval(months => i))::date AS m
            FROM generate_series(0, 2) i) g
    )))
  FROM commerce_offers f;
$$;

-- Réserve (ou prolonge) la place d'une commande jusqu'à p_until. Échoue si le mois est
-- complet et que la commande ne tenait pas déjà une place.
CREATE FUNCTION public.commerce_hold(p_order uuid, p_until timestamptz) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders; m date;
BEGIN
  SELECT * INTO o FROM commerce_orders WHERE id=p_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande inconnue'; END IF;
  m := date_trunc('month', o.start_date)::date;
  PERFORM commerce_lock_month(o.offer, m);
  SELECT * INTO o FROM commerce_orders WHERE id=p_order FOR UPDATE;
  IF o.status NOT IN ('pending','scheduled') OR date_trunc('month', o.start_date)::date<>m THEN
    RAISE EXCEPTION 'Commande modifiée ou close, actualiser la page';
  END IF;
  IF o.paid_at IS NULL AND o.amount_received=0 AND (o.hold_until IS NULL OR o.hold_until<=now())
     AND commerce_month_taken(o.offer, m, o.id) >= commerce_month_capacity(o.offer, m) THEN
    RAISE EXCEPTION 'Plus de place disponible pour ce mois' USING HINT='capacity_full';
  END IF;
  UPDATE commerce_orders SET hold_until=greatest(coalesce(hold_until, now()), p_until)
    WHERE id=o.id RETURNING hold_until INTO o.hold_until;
  RETURN o.hold_until;
END $$;

-- Proposition de Fred après une demande (One Shot, Premium, ou Academy hors ligne).
-- Montant et durée libres ; la place est réservée jusqu'à l'échéance choisie.
CREATE FUNCTION public.commerce_create_order(v jsonb) RETURNS public.commerce_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders; f commerce_offers; m date; hold timestamptz := (v->>'hold_until')::timestamptz;
BEGIN
  SELECT * INTO f FROM commerce_offers WHERE id=v->>'offer';
  IF NOT FOUND THEN RAISE EXCEPTION 'Offre invalide'; END IF;
  IF hold IS NULL OR hold<=now() THEN RAISE EXCEPTION 'Échéance de réservation invalide'; END IF;
  m := date_trunc('month', (v->>'start_date')::date)::date;
  PERFORM commerce_lock_month(f.id, m);
  IF commerce_month_taken(f.id, m) >= commerce_month_capacity(f.id, m) THEN
    RAISE EXCEPTION 'Mois complet pour cette offre : choisir un autre mois ou augmenter la capacité' USING HINT='capacity_full';
  END IF;
  INSERT INTO commerce_orders(offer,offer_version,first_name,email,start_date,start_time,amount_cents,duration_weeks,invoice_reference,application_id,hold_until,source)
  VALUES (f.id, f.version, v->>'first_name', v->>'email', (v->>'start_date')::date,
    coalesce(nullif(v->>'start_time','')::time, '00:00'),
    coalesce(nullif(v->>'amount_cents','')::int, commerce_current_price(f.id)),
    CASE WHEN f.id='premium' THEN coalesce(nullif(v->>'duration_weeks','')::int, f.default_weeks) END,
    nullif(v->>'invoice_reference',''), nullif(v->>'application_id','')::uuid, hold, 'proposal')
  RETURNING * INTO o;
  INSERT INTO commerce_audit(order_id,actor,action,details)
    VALUES (o.id,nullif(v->>'actor','')::uuid,'created',jsonb_build_object('hold_until',hold,'amount_cents',o.amount_cents));
  RETURN o;
END $$;

-- Nouvelle date : la place est vérifiée sur le nouveau mois.
CREATE FUNCTION public.commerce_reschedule(p_order uuid, p_start date, p_time time, p_actor uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders; m date := date_trunc('month', p_start)::date;
BEGIN
  SELECT * INTO o FROM commerce_orders WHERE id=p_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande inconnue'; END IF;
  PERFORM commerce_lock_month(o.offer, m);
  SELECT * INTO o FROM commerce_orders WHERE id=p_order FOR UPDATE;
  IF o.status NOT IN ('pending','scheduled','needs_reschedule') OR o.lock_until>now() THEN
    RAISE EXCEPTION 'Replanification impossible';
  END IF;
  IF date_trunc('month', o.start_date)::date<>m
     AND commerce_month_taken(o.offer, m, o.id) >= commerce_month_capacity(o.offer, m) THEN
    RAISE EXCEPTION 'Mois complet pour cette offre' USING HINT='capacity_full';
  END IF;
  UPDATE commerce_orders SET start_date=p_start, start_time=coalesce(p_time, start_time),
    hold_until=CASE WHEN amount_received=0 THEN greatest(coalesce(hold_until, now()), now()+interval '3 days') ELSE hold_until END
    WHERE id=o.id;
  INSERT INTO commerce_audit(order_id,actor,action,details)
    VALUES (o.id,p_actor,'rescheduled',jsonb_build_object('start_date',p_start,'start_time',p_time));
END $$;

-- Achat direct de la Wav Academy : premier mois avec une place libre parmi les trois
-- prochains, place réservée 35 minutes (la session Stripe expire au bout de 30).
CREATE FUNCTION public.commerce_academy_start(v jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o commerce_orders; f commerce_offers; today date := (now() AT TIME ZONE 'Europe/Paris')::date;
  m date; start date; i int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(v->>'email',2));
  IF (SELECT count(*) FROM commerce_orders WHERE email=v->>'email' AND source='direct' AND created_at>now()-interval '1 hour')>=5
    OR (SELECT count(*) FROM commerce_orders WHERE consent->>'fingerprint'=v->>'fingerprint' AND created_at>now()-interval '1 hour')>=10 THEN
    RAISE EXCEPTION 'Trop de tentatives, réessayer dans une heure';
  END IF;
  -- Double clic ou retour arrière : la réservation en cours est reprise.
  SELECT * INTO o FROM commerce_orders WHERE email=v->>'email' AND offer='academy' AND source='direct'
    AND status='pending' AND amount_received=0 AND hold_until>now()+interval '5 minutes'
    AND start_date=(v->>'expected_start')::date
    ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('id',o.id,'start_date',o.start_date,'amount_cents',o.amount_cents,'reused',true);
  END IF;
  SELECT * INTO f FROM commerce_offers WHERE id='academy';
  FOR i IN 0..2 LOOP
    m := (date_trunc('month', today) + make_interval(months => i))::date;
    PERFORM commerce_lock_month('academy', m);
    IF commerce_month_taken('academy', m) < commerce_month_capacity('academy', m) THEN
      start := CASE WHEN i=0 THEN today ELSE m END;
      IF start::text<>v->>'expected_start' THEN
        RAISE EXCEPTION 'La date de démarrage a changé, actualise la page' USING HINT='start_changed';
      END IF;
      IF start < today+14 AND coalesce((v->>'early')::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'Demande d''accès immédiat requise';
      END IF;
      INSERT INTO commerce_orders(offer,offer_version,first_name,email,start_date,amount_cents,hold_until,source,consent_at,consent)
        VALUES ('academy', f.version, v->>'first_name', v->>'email', start, commerce_current_price('academy'),
          now()+interval '35 minutes', 'direct', now(), v->'consent')
        RETURNING * INTO o;
      RETURN jsonb_build_object('id',o.id,'start_date',o.start_date,'amount_cents',o.amount_cents,'reused',false);
    END IF;
  END LOOP;
  RAISE EXCEPTION 'Wav Academy complète pour les trois prochains mois' USING HINT='capacity_full';
END $$;

-- Ancien élève : son accès Academy en cours devient à vie (action journalisée).
CREATE FUNCTION public.commerce_grant_lifetime(p_email text, p_actor uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
  UPDATE wavacademy_subscriptions SET access_expires_at=NULL, access_months=NULL
    WHERE lower(email)=lower(p_email) AND status='active' AND access_expires_at IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n=0 THEN RAISE EXCEPTION 'Aucun accès Academy en cours pour cette adresse'; END IF;
  INSERT INTO commerce_audit(actor,action,details) VALUES (p_actor,'academy_lifetime_granted',jsonb_build_object('email',lower(p_email),'subscriptions',n));
  RETURN n;
END $$;

-- ---------------------------------------------------------------------------
-- Encaissement et acceptation : règles de la nouvelle gamme
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commerce_record_payment(p_order uuid, p_method text, p_reference text, p_amount integer, p_received timestamp with time zone, p_actor uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
      -- Academy : l'accès s'ouvre dès le paiement si la date est passée.
      -- Rendez-vous (One Shot, Premium) : un paiement arrivé après la date impose d'en convenir d'une autre.
      WHEN offer<>'academy' AND ((p_received AT TIME ZONE 'Europe/Paris')::date > start_date OR p_received>starts_at) THEN 'needs_reschedule'
      WHEN offer_version LIKE '2026-09%' AND (p_received AT TIME ZONE 'Europe/Paris')::date > start_date THEN 'needs_reschedule'
      WHEN amount_received+p_amount=amount_cents AND consent_at IS NOT NULL THEN 'scheduled' ELSE status END,
    automation_done=CASE WHEN p_method='refund' THEN false ELSE automation_done END
    WHERE id=p_order;
  INSERT INTO commerce_audit(order_id,actor,action,details)
    VALUES(p_order,p_actor,p_method,jsonb_build_object('reference',p_reference,'amount_cents',p_amount));
END $$;

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
     ||'Offre : '||public.commerce_offer_label(o.offer)||E'\n'
     ||'Montant : '||public.commerce_format_euros(o.amount_cents)||E' TTC\n'
     ||CASE WHEN o.offer='academy'
       THEN 'Accès à partir du '||to_char(o.starts_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY')||E'\n'
         ||coalesce('Fin : '||to_char(o.ends_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY')||E'\n', E'Durée : à vie, tant que la Wav Academy existe\n')
       WHEN o.offer='one_shot'
       THEN 'Rendez-vous : '||to_char(o.starts_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY "à" HH24"h"MI')||E' (heure de Paris), 1 h 30\n'
       ELSE 'Premier rendez-vous : '||to_char(o.starts_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY "à" HH24"h"MI')||E' (heure de Paris)\n'
         ||'Fin : '||to_char(o.ends_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY')||coalesce(' ('||o.duration_weeks||' semaines)','')||E'\n'
     END
     ||E'\nCGV (version '||(p_consent->>'version')||E') : https://fredwav.com/cgv\n'
     ||(p_consent->>'cgv')||E'\n'||coalesce(p_consent->>'early','Démarrage après le délai légal de rétractation.')
     ||E'\n\nRéférence de commande : '||o.id)
    ON CONFLICT(dedupe_key) DO NOTHING;
END $$;

CREATE FUNCTION public.commerce_offer_label(p_offer text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT CASE p_offer WHEN 'one_shot' THEN 'One Shot' WHEN 'academy' THEN 'Wav Academy' WHEN 'premium' THEN 'Wav Premium' ELSE p_offer END;
$$;

CREATE OR REPLACE FUNCTION public.commerce_revenue() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object('total',coalesce(sum(r.amount_cents),0)/100.0,
    'one_shot',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='one_shot'),0)/100.0,
    'academy',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='academy'),0)/100.0,
    'premium',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='premium'),0)/100.0)
  FROM commerce_receipts r JOIN commerce_orders o ON o.id=r.order_id
  WHERE r.received_at >= date_trunc('month',now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
$$;

-- ---------------------------------------------------------------------------
-- Droits : seul commerce_places est public
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.commerce_current_price(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_month_capacity(text,date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_month_taken(text,date,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_lock_month(text,date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_hold(uuid,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_create_order(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_reschedule(uuid,date,time,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_academy_start(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_grant_lifetime(text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_record_payment(uuid,text,text,integer,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_accept(uuid,date,boolean,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_revenue() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_offer_label(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_current_price(text), public.commerce_month_capacity(text,date),
  public.commerce_month_taken(text,date,uuid), public.commerce_lock_month(text,date),
  public.commerce_hold(uuid,timestamptz), public.commerce_create_order(jsonb),
  public.commerce_reschedule(uuid,date,time,uuid), public.commerce_academy_start(jsonb),
  public.commerce_grant_lifetime(text,uuid), public.commerce_record_payment(uuid,text,text,integer,timestamptz,uuid),
  public.commerce_accept(uuid,date,boolean,jsonb), public.commerce_revenue(), public.commerce_offer_label(text)
  TO service_role;
REVOKE ALL ON FUNCTION public.commerce_places() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.commerce_places() TO anon, authenticated, service_role;
