-- Surveillance du site et de la sauvegarde nocturne.
--
-- Supabase est hébergé ailleurs que le VPS : si le VPS tombe, l'alerte part quand même.
-- Toutes les 5 minutes, pg_cron lit la réponse de la vérification précédente (pg_net)
-- puis relance une requête vers le site. Deux échecs de suite (environ 10 minutes) :
-- e-mail d'alerte, puis un e-mail quand le site répond de nouveau. Sans signal de la
-- sauvegarde du VPS depuis 26 heures : e-mail d'alerte. Les e-mails passent par la file
-- commerce_mail (envoyée chaque minute) vers contact@fredwav.com.
--
-- Adresse surveillée : le site de test jusqu'à la bascule (docs/BASCULE.md), puis
--   UPDATE surveillance SET cible = 'https://fredwav.com' WHERE cle = 'site';

CREATE TABLE public.surveillance (
  cle text PRIMARY KEY CHECK (cle IN ('site', 'sauvegarde')),
  cible text,
  en_alerte boolean NOT NULL DEFAULT false,
  echecs integer NOT NULL DEFAULT 0,
  depuis timestamptz,
  dernier_ok timestamptz NOT NULL DEFAULT now(),
  derniere_requete bigint,
  detail text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.surveillance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.surveillance FROM anon, authenticated;
GRANT ALL ON TABLE public.surveillance TO service_role;

INSERT INTO public.surveillance (cle, cible) VALUES
  ('site', 'https://fredwav.164-68-118-130.sslip.io'),
  ('sauvegarde', NULL);

CREATE FUNCTION public.surveillance_heure(p_at timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT to_char(p_at AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY à HH24"h"MI')
$$;

-- Résultat d'une vérification du site : alerte au 2e échec de suite, puis retour à la normale.
CREATE FUNCTION public.surveillance_site_resultat(p_ok boolean, p_detail text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s surveillance;
BEGIN
  SELECT * INTO s FROM surveillance WHERE cle = 'site' FOR UPDATE;
  IF p_ok THEN
    IF s.en_alerte THEN
      INSERT INTO commerce_mail (dedupe_key, recipient, subject, body) VALUES (
        'surveillance:site:retabli:' || s.depuis, 'contact@fredwav.com', 'Site rétabli : ' || s.cible,
        'Le site ' || s.cible || E' répond de nouveau.\nPanne du ' || surveillance_heure(s.depuis)
          || ' au ' || surveillance_heure(now()) || ' (heure de Paris).')
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
    UPDATE surveillance SET en_alerte = false, echecs = 0, depuis = NULL, dernier_ok = now(),
      detail = left(p_detail, 200), updated_at = now() WHERE cle = 'site';
    RETURN;
  END IF;

  UPDATE surveillance SET echecs = echecs + 1, depuis = coalesce(depuis, now()),
    detail = left(p_detail, 200), updated_at = now() WHERE cle = 'site' RETURNING * INTO s;
  IF s.echecs >= 2 AND NOT s.en_alerte THEN
    INSERT INTO commerce_mail (dedupe_key, recipient, subject, body) VALUES (
      'surveillance:site:panne:' || s.depuis, 'contact@fredwav.com', 'Alerte : le site ne répond plus',
      'Le site ' || s.cible || ' ne répond plus depuis le ' || surveillance_heure(s.depuis)
        || E' (heure de Paris).\nDernière erreur : ' || s.detail
        || E'\nUn e-mail suivra dès qu''il répondra de nouveau. Serveur : VPS Contabo (deploy/README.md).')
    ON CONFLICT (dedupe_key) DO NOTHING;
    UPDATE surveillance SET en_alerte = true WHERE cle = 'site';
  END IF;
END $$;

-- Sauvegarde : alerte si aucun signal du VPS depuis 26 heures.
CREATE FUNCTION public.surveillance_sauvegarde_verifier() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s surveillance;
BEGIN
  SELECT * INTO s FROM surveillance WHERE cle = 'sauvegarde' FOR UPDATE;
  IF s.en_alerte OR s.dernier_ok > now() - interval '26 hours' THEN
    RETURN;
  END IF;
  INSERT INTO commerce_mail (dedupe_key, recipient, subject, body) VALUES (
    'surveillance:sauvegarde:' || s.dernier_ok, 'contact@fredwav.com', 'Alerte : sauvegarde de la base manquante',
    'Aucune sauvegarde nocturne réussie depuis le ' || surveillance_heure(s.dernier_ok)
      || E' (heure de Paris).\nSur le VPS : sudo journalctl -u fredwav-sauvegarde -n 30 (deploy/README.md).')
  ON CONFLICT (dedupe_key) DO NOTHING;
  UPDATE surveillance SET en_alerte = true, depuis = now(), updated_at = now() WHERE cle = 'sauvegarde';
END $$;

-- Appelé par le VPS (rôle « sauvegarde ») à la fin de chaque sauvegarde vérifiée.
CREATE FUNCTION public.sauvegarde_signal(p_detail text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s surveillance;
BEGIN
  SELECT * INTO s FROM surveillance WHERE cle = 'sauvegarde' FOR UPDATE;
  IF s.en_alerte THEN
    INSERT INTO commerce_mail (dedupe_key, recipient, subject, body) VALUES (
      'surveillance:sauvegarde:retablie:' || s.depuis, 'contact@fredwav.com', 'Sauvegarde de la base rétablie',
      'Nouvelle sauvegarde réussie le ' || surveillance_heure(now()) || E' (heure de Paris).\n' || left(p_detail, 200))
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;
  UPDATE surveillance SET en_alerte = false, depuis = NULL, dernier_ok = now(),
    detail = left(p_detail, 200), updated_at = now() WHERE cle = 'sauvegarde';
END $$;

-- Tâche des 5 minutes. Le site de test (protégé par mot de passe) répond 401 : compté
-- comme en ligne. Une requête encore sans réponse (pg_net en retard) ne compte pas.
CREATE FUNCTION public.surveillance_verifier() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s surveillance;
  r record;
BEGIN
  SELECT * INTO s FROM surveillance WHERE cle = 'site';
  IF s.derniere_requete IS NOT NULL THEN
    SELECT status_code, timed_out, error_msg INTO r FROM net._http_response WHERE id = s.derniere_requete;
    IF FOUND THEN
      PERFORM surveillance_site_resultat(
        NOT coalesce(r.timed_out, false) AND r.error_msg IS NULL
          AND (r.status_code BETWEEN 200 AND 399 OR r.status_code = 401),
        CASE WHEN r.timed_out THEN 'aucune réponse en 15 secondes'
             WHEN r.error_msg IS NOT NULL THEN r.error_msg
             ELSE 'HTTP ' || r.status_code END);
    END IF;
  END IF;
  UPDATE surveillance SET derniere_requete = net.http_get(url := s.cible, timeout_milliseconds := 15000)
    WHERE cle = 'site';
  PERFORM surveillance_sauvegarde_verifier();
END $$;

REVOKE ALL ON FUNCTION public.surveillance_site_resultat(boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.surveillance_sauvegarde_verifier() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sauvegarde_signal(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.surveillance_verifier() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sauvegarde_signal(text) TO sauvegarde;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;
  PERFORM cron.schedule('surveillance', '*/5 * * * *', $cmd$SELECT public.surveillance_verifier()$cmd$);
END $$;
