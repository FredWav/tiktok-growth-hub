-- Preuve serveur des demandes d'inscription marketing envoyees a MailerLite.
-- Seule l'Edge Function ecrit dans cette table avec la service role.

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

alter table public.newsletter_opt_in_requests enable row level security;

create policy "Admins can manage newsletter opt-in evidence"
  on public.newsletter_opt_in_requests
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
