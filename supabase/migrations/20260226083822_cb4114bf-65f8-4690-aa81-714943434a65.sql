
CREATE TABLE public.wav_premium_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  tiktok_username TEXT,
  current_level TEXT NOT NULL,
  blockers TEXT NOT NULL,
  goals TEXT NOT NULL,
  budget_confirmed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.wav_premium_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (public form, no auth required)
CREATE POLICY "Anyone can insert applications"
ON public.wav_premium_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view all applications"
ON public.wav_premium_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage (update/delete) applications
CREATE POLICY "Admins can manage applications"
ON public.wav_premium_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
