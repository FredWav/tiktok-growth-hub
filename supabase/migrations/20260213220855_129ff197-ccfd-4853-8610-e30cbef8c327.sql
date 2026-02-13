
-- Drop the overly permissive policy
DROP POLICY "Service role can insert vip_subscriptions" ON public.vip_subscriptions;
