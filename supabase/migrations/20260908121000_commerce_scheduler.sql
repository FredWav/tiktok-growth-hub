-- Populate Vault names commerce_project_url and commerce_service_role in the target
-- isolated project before enabling jobs. Never embed an anon JWT or service key here.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.commerce_tick(endpoint text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE project_url text; service_key text;
BEGIN
  IF endpoint NOT IN ('commerce-process','reconcile-express-analyses') THEN RAISE EXCEPTION 'Endpoint interdit'; END IF;
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name='commerce_project_url';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name='commerce_service_role';
  IF project_url IS NULL OR service_key IS NULL THEN RAISE WARNING 'Commerce : configurer Vault avant activation'; RETURN; END IF;
  PERFORM net.http_post(url:=project_url||'/functions/v1/'||endpoint,
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||service_key),
    body:='{}'::jsonb,timeout_milliseconds:=60000);
END $$;
REVOKE ALL ON FUNCTION private.commerce_tick(text) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE j record; BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname IN ('reconcile-express-analyses-5min','revoke-expired-wavacademy-daily','commerce-v3-minute','express-v3-minute') LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;
SELECT cron.schedule('commerce-v3-minute','* * * * *',$$SELECT private.commerce_tick('commerce-process')$$);
SELECT cron.schedule('express-v3-minute','* * * * *',$$SELECT private.commerce_tick('reconcile-express-analyses')$$);
