-- The TikTok canonical account identifier (uniqueId) is always lowercase, and the
-- WavStats API matches on it exactly: an analysis stored as '@Evangymfact' failed
-- where 'evangymfact' succeeded. Entry points now normalize on write; this brings
-- the existing rows to the same canonical form so admin retries stop replaying the
-- original failure.
UPDATE express_analyses
SET tiktok_username = lower(tiktok_username)
WHERE tiktok_username IS DISTINCT FROM lower(tiktok_username);

-- express_purchase_consents is a proof-of-consent journal: its rows record what the
-- customer actually typed and are intentionally left untouched.
