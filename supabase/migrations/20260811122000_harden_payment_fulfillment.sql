-- Harden payment fulfilment without rewriting historical migrations.
-- New Academy purchases keep the exact accepted wording and only a keyed HMAC
-- fingerprint; the legacy clear-text IP/user-agent columns remain nullable for
-- backwards compatibility but are no longer written by the application.

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

-- A conditional state transition in stripe-webhook makes activation-email
-- delivery resumable and prevents duplicate emails on concurrent Stripe events.
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

-- Used as a short-lived idempotency lock before calling WavStats. A stale lock
-- can be reclaimed after an interrupted Edge Function invocation.
alter table public.express_analyses
  add column if not exists launch_started_at timestamptz;
