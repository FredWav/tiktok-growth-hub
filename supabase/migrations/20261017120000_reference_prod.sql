-- Migration de référence : schéma réel de la production au 17/10/2026.
--
-- Générée par scripts/reference-from-dump.py depuis l'export Lovable Cloud
-- (pg_dump 18.6, base 17.6) : schéma public complet + règles d'accès du stockage,
-- sans aucune donnée. Elle remplace les 73 migrations Lovable/manuelles et le canal
-- Drizzle, qui ne décrivaient plus la production ; ils restent dans l'historique git.
-- Les évolutions v2 (catalogue, droits, nettoyage) viennent dans des migrations suivantes.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6 (Debian 18.6-3)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'client'
);


--
-- Name: email_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.email_status AS ENUM (
    'pending',
    'sent',
    'failed'
);


--
-- Name: email_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.email_type AS ENUM (
    'confirmation',
    'reminder',
    'deliverable',
    'cancellation',
    'reschedule'
);


--
-- Name: offer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.offer_type AS ENUM (
    'one_shot',
    '45_jours',
    'vip'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


--
-- Name: commerce_accept(uuid, date, boolean, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commerce_accept(p_token uuid, p_start date, p_early boolean, p_consent jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: commerce_dates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commerce_dates() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
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


--
-- Name: commerce_record_payment(uuid, text, text, integer, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commerce_record_payment(p_order uuid, p_method text, p_reference text, p_amount integer, p_received timestamp with time zone, p_actor uuid DEFAULT NULL::uuid) RETURNS void
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
      WHEN (p_received AT TIME ZONE 'Europe/Paris')::date > start_date OR (offer='premium' AND p_received>starts_at) THEN 'needs_reschedule'
      WHEN amount_received+p_amount=amount_cents AND consent_at IS NOT NULL THEN 'scheduled' ELSE status END
    WHERE id=p_order;
  INSERT INTO commerce_audit(order_id,actor,action,details)
    VALUES(p_order,p_actor,p_method,jsonb_build_object('reference',p_reference,'amount_cents',p_amount));
END $$;


--
-- Name: commerce_revenue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commerce_revenue() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object('total',coalesce(sum(r.amount_cents),0)/100.0,
    'academy',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='academy'),0)/100.0,
    'premium',coalesce(sum(r.amount_cents) FILTER(WHERE o.offer='premium'),0)/100.0)
  FROM commerce_receipts r JOIN commerce_orders o ON o.id=r.order_id
  WHERE r.received_at >= date_trunc('month',now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
$$;


--
-- Name: commerce_submit_application(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commerce_submit_application(v jsonb) RETURNS uuid
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
    ('application:'||result_id||':owner','contact@fredwav.com','Nouvelle demande '||(v->>'offer'),
     (v->>'first_name')||' · '||(v->>'email')||E'\n'||(v->>'account_or_project')||E'\n'||(v->>'objective')||E'\nDémarrage souhaité : '||(v->>'timing')),
    ('application:'||result_id||':client',v->>'email','Ta demande est enregistrée',
     CASE WHEN v->>'offer'='academy' THEN 'Wav Academy : 749 € TTC pour six mois. Choisis le créneau de ton appel commercial (sans diagnostic gratuit) : https://calendar.app.google/UZC5UY38shFuSqmy6'
     ELSE 'Wav Premium : 1 990 € TTC pour trente jours. Fred étudie personnellement ta candidature et répond sous deux jours ouvrés. Aucun paiement à cette étape.' END);
  RETURN result_id;
END $$;


--
-- Name: express_notification_outbox(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.express_notification_outbox() RETURNS trigger
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


--
-- Name: express_paid_since(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.express_paid_since() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT count(*)::integer FROM (
    SELECT ea.id
      FROM public.express_analyses AS ea
     WHERE ea.stripe_session_id IS NOT NULL
       AND ea.status NOT IN ('cancelled', 'refunded')
       AND ea.refunded_at IS NULL
       AND ea.created_at > TIMESTAMPTZ '2026-10-12 15:00:00+00'
       AND NOT EXISTS (
         SELECT 1
           FROM public.express_purchase_consents AS c
          WHERE c.express_analysis_id = ea.id
            AND c.checkout_mode = 'test'
       )
    UNION
    SELECT c.express_analysis_id
      FROM public.express_purchase_consents AS c
     WHERE c.stripe_payment_status = 'paid'
       AND c.checkout_mode <> 'test'
       AND c.created_at > TIMESTAMPTZ '2026-10-12 15:00:00+00'
  ) AS paid;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: express_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.express_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_session_id text,
    tiktok_username text NOT NULL,
    job_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    health_score integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    result_data jsonb,
    email text,
    newsletter_requested boolean DEFAULT false,
    newsletter_subscribed boolean DEFAULT false,
    launch_started_at timestamp with time zone,
    result_email_sent_at timestamp with time zone,
    support_requested_at timestamp with time zone,
    processing_started_at timestamp with time zone,
    refund_reference text,
    refunded_at timestamp with time zone,
    report_version text DEFAULT 'sample-v3'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: get_express_analysis_by_session(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_express_analysis_by_session(p_session_id text) RETURNS public.express_analyses
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT * FROM public.express_analyses
  WHERE stripe_session_id = p_session_id
  LIMIT 1;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_deep_link_click(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_deep_link_click(p_slug text) RETURNS TABLE(youtube_id text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.deep_links SET clicks_count = clicks_count + 1
  WHERE slug = p_slug RETURNING deep_links.youtube_id;
$$;


--
-- Name: increment_deep_link_clicks(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_deep_link_clicks(p_slug text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.deep_links SET clicks_count = clicks_count + 1 WHERE slug = p_slug;
$$;


--
-- Name: update_page_view_duration(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.page_views
  SET duration_seconds = GREATEST(0, LEAST(p_duration, 86400))
  WHERE id = p_id;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: upsert_diagnostic_lead(uuid, jsonb, integer, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.diagnostic_leads (
      first_name, last_name, email, tiktok, level, objective, blocker, budget,
      recommended_offer, origin_source, conversion_trigger, posthog_id,
      follower_since, temps, current_step, completed
    )
    VALUES (
      p_fields->>'first_name', p_fields->>'last_name', p_fields->>'email',
      p_fields->>'tiktok', p_fields->>'level', p_fields->>'objective',
      p_fields->>'blocker', p_fields->>'budget', p_fields->>'recommended_offer',
      p_fields->>'origin_source', p_fields->>'conversion_trigger',
      p_fields->>'posthog_id', p_fields->>'follower_since', p_fields->>'temps',
      COALESCE(p_current_step, 0), COALESCE(p_completed, false)
    )
    RETURNING id INTO v_id;
    RETURN v_id;
  ELSE
    UPDATE public.diagnostic_leads
    SET
      first_name = COALESCE(p_fields->>'first_name', first_name),
      last_name = COALESCE(p_fields->>'last_name', last_name),
      email = COALESCE(p_fields->>'email', email),
      tiktok = COALESCE(p_fields->>'tiktok', tiktok),
      level = COALESCE(p_fields->>'level', level),
      objective = COALESCE(p_fields->>'objective', objective),
      blocker = COALESCE(p_fields->>'blocker', blocker),
      budget = COALESCE(p_fields->>'budget', budget),
      recommended_offer = COALESCE(p_fields->>'recommended_offer', recommended_offer),
      origin_source = COALESCE(p_fields->>'origin_source', origin_source),
      conversion_trigger = COALESCE(p_fields->>'conversion_trigger', conversion_trigger),
      posthog_id = COALESCE(p_fields->>'posthog_id', posthog_id),
      follower_since = COALESCE(p_fields->>'follower_since', follower_since),
      temps = COALESCE(p_fields->>'temps', temps),
      current_step = COALESCE(p_current_step, current_step),
      completed = COALESCE(p_completed, completed),
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
END;
$$;


--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT availability_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    offer public.offer_type NOT NULL,
    amount_cents integer NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    stripe_payment_id text,
    stripe_session_id text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_screenshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_screenshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    client_name text,
    caption text,
    offer text[] DEFAULT '{}'::text[] NOT NULL,
    display_locations text[] DEFAULT '{}'::text[] NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: commerce_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    offer text NOT NULL,
    first_name text NOT NULL,
    email text NOT NULL,
    account_or_project text NOT NULL,
    objective text NOT NULL,
    timing text DEFAULT ''::text NOT NULL,
    commitments jsonb NOT NULL,
    fingerprint text NOT NULL,
    stage text DEFAULT 'received'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commerce_applications_offer_check CHECK ((offer = ANY (ARRAY['academy'::text, 'premium'::text]))),
    CONSTRAINT commerce_applications_stage_check CHECK ((stage = ANY (ARRAY['received'::text, 'booked'::text, 'closed'::text, 'declined'::text])))
);


--
-- Name: commerce_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    actor uuid,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: commerce_mail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_mail (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dedupe_key text NOT NULL,
    recipient text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    state text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    sent_at timestamp with time zone,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commerce_mail_state_check CHECK ((state = ANY (ARRAY['pending'::text, 'sending'::text, 'sent'::text, 'failed'::text])))
);


--
-- Name: commerce_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    claim_token uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid,
    offer text NOT NULL,
    offer_version text DEFAULT '2026-09-v3'::text NOT NULL,
    invoice_reference text,
    email text NOT NULL,
    first_name text NOT NULL,
    amount_cents integer NOT NULL,
    currency text DEFAULT 'eur'::text NOT NULL,
    start_date date NOT NULL,
    start_time time without time zone DEFAULT '00:00:00'::time without time zone NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    amount_received integer DEFAULT 0 NOT NULL,
    paid_at timestamp with time zone,
    consent_at timestamp with time zone,
    consent jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    subscription_id uuid,
    wavstats_status text DEFAULT 'pending'::text NOT NULL,
    discord_status text DEFAULT 'pending'::text NOT NULL,
    wavstats_activation_url text,
    last_error text,
    lock_until timestamp with time zone,
    last_processed_at timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commerce_orders_amount_cents_check CHECK ((amount_cents = ANY (ARRAY[74900, 199000]))),
    CONSTRAINT commerce_orders_check CHECK ((((offer = 'academy'::text) AND (amount_cents = 74900)) OR ((offer = 'premium'::text) AND (amount_cents = 199000)))),
    CONSTRAINT commerce_orders_currency_check CHECK ((currency = 'eur'::text)),
    CONSTRAINT commerce_orders_offer_check CHECK ((offer = ANY (ARRAY['academy'::text, 'premium'::text]))),
    CONSTRAINT commerce_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'active'::text, 'needs_reschedule'::text, 'cancelled'::text, 'expired'::text])))
);


--
-- Name: commerce_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    method text NOT NULL,
    reference text NOT NULL,
    amount_cents integer NOT NULL,
    received_at timestamp with time zone NOT NULL,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commerce_receipts_amount_cents_check CHECK ((amount_cents <> 0)),
    CONSTRAINT commerce_receipts_method_check CHECK ((method = ANY (ARRAY['stripe'::text, 'transfer'::text, 'refund'::text])))
);


--
-- Name: commerce_unmatched_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commerce_unmatched_payments (
    session_id text NOT NULL,
    reason text NOT NULL,
    amount_cents integer,
    currency text,
    received_at timestamp with time zone,
    email text,
    resolved_order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deep_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deep_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    youtube_id text NOT NULL,
    title text NOT NULL,
    clicks_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diagnostic_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostic_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text,
    email text,
    tiktok text,
    level text,
    objective text,
    blocker text,
    budget text,
    recommended_offer text,
    current_step integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    origin_source text,
    follower_since text,
    conversion_trigger text,
    posthog_id text,
    temps text
);


--
-- Name: express_purchase_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.express_purchase_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    express_analysis_id uuid NOT NULL,
    email text NOT NULL,
    tiktok_username text NOT NULL,
    consent_cgv boolean NOT NULL,
    consent_immediate_delivery boolean NOT NULL,
    cgv_version text NOT NULL,
    immediate_delivery_notice_version text NOT NULL,
    cgv_accepted_text text NOT NULL,
    immediate_delivery_accepted_text text NOT NULL,
    checkout_mode text DEFAULT 'live'::text NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    technical_fingerprint_hash text,
    stripe_session_id text,
    stripe_payment_status text,
    stripe_linked_at timestamp with time zone,
    confirmation_email text,
    confirmation_sent_at timestamp with time zone,
    confirmation_delivery_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT express_purchase_consents_checkout_mode_check CHECK ((checkout_mode = ANY (ARRAY['live'::text, 'test'::text]))),
    CONSTRAINT express_purchase_consents_consent_cgv_check CHECK (consent_cgv),
    CONSTRAINT express_purchase_consents_consent_immediate_delivery_check CHECK (consent_immediate_delivery)
);


--
-- Name: newsletter_opt_in_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_opt_in_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    first_name text,
    source text NOT NULL,
    source_page text,
    consent_accepted boolean NOT NULL,
    consent_version text NOT NULL,
    consent_text text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    technical_fingerprint_hash text,
    mailerlite_subscriber_id text,
    mailerlite_status text,
    mailerlite_request_status text DEFAULT 'pending'::text NOT NULL,
    mailerlite_request_error text,
    CONSTRAINT newsletter_opt_in_requests_consent_accepted_check CHECK (consent_accepted),
    CONSTRAINT newsletter_opt_in_requests_mailerlite_request_status_check CHECK ((mailerlite_request_status = ANY (ARRAY['pending'::text, 'submitted'::text, 'failed'::text]))),
    CONSTRAINT newsletter_opt_in_requests_source_check CHECK ((source = ANY (ARRAY['newsletter'::text, 'analyse_express'::text])))
);


--
-- Name: oneshot_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oneshot_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_session_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    whatsapp text NOT NULL,
    tiktok text NOT NULL,
    objectives text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    origin_source text,
    conversion_trigger text,
    posthog_id text
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path text NOT NULL,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    session_id text NOT NULL,
    visitor_id text,
    entered_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_seconds integer DEFAULT 0
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trusted_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    avatar_url text,
    tiktok_url text,
    offers text[] DEFAULT '{}'::text[] NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'client'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: video_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    tiktok_url text NOT NULL,
    video_id text NOT NULL,
    status text DEFAULT 'awaiting_payment'::text NOT NULL,
    checkout_mode text NOT NULL,
    stripe_session_id text,
    paid_at timestamp with time zone,
    job_id text,
    launch_attempts integer DEFAULT 0 NOT NULL,
    processing_started_at timestamp with time zone,
    result_raw jsonb,
    report_data jsonb,
    report_version text DEFAULT 'video-v1'::text NOT NULL,
    report_token uuid DEFAULT gen_random_uuid() NOT NULL,
    completed_at timestamp with time zone,
    result_email_queued_at timestamp with time zone,
    report_viewed_at timestamp with time zone,
    pdf_downloaded_at timestamp with time zone,
    error_message text,
    support_requested_at timestamp with time zone,
    cgv_version text NOT NULL,
    immediate_delivery_notice_version text NOT NULL,
    cgv_accepted_text text NOT NULL,
    immediate_delivery_accepted_text text NOT NULL,
    accepted_at timestamp with time zone NOT NULL,
    technical_fingerprint_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT video_analyses_checkout_mode_check CHECK ((checkout_mode = ANY (ARRAY['live'::text, 'test'::text]))),
    CONSTRAINT video_analyses_status_check CHECK ((status = ANY (ARRAY['awaiting_payment'::text, 'paid'::text, 'starting'::text, 'processing'::text, 'completed'::text, 'delivered'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: wav_premium_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wav_premium_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    tiktok_username text,
    current_level text,
    blockers text,
    goals text NOT NULL,
    origin_source text,
    follower_since text,
    conversion_trigger text,
    posthog_id text,
    budget text,
    profil text,
    motivation text,
    accompagnement_type text,
    accompagnement_critere text,
    instagram_username text,
    youtube_url text,
    facebook_url text,
    other_social_url text,
    objectives text[],
    success_30_days text,
    why_now text,
    help_topics text[],
    availability text,
    form_version text,
    account_url text,
    business_stage text,
    primary_goal text,
    main_blocker text,
    work_mode text,
    orientation_request_id uuid,
    orientation_fingerprint text,
    CONSTRAINT check_accompagnement_type_not_empty CHECK ((TRIM(BOTH FROM accompagnement_type) <> ''::text)),
    CONSTRAINT check_availability_not_empty CHECK (((availability IS NULL) OR ((TRIM(BOTH FROM availability) <> ''::text) AND (char_length(availability) <= 300)))),
    CONSTRAINT check_facebook_url_not_empty CHECK (((facebook_url IS NULL) OR ((TRIM(BOTH FROM facebook_url) <> ''::text) AND (char_length(facebook_url) <= 500)))),
    CONSTRAINT check_help_topics_not_empty CHECK (((help_topics IS NULL) OR ((cardinality(help_topics) >= 1) AND (cardinality(help_topics) <= 9)))),
    CONSTRAINT check_instagram_username_not_empty CHECK (((instagram_username IS NULL) OR ((TRIM(BOTH FROM instagram_username) <> ''::text) AND (char_length(instagram_username) <= 100)))),
    CONSTRAINT check_motivation_not_empty CHECK ((TRIM(BOTH FROM motivation) <> ''::text)),
    CONSTRAINT check_objectives_not_empty CHECK (((objectives IS NULL) OR ((cardinality(objectives) >= 1) AND (cardinality(objectives) <= 9)))),
    CONSTRAINT check_orientation_account_url CHECK (((account_url IS NULL) OR ((TRIM(BOTH FROM account_url) <> ''::text) AND (char_length(account_url) <= 500)))),
    CONSTRAINT check_orientation_business_stage CHECK (((business_stage IS NULL) OR (business_stage = ANY (ARRAY['debut'::text, 'irregulier'::text, 'stagnation'::text, 'visibilite_sans_revenus'::text, 'activite_a_accelerer'::text])))),
    CONSTRAINT check_orientation_form_version CHECK (((form_version IS NULL) OR (form_version = ANY (ARRAY['orientation_v2'::text, 'orientation_v3'::text])))),
    CONSTRAINT check_orientation_main_blocker CHECK (((main_blocker IS NULL) OR ((char_length(TRIM(BOTH FROM main_blocker)) >= 20) AND (char_length(TRIM(BOTH FROM main_blocker)) <= 2000)))),
    CONSTRAINT check_orientation_primary_goal CHECK (((primary_goal IS NULL) OR (primary_goal = ANY (ARRAY['comprendre_contenus'::text, 'gagner_visibilite'::text, 'attirer_clients'::text, 'mieux_vendre'::text, 'structurer_strategie'::text])))),
    CONSTRAINT check_orientation_work_mode CHECK (((work_mode IS NULL) OR (work_mode = ANY (ARRAY['outils_autonomes'::text, 'plan_ponctuel'::text, 'suivi_collectif'::text, 'suivi_individuel'::text, 'a_definir'::text, 'autonome'::text, 'regard_strategique'::text])))),
    CONSTRAINT check_other_social_url_not_empty CHECK (((other_social_url IS NULL) OR ((TRIM(BOTH FROM other_social_url) <> ''::text) AND (char_length(other_social_url) <= 500)))),
    CONSTRAINT check_profil_not_empty CHECK ((TRIM(BOTH FROM profil) <> ''::text)),
    CONSTRAINT check_success_30_days_not_empty CHECK (((success_30_days IS NULL) OR ((TRIM(BOTH FROM success_30_days) <> ''::text) AND (char_length(success_30_days) <= 3000)))),
    CONSTRAINT check_why_now_not_empty CHECK (((why_now IS NULL) OR ((TRIM(BOTH FROM why_now) <> ''::text) AND (char_length(why_now) <= 3000)))),
    CONSTRAINT check_youtube_url_not_empty CHECK (((youtube_url IS NULL) OR ((TRIM(BOTH FROM youtube_url) <> ''::text) AND (char_length(youtube_url) <= 500))))
);


--
-- Name: wavacademy_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wavacademy_claims (
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid,
    email text NOT NULL,
    plan_type text NOT NULL,
    discord_role_env text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    claimed_at timestamp with time zone,
    discord_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wavacademy_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wavacademy_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    plan_type text NOT NULL,
    consent_cgv boolean NOT NULL,
    consent_renonciation boolean NOT NULL,
    cgv_version text DEFAULT 'v1'::text NOT NULL,
    ip_address text,
    user_agent text,
    stripe_session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    access_months integer,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    cgv_accepted_text text,
    immediate_delivery_notice_version text,
    immediate_delivery_accepted_text text,
    technical_fingerprint_hash text
);


--
-- Name: COLUMN wavacademy_consents.ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.wavacademy_consents.ip_address IS 'Deprecated: legacy evidence only. New writes must use technical_fingerprint_hash.';


--
-- Name: COLUMN wavacademy_consents.user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.wavacademy_consents.user_agent IS 'Deprecated: legacy evidence only. New writes must use technical_fingerprint_hash.';


--
-- Name: COLUMN wavacademy_consents.technical_fingerprint_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.wavacademy_consents.technical_fingerprint_hash IS 'HMAC-SHA-256 of transient IP and user-agent values; raw values are not written for new purchases.';


--
-- Name: wavacademy_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wavacademy_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_session_id text,
    stripe_subscription_id text,
    email text NOT NULL,
    discord_user_id text,
    discord_role_env text,
    plan_type text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    discord_role_granted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    access_months integer,
    access_expires_at timestamp with time zone,
    activation_email_status text DEFAULT 'pending'::text NOT NULL,
    activation_email_attempted_at timestamp with time zone,
    activation_email_sent_at timestamp with time zone,
    activation_email_error text,
    access_starts_at timestamp with time zone,
    commerce_order_id uuid,
    CONSTRAINT wavacademy_activation_email_status_check CHECK ((activation_email_status = ANY (ARRAY['pending'::text, 'sending'::text, 'failed'::text, 'sent'::text])))
);


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_reference text NOT NULL,
    customer_name text NOT NULL,
    email text NOT NULL,
    order_reference text NOT NULL,
    offer text NOT NULL,
    order_date date,
    message text,
    declaration_version text NOT NULL,
    declaration_text text NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    technical_fingerprint_hash text,
    acknowledgement_status text DEFAULT 'pending'::text NOT NULL,
    notification_status text DEFAULT 'pending'::text NOT NULL,
    email_delivery_attempts integer DEFAULT 0 NOT NULL,
    last_delivery_attempt_at timestamp with time zone,
    acknowledgement_sent_at timestamp with time zone,
    notification_sent_at timestamp with time zone,
    email_delivery_error text,
    CONSTRAINT withdrawal_requests_acknowledgement_status_check CHECK ((acknowledgement_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]))),
    CONSTRAINT withdrawal_requests_email_delivery_attempts_check CHECK ((email_delivery_attempts >= 0)),
    CONSTRAINT withdrawal_requests_notification_status_check CHECK ((notification_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]))),
    CONSTRAINT withdrawal_requests_offer_check CHECK ((offer = ANY (ARRAY['analyse_express'::text, 'wav_academy'::text, 'wav_premium'::text, 'other'::text]))),
    CONSTRAINT withdrawal_requests_status_check CHECK ((status = ANY (ARRAY['received'::text, 'under_review'::text, 'accepted'::text, 'rejected'::text, 'completed'::text])))
);


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: client_screenshots client_screenshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_screenshots
    ADD CONSTRAINT client_screenshots_pkey PRIMARY KEY (id);


--
-- Name: commerce_applications commerce_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_applications
    ADD CONSTRAINT commerce_applications_pkey PRIMARY KEY (id);


--
-- Name: commerce_applications commerce_applications_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_applications
    ADD CONSTRAINT commerce_applications_request_id_key UNIQUE (request_id);


--
-- Name: commerce_audit commerce_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_audit
    ADD CONSTRAINT commerce_audit_pkey PRIMARY KEY (id);


--
-- Name: commerce_mail commerce_mail_dedupe_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_mail
    ADD CONSTRAINT commerce_mail_dedupe_key_key UNIQUE (dedupe_key);


--
-- Name: commerce_mail commerce_mail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_mail
    ADD CONSTRAINT commerce_mail_pkey PRIMARY KEY (id);


--
-- Name: commerce_orders commerce_orders_claim_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_claim_token_key UNIQUE (claim_token);


--
-- Name: commerce_orders commerce_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_pkey PRIMARY KEY (id);


--
-- Name: commerce_orders commerce_orders_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_subscription_id_key UNIQUE (subscription_id);


--
-- Name: commerce_orders commerce_orders_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_token_key UNIQUE (token);


--
-- Name: commerce_receipts commerce_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_receipts
    ADD CONSTRAINT commerce_receipts_pkey PRIMARY KEY (id);


--
-- Name: commerce_receipts commerce_receipts_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_receipts
    ADD CONSTRAINT commerce_receipts_reference_key UNIQUE (reference);


--
-- Name: commerce_unmatched_payments commerce_unmatched_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_unmatched_payments
    ADD CONSTRAINT commerce_unmatched_payments_pkey PRIMARY KEY (session_id);


--
-- Name: deep_links deep_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deep_links
    ADD CONSTRAINT deep_links_pkey PRIMARY KEY (id);


--
-- Name: deep_links deep_links_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deep_links
    ADD CONSTRAINT deep_links_slug_key UNIQUE (slug);


--
-- Name: diagnostic_leads diagnostic_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_leads
    ADD CONSTRAINT diagnostic_leads_pkey PRIMARY KEY (id);


--
-- Name: express_analyses express_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_analyses
    ADD CONSTRAINT express_analyses_pkey PRIMARY KEY (id);


--
-- Name: express_purchase_consents express_purchase_consents_express_analysis_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_purchase_consents
    ADD CONSTRAINT express_purchase_consents_express_analysis_id_key UNIQUE (express_analysis_id);


--
-- Name: express_purchase_consents express_purchase_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_purchase_consents
    ADD CONSTRAINT express_purchase_consents_pkey PRIMARY KEY (id);


--
-- Name: express_purchase_consents express_purchase_consents_stripe_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_purchase_consents
    ADD CONSTRAINT express_purchase_consents_stripe_session_id_key UNIQUE (stripe_session_id);


--
-- Name: newsletter_opt_in_requests newsletter_opt_in_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_opt_in_requests
    ADD CONSTRAINT newsletter_opt_in_requests_pkey PRIMARY KEY (id);


--
-- Name: oneshot_submissions oneshot_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oneshot_submissions
    ADD CONSTRAINT oneshot_submissions_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: trusted_clients trusted_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_clients
    ADD CONSTRAINT trusted_clients_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: video_analyses video_analyses_job_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_job_id_key UNIQUE (job_id);


--
-- Name: video_analyses video_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_pkey PRIMARY KEY (id);


--
-- Name: video_analyses video_analyses_report_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_report_token_key UNIQUE (report_token);


--
-- Name: video_analyses video_analyses_stripe_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_stripe_session_id_key UNIQUE (stripe_session_id);


--
-- Name: wav_premium_applications wav_premium_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wav_premium_applications
    ADD CONSTRAINT wav_premium_applications_pkey PRIMARY KEY (id);


--
-- Name: wavacademy_claims wavacademy_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_claims
    ADD CONSTRAINT wavacademy_claims_pkey PRIMARY KEY (token);


--
-- Name: wavacademy_consents wavacademy_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_consents
    ADD CONSTRAINT wavacademy_consents_pkey PRIMARY KEY (id);


--
-- Name: wavacademy_subscriptions wavacademy_subscriptions_commerce_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_subscriptions
    ADD CONSTRAINT wavacademy_subscriptions_commerce_order_id_key UNIQUE (commerce_order_id);


--
-- Name: wavacademy_subscriptions wavacademy_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_subscriptions
    ADD CONSTRAINT wavacademy_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: wavacademy_subscriptions wavacademy_subscriptions_stripe_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_subscriptions
    ADD CONSTRAINT wavacademy_subscriptions_stripe_session_id_key UNIQUE (stripe_session_id);


--
-- Name: wavacademy_subscriptions wavacademy_subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_subscriptions
    ADD CONSTRAINT wavacademy_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: withdrawal_requests withdrawal_requests_request_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_request_reference_key UNIQUE (request_reference);


--
-- Name: commerce_applications_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX commerce_applications_rate ON public.commerce_applications USING btree (fingerprint, created_at);


--
-- Name: express_analyses_stripe_session_id_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX express_analyses_stripe_session_id_uniq ON public.express_analyses USING btree (stripe_session_id) WHERE (stripe_session_id IS NOT NULL);


--
-- Name: idx_express_purchase_consents_accepted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_express_purchase_consents_accepted_at ON public.express_purchase_consents USING btree (accepted_at DESC);


--
-- Name: idx_express_purchase_consents_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_express_purchase_consents_email ON public.express_purchase_consents USING btree (email);


--
-- Name: idx_express_purchase_consents_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_express_purchase_consents_fingerprint ON public.express_purchase_consents USING btree (technical_fingerprint_hash, accepted_at DESC);


--
-- Name: idx_newsletter_opt_in_email_requested; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_opt_in_email_requested ON public.newsletter_opt_in_requests USING btree (email, requested_at DESC);


--
-- Name: idx_newsletter_opt_in_fingerprint_requested; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_opt_in_fingerprint_requested ON public.newsletter_opt_in_requests USING btree (technical_fingerprint_hash, requested_at DESC);


--
-- Name: idx_page_views_entered_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_entered_at ON public.page_views USING btree (entered_at DESC);


--
-- Name: idx_page_views_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_path ON public.page_views USING btree (path);


--
-- Name: idx_page_views_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_session_id ON public.page_views USING btree (session_id);


--
-- Name: idx_video_analyses_email_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analyses_email_created ON public.video_analyses USING btree (email, created_at DESC);


--
-- Name: idx_video_analyses_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analyses_queue ON public.video_analyses USING btree (status, updated_at) WHERE (status = ANY (ARRAY['paid'::text, 'starting'::text, 'processing'::text, 'completed'::text]));


--
-- Name: idx_video_analyses_recent_paid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analyses_recent_paid ON public.video_analyses USING btree (email, video_id, checkout_mode, paid_at DESC) WHERE (paid_at IS NOT NULL);


--
-- Name: idx_wavacademy_claims_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_claims_pending ON public.wavacademy_claims USING btree (expires_at) WHERE (claimed_at IS NULL);


--
-- Name: idx_wavacademy_claims_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_claims_subscription ON public.wavacademy_claims USING btree (subscription_id);


--
-- Name: idx_wavacademy_consents_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_consents_email ON public.wavacademy_consents USING btree (email);


--
-- Name: idx_wavacademy_consents_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_consents_fingerprint ON public.wavacademy_consents USING btree (technical_fingerprint_hash, accepted_at DESC);


--
-- Name: idx_wavacademy_consents_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_consents_session ON public.wavacademy_consents USING btree (stripe_session_id);


--
-- Name: idx_wavacademy_subscriptions_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_subscriptions_email ON public.wavacademy_subscriptions USING btree (email);


--
-- Name: idx_wavacademy_subscriptions_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_subscriptions_expiry ON public.wavacademy_subscriptions USING btree (access_expires_at) WHERE (status = 'active'::text);


--
-- Name: idx_wavacademy_subscriptions_stripe_sub; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wavacademy_subscriptions_stripe_sub ON public.wavacademy_subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_withdrawal_requests_delivery_outbox; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_delivery_outbox ON public.withdrawal_requests USING btree (acknowledgement_status, notification_status, last_delivery_attempt_at);


--
-- Name: idx_withdrawal_requests_email_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_email_submitted ON public.withdrawal_requests USING btree (email, submitted_at DESC);


--
-- Name: idx_withdrawal_requests_fingerprint_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_fingerprint_submitted ON public.withdrawal_requests USING btree (technical_fingerprint_hash, submitted_at DESC);


--
-- Name: idx_withdrawal_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status, submitted_at DESC);


