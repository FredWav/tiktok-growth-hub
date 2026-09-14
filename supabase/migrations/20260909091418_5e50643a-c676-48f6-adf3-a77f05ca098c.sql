ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS result_email_sent_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS support_requested_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS refund_reference text;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS report_version text NOT NULL DEFAULT 'legacy';
ALTER TABLE public.express_analyses ALTER COLUMN report_version SET DEFAULT 'legacy';