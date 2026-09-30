DROP POLICY IF EXISTS "Anyone can insert oneshot_submissions" ON public.oneshot_submissions;
DROP POLICY IF EXISTS "Anyone can insert diagnostic_leads" ON public.diagnostic_leads;

DROP POLICY IF EXISTS "Anyone can insert page_views" ON public.page_views;
CREATE POLICY "Anyone can insert valid page_views" ON public.page_views
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(path) BETWEEN 1 AND 500 AND left(path,1) = '/'
  AND length(session_id) BETWEEN 1 AND 100
  AND (visitor_id IS NULL OR length(visitor_id) <= 100)
  AND (referrer IS NULL OR length(referrer) <= 2000)
  AND (utm_source IS NULL OR length(utm_source) <= 200)
  AND (utm_medium IS NULL OR length(utm_medium) <= 200)
  AND (utm_campaign IS NULL OR length(utm_campaign) <= 200)
  AND duration_seconds IS NULL
);

CREATE OR REPLACE FUNCTION public.increment_deep_link_click(p_slug text)
RETURNS TABLE(youtube_id text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.deep_links SET clicks_count = clicks_count + 1
  WHERE slug = p_slug RETURNING deep_links.youtube_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_deep_link_click(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can select deep_links by slug" ON public.deep_links;