--
-- Name: wav_premium_applications_orientation_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wav_premium_applications_orientation_rate ON public.wav_premium_applications USING btree (orientation_fingerprint, created_at) WHERE (orientation_fingerprint IS NOT NULL);


--
-- Name: wav_premium_applications_orientation_request; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX wav_premium_applications_orientation_request ON public.wav_premium_applications USING btree (orientation_request_id) WHERE (orientation_request_id IS NOT NULL);


--
-- Name: commerce_orders commerce_order_dates; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER commerce_order_dates BEFORE INSERT OR UPDATE ON public.commerce_orders FOR EACH ROW EXECUTE FUNCTION public.commerce_dates();


--
-- Name: express_analyses express_notification_outbox; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER express_notification_outbox AFTER UPDATE ON public.express_analyses FOR EACH ROW EXECUTE FUNCTION public.express_notification_outbox();


--
-- Name: availability_slots update_availability_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: diagnostic_leads update_diagnostic_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_diagnostic_leads_updated_at BEFORE UPDATE ON public.diagnostic_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: withdrawal_requests update_withdrawal_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commerce_audit commerce_audit_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_audit
    ADD CONSTRAINT commerce_audit_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id);


--
-- Name: commerce_orders commerce_orders_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.commerce_applications(id);


--
-- Name: commerce_orders commerce_orders_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.wavacademy_subscriptions(id);


