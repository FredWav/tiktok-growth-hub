
-- 1. Add email column to express_analyses
ALTER TABLE public.express_analyses ADD COLUMN IF NOT EXISTS email text;

-- 2. Make user_id nullable in clients for prospect support
ALTER TABLE public.clients ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add email and name columns to clients for prospect tracking
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tiktok text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS origin_source text;
