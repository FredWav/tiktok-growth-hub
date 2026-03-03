
CREATE TABLE public.diagnostic_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  tiktok text,
  level text,
  objective text,
  blocker text,
  budget text,
  recommended_offer text,
  current_step integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diagnostic_leads"
  ON public.diagnostic_leads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert diagnostic_leads"
  ON public.diagnostic_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update diagnostic_leads"
  ON public.diagnostic_leads FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can select diagnostic_leads by id"
  ON public.diagnostic_leads FOR SELECT
  USING (true);

CREATE TRIGGER update_diagnostic_leads_updated_at
  BEFORE UPDATE ON public.diagnostic_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
