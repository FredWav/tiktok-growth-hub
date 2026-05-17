-- Drop admin tables that are no longer used after removing the
-- Clients / Sessions / Deliverables / Templates / Diagnostics admin sections.
--
-- IMPORTANT: this migration is DESTRUCTIVE. Take a database dump before applying.
--
-- Tables kept (still used elsewhere):
--   - diagnostic_leads        (Marketing funnel stats + public /start funnel)
--   - client_screenshots      (public testimonials)
--   - bookings                (Marketing CA + payments) — client_id FK is dropped below
--   - profiles, user_roles    (auth)
--   - wav_premium_applications, express_analyses, page_views, deep_links, trusted_clients

-- 1. Decouple bookings from clients (table is kept, FK + column are removed)
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;
ALTER TABLE IF EXISTS bookings DROP COLUMN IF EXISTS client_id;

-- 2. Drop dependent tables (FK CASCADE handles the rest)
DROP TABLE IF EXISTS client_observations CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS vip_subscriptions CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;

-- 3. Drop the main table
DROP TABLE IF EXISTS clients CASCADE;

-- 4. Drop the now-orphan enums (created by the initial migration)
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS client_offer CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS deliverable_status CASCADE;
