
-- Create vip_subscriptions table
CREATE TABLE public.vip_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  stripe_session_id text,
  duration_months integer NOT NULL CHECK (duration_months IN (3, 6, 12)),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  discord_user_id text,
  discord_role_granted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all vip_subscriptions"
ON public.vip_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clients can view their own
CREATE POLICY "Clients can view their own vip_subscriptions"
ON public.vip_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert (for webhook)
CREATE POLICY "Service role can insert vip_subscriptions"
ON public.vip_subscriptions
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_vip_subscriptions_updated_at
BEFORE UPDATE ON public.vip_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