--
-- Name: commerce_receipts commerce_receipts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_receipts
    ADD CONSTRAINT commerce_receipts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id);


--
-- Name: commerce_unmatched_payments commerce_unmatched_payments_resolved_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commerce_unmatched_payments
    ADD CONSTRAINT commerce_unmatched_payments_resolved_order_id_fkey FOREIGN KEY (resolved_order_id) REFERENCES public.commerce_orders(id);


--
-- Name: express_purchase_consents express_purchase_consents_express_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_purchase_consents
    ADD CONSTRAINT express_purchase_consents_express_analysis_id_fkey FOREIGN KEY (express_analysis_id) REFERENCES public.express_analyses(id) ON DELETE RESTRICT;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wavacademy_claims wavacademy_claims_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_claims
    ADD CONSTRAINT wavacademy_claims_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.wavacademy_subscriptions(id) ON DELETE CASCADE;


--
-- Name: wavacademy_subscriptions wavacademy_subscriptions_commerce_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wavacademy_subscriptions
    ADD CONSTRAINT wavacademy_subscriptions_commerce_order_id_fkey FOREIGN KEY (commerce_order_id) REFERENCES public.commerce_orders(id);


--
-- Name: wavacademy_claims Admin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access" ON public.wavacademy_claims TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wavacademy_consents Admin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access" ON public.wavacademy_consents TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wavacademy_subscriptions Admin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access" ON public.wavacademy_subscriptions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can manage all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all bookings" ON public.bookings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: express_analyses Admins can manage all express_analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all express_analyses" ON public.express_analyses TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wav_premium_applications Admins can manage applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage applications" ON public.wav_premium_applications USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: availability_slots Admins can manage availability slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage availability slots" ON public.availability_slots TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_screenshots Admins can manage client_screenshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage client_screenshots" ON public.client_screenshots TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: deep_links Admins can manage deep_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage deep_links" ON public.deep_links TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: diagnostic_leads Admins can manage diagnostic_leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage diagnostic_leads" ON public.diagnostic_leads USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: express_purchase_consents Admins can manage express consent evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage express consent evidence" ON public.express_purchase_consents TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_opt_in_requests Admins can manage newsletter opt-in evidence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage newsletter opt-in evidence" ON public.newsletter_opt_in_requests TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: oneshot_submissions Admins can manage oneshot_submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage oneshot_submissions" ON public.oneshot_submissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_views Admins can manage page_views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage page_views" ON public.page_views USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: trusted_clients Admins can manage trusted_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage trusted_clients" ON public.trusted_clients TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: withdrawal_requests Admins can manage withdrawal requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage withdrawal requests" ON public.withdrawal_requests TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_views Admins can read page_views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read page_views" ON public.page_views FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wav_premium_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.wav_premium_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_views Anyone can insert valid page_views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert valid page_views" ON public.page_views FOR INSERT TO authenticated, anon WITH CHECK ((((length(path) >= 1) AND (length(path) <= 500)) AND ("left"(path, 1) = '/'::text) AND ((length(session_id) >= 1) AND (length(session_id) <= 100)) AND ((visitor_id IS NULL) OR (length(visitor_id) <= 100)) AND ((referrer IS NULL) OR (length(referrer) <= 2000)) AND ((utm_source IS NULL) OR (length(utm_source) <= 200)) AND ((utm_medium IS NULL) OR (length(utm_medium) <= 200)) AND ((utm_campaign IS NULL) OR (length(utm_campaign) <= 200)) AND (duration_seconds IS NULL)));


