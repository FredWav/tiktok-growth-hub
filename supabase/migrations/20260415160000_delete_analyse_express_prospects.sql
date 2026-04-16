-- Remove all prospect entries auto-created by the Analyse Express flow.
-- These are users who used the free scan tool — not real clients or leads.
-- Conditions: no linked auth account (user_id IS NULL), status still 'prospect',
-- and origin_source is 'analyse_express'.
DELETE FROM public.clients
WHERE user_id IS NULL
  AND status = 'prospect'
  AND origin_source = 'analyse_express';
