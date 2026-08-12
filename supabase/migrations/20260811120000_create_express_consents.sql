-- Preuve des consentements contractuels donnés avant le paiement Analyse Express.
-- Le client_reference_id envoyé à Stripe est express_analysis_id ; le webhook
-- renseigne ensuite stripe_session_id afin de réunir preuve et paiement.

create table if not exists public.express_purchase_consents (
  id uuid primary key default gen_random_uuid(),
  express_analysis_id uuid not null unique
    references public.express_analyses(id) on delete restrict,
  email text not null,
  tiktok_username text not null,
  consent_cgv boolean not null check (consent_cgv),
  consent_immediate_delivery boolean not null check (consent_immediate_delivery),
  cgv_version text not null,
  immediate_delivery_notice_version text not null,
  cgv_accepted_text text not null,
  immediate_delivery_accepted_text text not null,
  checkout_mode text not null default 'live' check (checkout_mode in ('live', 'test')),
  accepted_at timestamptz not null default now(),
  technical_fingerprint_hash text,
  stripe_session_id text unique,
  stripe_payment_status text,
  stripe_linked_at timestamptz,
  confirmation_email text,
  confirmation_sent_at timestamptz,
  confirmation_delivery_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_express_purchase_consents_email
  on public.express_purchase_consents (email);

create index if not exists idx_express_purchase_consents_accepted_at
  on public.express_purchase_consents (accepted_at desc);

create index if not exists idx_express_purchase_consents_fingerprint
  on public.express_purchase_consents (technical_fingerprint_hash, accepted_at desc);

alter table public.express_purchase_consents enable row level security;

create policy "Admins can manage express consent evidence"
  on public.express_purchase_consents
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
