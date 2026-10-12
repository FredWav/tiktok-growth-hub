-- Le tick vidéo s'authentifie désormais par l'en-tête x-cron-secret, comme le
-- rattrapage Express : la clé serveur n'est pas disponible dans Vault sur l'hébergement.
--
-- La valeur de RECONCILE_CRON_SECRET n'est jamais écrite dans le dépôt. Elle doit être
-- enregistrée une fois dans Vault, hors migration :
--   select vault.create_secret('<valeur de RECONCILE_CRON_SECRET>', 'reconcile_cron_secret');
-- Tant qu'elle est absente, le tick ne fait aucun appel et émet un avertissement.
CREATE OR REPLACE FUNCTION private.video_analysis_tick() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE project_url text; cron_secret text;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name='commerce_project_url';
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name='reconcile_cron_secret';
  -- L'URL du projet n'est pas un secret : repli sur sa valeur publique.
  project_url := coalesce(project_url, 'https://rdpykyvqcckxpygwblxf.supabase.co');
  IF cron_secret IS NULL THEN
    RAISE WARNING 'Analyse vidéo : secret Vault reconcile_cron_secret absent, tick ignoré';
    RETURN;
  END IF;
  PERFORM net.http_post(url:=project_url||'/functions/v1/reconcile-video-analyses',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',cron_secret),
    body:='{}'::jsonb,timeout_milliseconds:=60000);
END $$;
REVOKE ALL ON FUNCTION private.video_analysis_tick() FROM PUBLIC, anon, authenticated;
