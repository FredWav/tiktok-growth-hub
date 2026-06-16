
-- ============ diagnostic_leads ============
DROP POLICY IF EXISTS "Anyone can select diagnostic_leads by id" ON public.diagnostic_leads;
DROP POLICY IF EXISTS "Anyone can update diagnostic_leads" ON public.diagnostic_leads;

CREATE OR REPLACE FUNCTION public.upsert_diagnostic_lead(
  p_id uuid,
  p_fields jsonb,
  p_current_step integer,
  p_completed boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.diagnostic_leads (
      first_name, last_name, email, tiktok, level, objective, blocker, budget,
      recommended_offer, origin_source, conversion_trigger, posthog_id,
      follower_since, temps, current_step, completed
    )
    VALUES (
      p_fields->>'first_name', p_fields->>'last_name', p_fields->>'email',
      p_fields->>'tiktok', p_fields->>'level', p_fields->>'objective',
      p_fields->>'blocker', p_fields->>'budget', p_fields->>'recommended_offer',
      p_fields->>'origin_source', p_fields->>'conversion_trigger',
      p_fields->>'posthog_id', p_fields->>'follower_since', p_fields->>'temps',
      COALESCE(p_current_step, 0), COALESCE(p_completed, false)
    )
    RETURNING id INTO v_id;
    RETURN v_id;
  ELSE
    UPDATE public.diagnostic_leads
    SET
      first_name = COALESCE(p_fields->>'first_name', first_name),
      last_name = COALESCE(p_fields->>'last_name', last_name),
      email = COALESCE(p_fields->>'email', email),
      tiktok = COALESCE(p_fields->>'tiktok', tiktok),
      level = COALESCE(p_fields->>'level', level),
      objective = COALESCE(p_fields->>'objective', objective),
      blocker = COALESCE(p_fields->>'blocker', blocker),
      budget = COALESCE(p_fields->>'budget', budget),
      recommended_offer = COALESCE(p_fields->>'recommended_offer', recommended_offer),
      origin_source = COALESCE(p_fields->>'origin_source', origin_source),
      conversion_trigger = COALESCE(p_fields->>'conversion_trigger', conversion_trigger),
      posthog_id = COALESCE(p_fields->>'posthog_id', posthog_id),
      follower_since = COALESCE(p_fields->>'follower_since', follower_since),
      temps = COALESCE(p_fields->>'temps', temps),
      current_step = COALESCE(p_current_step, current_step),
      completed = COALESCE(p_completed, completed),
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_diagnostic_lead(uuid, jsonb, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_diagnostic_lead(uuid, jsonb, integer, boolean) TO anon, authenticated;

-- ============ express_analyses ============
-- Read by stripe_session_id through a SECURITY DEFINER function. Direct SELECT stays admin-only.
CREATE OR REPLACE FUNCTION public.get_express_analysis_by_session(p_session_id text)
RETURNS public.express_analyses
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.express_analyses
  WHERE stripe_session_id = p_session_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_express_analysis_by_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_express_analysis_by_session(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can select express_analyses by session_id" ON public.express_analyses;

-- ============ deep_links ============
DROP POLICY IF EXISTS "Anyone can increment clicks" ON public.deep_links;

CREATE OR REPLACE FUNCTION public.increment_deep_link_clicks(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.deep_links SET clicks_count = clicks_count + 1 WHERE slug = p_slug;
$$;

REVOKE ALL ON FUNCTION public.increment_deep_link_clicks(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_deep_link_clicks(text) TO anon, authenticated;

-- ============ page_views ============
DROP POLICY IF EXISTS "Anyone can update own page_view duration" ON public.page_views;

CREATE OR REPLACE FUNCTION public.update_page_view_duration(p_id uuid, p_duration integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.page_views
  SET duration_seconds = GREATEST(0, LEAST(p_duration, 86400))
  WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.update_page_view_duration(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_page_view_duration(uuid, integer) TO anon, authenticated;

-- ============ SECURITY DEFINER hardening ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============ Storage: prevent listing of public buckets ============
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read trusted-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read client-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view trusted-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view client-screenshots" ON storage.objects;

-- Allow direct object access by name (required for public URLs) without enabling LIST.
CREATE POLICY "Public objects readable by name (trusted-avatars)"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'trusted-avatars' AND name IS NOT NULL);

CREATE POLICY "Public objects readable by name (client-screenshots)"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'client-screenshots' AND name IS NOT NULL);
