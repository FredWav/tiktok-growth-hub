-- Analyse Vidéo TikTok : commande à l'unité, séparée de express_analyses.
-- Le rattrapage Express ne voit jamais ces lignes (normaliseur « compte » différent).
CREATE TABLE IF NOT EXISTS public.video_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tiktok_url text NOT NULL,
  video_id text NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN (
    'awaiting_payment','paid','starting','processing','completed','delivered','failed','refunded'
  )),
  checkout_mode text NOT NULL CHECK (checkout_mode IN ('live','test')),
  stripe_session_id text UNIQUE,
  paid_at timestamptz,
  job_id text UNIQUE,
  launch_attempts integer NOT NULL DEFAULT 0,
  processing_started_at timestamptz,
  result_raw jsonb,
  report_data jsonb,
  report_version text NOT NULL DEFAULT 'video-v1',
  report_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  completed_at timestamptz,
  result_email_queued_at timestamptz,
  report_viewed_at timestamptz,
  pdf_downloaded_at timestamptz,
  error_message text,
  support_requested_at timestamptz,
  -- Preuve des consentements (même contenu que express_purchase_consents).
  cgv_version text NOT NULL,
  immediate_delivery_notice_version text NOT NULL,
  cgv_accepted_text text NOT NULL,
  immediate_delivery_accepted_text text NOT NULL,
  accepted_at timestamptz NOT NULL,
  technical_fingerprint_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_analyses_queue
  ON public.video_analyses (status, updated_at)
  WHERE status IN ('paid','starting','processing','completed');
CREATE INDEX IF NOT EXISTS idx_video_analyses_recent_paid
  ON public.video_analyses (email, video_id, checkout_mode, paid_at DESC)
  WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_analyses_email_created
  ON public.video_analyses (email, created_at DESC);

ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_read ON public.video_analyses;
CREATE POLICY admin_read ON public.video_analyses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
REVOKE ALL ON public.video_analyses FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.video_analyses FROM authenticated;
GRANT SELECT ON public.video_analyses TO authenticated;
GRANT ALL ON public.video_analyses TO service_role;

-- Tick dédié : mêmes secrets Vault que le commerce, sans modifier private.commerce_tick.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.video_analysis_tick() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE project_url text; service_key text;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name='commerce_project_url';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name='commerce_service_role';
  IF project_url IS NULL OR service_key IS NULL THEN RAISE WARNING 'Analyse vidéo : configurer Vault avant activation'; RETURN; END IF;
  PERFORM net.http_post(url:=project_url||'/functions/v1/reconcile-video-analyses',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||service_key),
    body:='{}'::jsonb,timeout_milliseconds:=60000);
END $$;
REVOKE ALL ON FUNCTION private.video_analysis_tick() FROM PUBLIC, anon, authenticated;

DO $$ DECLARE j record; BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'video-analysis-minute' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;
SELECT cron.schedule('video-analysis-minute', '* * * * *', $$SELECT private.video_analysis_tick()$$);
