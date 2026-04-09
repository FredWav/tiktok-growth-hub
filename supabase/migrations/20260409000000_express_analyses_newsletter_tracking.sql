-- Track newsletter subscription state on express analyses
-- Lets the admin see who asked for the newsletter and whether
-- the MailerLite subscription actually succeeded.

ALTER TABLE public.express_analyses
  ADD COLUMN IF NOT EXISTS newsletter_requested boolean NOT NULL DEFAULT false;

ALTER TABLE public.express_analyses
  ADD COLUMN IF NOT EXISTS newsletter_subscribed boolean NOT NULL DEFAULT false;
