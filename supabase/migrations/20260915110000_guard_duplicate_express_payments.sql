-- Accélère le garde-fou du checkout : même email + même identifiant TikTok
-- déjà payé au cours des 24 dernières heures.
create index if not exists idx_express_consents_recent_paid_identity
  on public.express_purchase_consents
    (email, tiktok_username, checkout_mode, stripe_linked_at desc)
  where stripe_payment_status = 'paid';
