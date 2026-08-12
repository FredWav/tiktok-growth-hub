-- Registre des demandes de rétractation déposées via la fonctionnalité en ligne.
-- Les écritures passent exclusivement par l'Edge Function (service role).

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  customer_name text not null,
  email text not null,
  order_reference text not null,
  offer text not null check (offer in ('analyse_express', 'wav_academy', 'wav_premium', 'other')),
  order_date date,
  message text,
  declaration_version text not null,
  declaration_text text not null,
  status text not null default 'received'
    check (status in ('received', 'under_review', 'accepted', 'rejected', 'completed')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  technical_fingerprint_hash text,
  acknowledgement_status text not null default 'pending'
    check (acknowledgement_status in ('pending', 'sent', 'failed')),
  notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed')),
  email_delivery_attempts integer not null default 0 check (email_delivery_attempts >= 0),
  last_delivery_attempt_at timestamptz,
  acknowledgement_sent_at timestamptz,
  notification_sent_at timestamptz,
  email_delivery_error text
);

create index if not exists idx_withdrawal_requests_email_submitted
  on public.withdrawal_requests (email, submitted_at desc);

create index if not exists idx_withdrawal_requests_fingerprint_submitted
  on public.withdrawal_requests (technical_fingerprint_hash, submitted_at desc);

create index if not exists idx_withdrawal_requests_status
  on public.withdrawal_requests (status, submitted_at desc);

-- File de reprise administrative : permet d'identifier rapidement les accusés
-- ou notifications encore en attente/échec, puis de les relancer par référence.
create index if not exists idx_withdrawal_requests_delivery_outbox
  on public.withdrawal_requests (
    acknowledgement_status,
    notification_status,
    last_delivery_attempt_at
  );

alter table public.withdrawal_requests enable row level security;

create policy "Admins can manage withdrawal requests"
  on public.withdrawal_requests
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