--
-- Name: availability_slots Anyone can view active availability slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active availability slots" ON public.availability_slots FOR SELECT USING ((is_active = true));


--
-- Name: client_screenshots Anyone can view active client_screenshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active client_screenshots" ON public.client_screenshots FOR SELECT USING ((is_active = true));


--
-- Name: trusted_clients Anyone can view active trusted_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active trusted_clients" ON public.trusted_clients FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: commerce_applications admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_applications FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: commerce_audit admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_audit FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: commerce_mail admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_mail FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: commerce_orders admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_orders FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: commerce_receipts admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_receipts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: commerce_unmatched_payments admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.commerce_unmatched_payments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: video_analyses admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.video_analyses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: client_screenshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_screenshots ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_mail; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_mail ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: commerce_unmatched_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commerce_unmatched_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: deep_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deep_links ENABLE ROW LEVEL SECURITY;

--
-- Name: diagnostic_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: express_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.express_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: express_purchase_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.express_purchase_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_opt_in_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_opt_in_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: oneshot_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oneshot_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: video_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: wav_premium_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wav_premium_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: wavacademy_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wavacademy_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: wavacademy_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wavacademy_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: wavacademy_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wavacademy_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawal_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Admins can delete client images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete client images" ON storage.objects FOR DELETE USING (((bucket_id = 'client-images'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can delete client-screenshots; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete client-screenshots" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'client-screenshots'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can delete observation images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete observation images" ON storage.objects FOR DELETE USING (((bucket_id = 'observations'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can delete trusted avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete trusted avatars" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'trusted-avatars'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can update trusted avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can update trusted avatars" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'trusted-avatars'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can upload client images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload client images" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'client-images'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can upload client-screenshots; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload client-screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'client-screenshots'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can upload observation images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload observation images" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'observations'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can upload trusted avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload trusted avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'trusted-avatars'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can view all observation images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can view all observation images" ON storage.objects FOR SELECT USING (((bucket_id = 'observations'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can view client images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can view client images" ON storage.objects FOR SELECT USING (((bucket_id = 'client-images'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: FUNCTION commerce_accept(p_token uuid, p_start date, p_early boolean, p_consent jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.commerce_accept(p_token uuid, p_start date, p_early boolean, p_consent jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.commerce_accept(p_token uuid, p_start date, p_early boolean, p_consent jsonb) TO service_role;


--
-- Name: FUNCTION commerce_dates(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.commerce_dates() TO anon;
GRANT ALL ON FUNCTION public.commerce_dates() TO authenticated;
GRANT ALL ON FUNCTION public.commerce_dates() TO service_role;


--
-- Name: FUNCTION commerce_record_payment(p_order uuid, p_method text, p_reference text, p_amount integer, p_received timestamp with time zone, p_actor uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.commerce_record_payment(p_order uuid, p_method text, p_reference text, p_amount integer, p_received timestamp with time zone, p_actor uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.commerce_record_payment(p_order uuid, p_method text, p_reference text, p_amount integer, p_received timestamp with time zone, p_actor uuid) TO service_role;


--
-- Name: FUNCTION commerce_revenue(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.commerce_revenue() FROM PUBLIC;
GRANT ALL ON FUNCTION public.commerce_revenue() TO service_role;


--
-- Name: FUNCTION commerce_submit_application(v jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.commerce_submit_application(v jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.commerce_submit_application(v jsonb) TO service_role;


--
-- Name: FUNCTION express_notification_outbox(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.express_notification_outbox() FROM PUBLIC;
GRANT ALL ON FUNCTION public.express_notification_outbox() TO service_role;


--
-- Name: FUNCTION express_paid_since(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.express_paid_since() FROM PUBLIC;
GRANT ALL ON FUNCTION public.express_paid_since() TO anon;
GRANT ALL ON FUNCTION public.express_paid_since() TO authenticated;
GRANT ALL ON FUNCTION public.express_paid_since() TO service_role;


--
-- Name: TABLE express_analyses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.express_analyses TO anon;
GRANT ALL ON TABLE public.express_analyses TO authenticated;
GRANT ALL ON TABLE public.express_analyses TO service_role;


--
-- Name: FUNCTION get_express_analysis_by_session(p_session_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_express_analysis_by_session(p_session_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_express_analysis_by_session(p_session_id text) TO anon;
GRANT ALL ON FUNCTION public.get_express_analysis_by_session(p_session_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_express_analysis_by_session(p_session_id text) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO anon;


--
-- Name: FUNCTION increment_deep_link_click(p_slug text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.increment_deep_link_click(p_slug text) TO anon;
GRANT ALL ON FUNCTION public.increment_deep_link_click(p_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_deep_link_click(p_slug text) TO service_role;


--
-- Name: FUNCTION increment_deep_link_clicks(p_slug text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.increment_deep_link_clicks(p_slug text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.increment_deep_link_clicks(p_slug text) TO anon;
GRANT ALL ON FUNCTION public.increment_deep_link_clicks(p_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_deep_link_clicks(p_slug text) TO service_role;


--
-- Name: FUNCTION update_page_view_duration(p_id uuid, p_duration integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer) TO anon;
GRANT ALL ON FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer) TO authenticated;
GRANT ALL ON FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean) TO anon;
GRANT ALL ON FUNCTION public.upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_diagnostic_lead(p_id uuid, p_fields jsonb, p_current_step integer, p_completed boolean) TO service_role;


--
-- Name: TABLE availability_slots; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.availability_slots TO anon;
GRANT ALL ON TABLE public.availability_slots TO authenticated;
GRANT ALL ON TABLE public.availability_slots TO service_role;


--
-- Name: TABLE bookings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.bookings TO anon;
GRANT ALL ON TABLE public.bookings TO authenticated;
GRANT ALL ON TABLE public.bookings TO service_role;


--
-- Name: TABLE client_screenshots; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.client_screenshots TO anon;
GRANT ALL ON TABLE public.client_screenshots TO authenticated;
GRANT ALL ON TABLE public.client_screenshots TO service_role;


--
-- Name: TABLE commerce_applications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_applications TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_applications TO authenticated;
GRANT ALL ON TABLE public.commerce_applications TO service_role;


--
-- Name: TABLE commerce_audit; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_audit TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_audit TO authenticated;
GRANT ALL ON TABLE public.commerce_audit TO service_role;


--
-- Name: TABLE commerce_mail; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_mail TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_mail TO authenticated;
GRANT ALL ON TABLE public.commerce_mail TO service_role;


--
-- Name: TABLE commerce_orders; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_orders TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_orders TO authenticated;
GRANT ALL ON TABLE public.commerce_orders TO service_role;


--
-- Name: TABLE commerce_receipts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_receipts TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_receipts TO authenticated;
GRANT ALL ON TABLE public.commerce_receipts TO service_role;


--
-- Name: TABLE commerce_unmatched_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_unmatched_payments TO anon;
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE public.commerce_unmatched_payments TO authenticated;
GRANT ALL ON TABLE public.commerce_unmatched_payments TO service_role;


--
-- Name: TABLE deep_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.deep_links TO anon;
GRANT ALL ON TABLE public.deep_links TO authenticated;
GRANT ALL ON TABLE public.deep_links TO service_role;


--
-- Name: TABLE diagnostic_leads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.diagnostic_leads TO anon;
GRANT ALL ON TABLE public.diagnostic_leads TO authenticated;
GRANT ALL ON TABLE public.diagnostic_leads TO service_role;


--
-- Name: TABLE express_purchase_consents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.express_purchase_consents TO anon;
GRANT ALL ON TABLE public.express_purchase_consents TO authenticated;
GRANT ALL ON TABLE public.express_purchase_consents TO service_role;


--
-- Name: TABLE newsletter_opt_in_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.newsletter_opt_in_requests TO anon;
GRANT ALL ON TABLE public.newsletter_opt_in_requests TO authenticated;
GRANT ALL ON TABLE public.newsletter_opt_in_requests TO service_role;


--
-- Name: TABLE oneshot_submissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.oneshot_submissions TO anon;
GRANT ALL ON TABLE public.oneshot_submissions TO authenticated;
GRANT ALL ON TABLE public.oneshot_submissions TO service_role;


--
-- Name: TABLE page_views; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_views TO anon;
GRANT ALL ON TABLE public.page_views TO authenticated;
GRANT ALL ON TABLE public.page_views TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE trusted_clients; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.trusted_clients TO anon;
GRANT ALL ON TABLE public.trusted_clients TO authenticated;
GRANT ALL ON TABLE public.trusted_clients TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE video_analyses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.video_analyses TO authenticated;
GRANT ALL ON TABLE public.video_analyses TO service_role;


--
-- Name: TABLE wav_premium_applications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wav_premium_applications TO anon;
GRANT ALL ON TABLE public.wav_premium_applications TO authenticated;
GRANT ALL ON TABLE public.wav_premium_applications TO service_role;


--
-- Name: TABLE wavacademy_claims; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wavacademy_claims TO anon;
GRANT ALL ON TABLE public.wavacademy_claims TO authenticated;
GRANT ALL ON TABLE public.wavacademy_claims TO service_role;


--
-- Name: TABLE wavacademy_consents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wavacademy_consents TO anon;
GRANT ALL ON TABLE public.wavacademy_consents TO authenticated;
GRANT ALL ON TABLE public.wavacademy_consents TO service_role;


--
-- Name: TABLE wavacademy_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wavacademy_subscriptions TO anon;
GRANT ALL ON TABLE public.wavacademy_subscriptions TO authenticated;
GRANT ALL ON TABLE public.wavacademy_subscriptions TO service_role;


--
-- Name: TABLE withdrawal_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.withdrawal_requests TO anon;
GRANT ALL ON TABLE public.withdrawal_requests TO authenticated;
GRANT ALL ON TABLE public.withdrawal_requests TO service_role;


--
-- PostgreSQL database dump complete
--



--
-- Déclencheur sur auth.users (profil créé à l'inscription d'un compte admin)
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--
-- Buckets de stockage (définitions seulement ; les fichiers sont copiés à la bascule)
--

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('client-images', 'client-images', false, NULL, NULL),
  ('observations', 'observations', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('trusted-avatars', 'trusted-avatars', true, NULL, NULL),
  ('client-screenshots', 'client-screenshots', true, NULL, NULL),
  ('hooks-packs', 'hooks-packs', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- pg_dump vide search_path : on le rétablit pour les migrations suivantes.
SELECT pg_catalog.set_config('search_path', '"$user", public, extensions', false);
