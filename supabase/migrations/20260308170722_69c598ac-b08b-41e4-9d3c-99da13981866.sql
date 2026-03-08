
-- Create client_screenshots table
CREATE TABLE public.client_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  client_name text,
  caption text,
  offer text[] NOT NULL DEFAULT '{}'::text[],
  display_locations text[] NOT NULL DEFAULT '{}'::text[],
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_screenshots ENABLE ROW LEVEL SECURITY;

-- Public read for active screenshots
CREATE POLICY "Anyone can view active client_screenshots"
ON public.client_screenshots FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage client_screenshots"
ON public.client_screenshots FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-screenshots', 'client-screenshots', true);

-- Storage policies: anyone can view, admin can upload/delete
CREATE POLICY "Anyone can view client-screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-screenshots');

CREATE POLICY "Admins can upload client-screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete client-screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));
