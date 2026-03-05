
-- Create page_views table for analytics tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  session_id text NOT NULL,
  visitor_id text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer DEFAULT 0
);

-- RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert page_views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read page_views"
  ON public.page_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage
CREATE POLICY "Admins can manage page_views"
  ON public.page_views FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous updates for duration tracking (only own session)
CREATE POLICY "Anyone can update own page_view duration"
  ON public.page_views FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Index for common queries
CREATE INDEX idx_page_views_entered_at ON public.page_views (entered_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);
