
-- Create trusted_clients table
CREATE TABLE public.trusted_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  tiktok_url text,
  offers text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_clients ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage trusted_clients"
  ON public.trusted_clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public read access (displayed on public pages)
CREATE POLICY "Anyone can view active trusted_clients"
  ON public.trusted_clients FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create public storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('trusted-avatars', 'trusted-avatars', true);

-- Storage policies: admin can upload/delete
CREATE POLICY "Admins can upload trusted avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trusted-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trusted avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'trusted-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trusted avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trusted-avatars' AND public.has_role(auth.uid(), 'admin'));

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view trusted avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'trusted-avatars');
