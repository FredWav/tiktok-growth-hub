CREATE TABLE public.deep_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  youtube_id text NOT NULL,
  title text NOT NULL,
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.deep_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deep_links"
ON public.deep_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can select deep_links by slug"
ON public.deep_links FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can increment clicks"
ON public.deep_links FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);