-- 20260811120000_create_express_consents.sql
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

grant select, insert, update, delete on public.express_purchase_consents to authenticated;
grant all on public.express_purchase_consents to service_role;

alter table public.express_purchase_consents enable row level security;

create policy "Admins can manage express consent evidence"
  on public.express_purchase_consents
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 20260811121000_create_withdrawal_requests.sql
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
create index if not exists idx_withdrawal_requests_delivery_outbox
  on public.withdrawal_requests (
    acknowledgement_status,
    notification_status,
    last_delivery_attempt_at
  );

grant select, insert, update, delete on public.withdrawal_requests to authenticated;
grant all on public.withdrawal_requests to service_role;

alter table public.withdrawal_requests enable row level security;

create policy "Admins can manage withdrawal requests"
  on public.withdrawal_requests
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger update_withdrawal_requests_updated_at
  before update on public.withdrawal_requests
  for each row execute function public.update_updated_at_column();

-- 20260811122000_harden_payment_fulfillment.sql
alter table public.wavacademy_consents
  add column if not exists accepted_at timestamptz,
  add column if not exists cgv_accepted_text text,
  add column if not exists immediate_delivery_notice_version text,
  add column if not exists immediate_delivery_accepted_text text,
  add column if not exists technical_fingerprint_hash text;

update public.wavacademy_consents
set accepted_at = created_at
where accepted_at is null;

alter table public.wavacademy_consents
  alter column accepted_at set default now(),
  alter column accepted_at set not null;

comment on column public.wavacademy_consents.ip_address is
  'Deprecated: legacy evidence only. New writes must use technical_fingerprint_hash.';
comment on column public.wavacademy_consents.user_agent is
  'Deprecated: legacy evidence only. New writes must use technical_fingerprint_hash.';
comment on column public.wavacademy_consents.technical_fingerprint_hash is
  'HMAC-SHA-256 of transient IP and user-agent values; raw values are not written for new purchases.';

create index if not exists idx_wavacademy_consents_fingerprint
  on public.wavacademy_consents (technical_fingerprint_hash, accepted_at desc);

alter table public.wavacademy_subscriptions
  add column if not exists activation_email_status text not null default 'pending',
  add column if not exists activation_email_attempted_at timestamptz,
  add column if not exists activation_email_sent_at timestamptz,
  add column if not exists activation_email_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wavacademy_activation_email_status_check'
      and conrelid = 'public.wavacademy_subscriptions'::regclass
  ) then
    alter table public.wavacademy_subscriptions
      add constraint wavacademy_activation_email_status_check
      check (activation_email_status in ('pending', 'sending', 'failed', 'sent'));
  end if;
end $$;

alter table public.express_analyses
  add column if not exists launch_started_at timestamptz;

-- 20260811123000_create_newsletter_opt_in_requests.sql
create table if not exists public.newsletter_opt_in_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  source text not null check (source in ('newsletter', 'analyse_express')),
  source_page text,
  consent_accepted boolean not null check (consent_accepted),
  consent_version text not null,
  consent_text text not null,
  requested_at timestamptz not null default now(),
  technical_fingerprint_hash text,
  mailerlite_subscriber_id text,
  mailerlite_status text,
  mailerlite_request_status text not null default 'pending'
    check (mailerlite_request_status in ('pending', 'submitted', 'failed')),
  mailerlite_request_error text
);

create index if not exists idx_newsletter_opt_in_email_requested
  on public.newsletter_opt_in_requests (email, requested_at desc);
create index if not exists idx_newsletter_opt_in_fingerprint_requested
  on public.newsletter_opt_in_requests (technical_fingerprint_hash, requested_at desc);

grant select, insert, update, delete on public.newsletter_opt_in_requests to authenticated;
grant all on public.newsletter_opt_in_requests to service_role;

alter table public.newsletter_opt_in_requests enable row level security;

create policy "Admins can manage newsletter opt-in evidence"
  on public.newsletter_opt_in_requests
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));