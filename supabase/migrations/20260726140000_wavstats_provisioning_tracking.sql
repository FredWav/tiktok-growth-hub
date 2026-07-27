-- Suivi du provisioning WavStats sur les abonnements Wav Academy.
--
-- Sans ces colonnes, un échec de provisioning n'existe que dans les logs de la
-- fonction : impossible de lister les membres à créditer à la main, ni de savoir
-- qui a déjà reçu son lien d'activation. WavStats a explicitement demandé que
-- l'échec soit persisté quelque part de requêtable.
--
-- Symétrique de ce qui existe déjà pour Discord (discord_role_granted).

alter table public.wavacademy_subscriptions
  add column if not exists wavstats_provisioned_at timestamptz,
  add column if not exists wavstats_activation_url text,
  add column if not exists wavstats_error text;

comment on column public.wavacademy_subscriptions.wavstats_provisioned_at is
  'Horodatage du provisioning WavStats réussi. NULL = jamais provisionné (à créditer à la main).';
comment on column public.wavacademy_subscriptions.wavstats_activation_url is
  'Lien d''activation WavStats renvoyé par wavacademy-provision (usage unique, 7 jours).';
comment on column public.wavacademy_subscriptions.wavstats_error is
  'Dernière erreur de provisioning, après épuisement des tentatives. NULL si OK ou jamais tenté.';

-- Retrouver les membres à traiter manuellement.
create index if not exists idx_wavacademy_subscriptions_wavstats_pending
  on public.wavacademy_subscriptions (created_at desc)
  where wavstats_provisioned_at is null;
