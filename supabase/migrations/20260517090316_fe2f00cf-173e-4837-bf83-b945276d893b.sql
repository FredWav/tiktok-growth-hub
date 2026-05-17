-- Drop dependent RLS policy first
DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings;

-- 1. Decouple bookings from clients
ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;
ALTER TABLE IF EXISTS public.bookings DROP COLUMN IF EXISTS client_id;

-- 2. Drop dependent tables
DROP TABLE IF EXISTS public.client_observations CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.deliverables CASCADE;
DROP TABLE IF EXISTS public.vip_subscriptions CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;

-- 3. Drop the main table
DROP TABLE IF EXISTS public.clients CASCADE;

-- 4. Drop the now-orphan enums
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.client_offer CASCADE;
DROP TYPE IF EXISTS public.session_status CASCADE;
DROP TYPE IF EXISTS public.session_type CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.deliverable_status CASCADE;