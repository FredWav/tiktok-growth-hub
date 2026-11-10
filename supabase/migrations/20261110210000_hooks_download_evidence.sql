create table public.hooks_orders (
  stripe_session_id text primary key,
  pack_code text not null check (pack_code in ('hooks_100', 'hooks_250', 'hooks_500', 'hooks_850')),
  email text not null,
  paid_at timestamptz not null,
  consent_version text not null,
  checkout_consent_text text not null,
  consent_recorded_at timestamptz not null default now(),
  access_token uuid not null unique default gen_random_uuid(),
  first_download_at timestamptz,
  first_download_file text,
  check ((first_download_at is null) = (first_download_file is null))
);

alter table public.hooks_orders enable row level security;
revoke all on table public.hooks_orders from public, anon, authenticated;
grant select, insert, update on table public.hooks_orders to service_role;

create function public.register_hooks_download(p_access_token uuid, p_file text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with recorded as (
    update public.hooks_orders as orders
    set first_download_at = coalesce(orders.first_download_at, clock_timestamp()),
        first_download_file = coalesce(orders.first_download_file, p_file)
    where orders.access_token = p_access_token
      and orders.paid_at + interval '8760 hours' > now()
      and exists (
        select 1 from public.commerce_mail as mail
        where mail.dedupe_key = 'hooks:' || orders.stripe_session_id
          and mail.state = 'sent' and mail.sent_at is not null
      )
      and not exists (
        select 1 from public.withdrawal_requests as request
        where request.offer = 'hooks_packs'
          and request.order_reference = orders.stripe_session_id
          and lower(request.email) = lower(orders.email)
          and (
            request.status in ('accepted', 'completed')
            or (orders.first_download_at is null and request.status in ('received', 'under_review'))
          )
      )
    returning 1
  )
  select exists (select 1 from recorded);
$$;

revoke execute on function public.register_hooks_download(uuid, text) from public, anon, authenticated;
grant execute on function public.register_hooks_download(uuid, text) to service_role;
