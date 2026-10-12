-- Le cron vidéo dédié ne peut pas s'authentifier sur l'hébergement (Vault inaccessible).
-- Les Analyses Vidéo sont désormais traitées par le passage du rattrapage Express
-- (reconcile-express-analyses), déjà planifié et authentifié : plus aucun secret en base.
DO $$ DECLARE j record; BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'video-analysis-minute' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Analyse vidéo : tâche cron non retirée (%)', SQLERRM;
END $$;
DROP FUNCTION IF EXISTS private.video_analysis_tick();
