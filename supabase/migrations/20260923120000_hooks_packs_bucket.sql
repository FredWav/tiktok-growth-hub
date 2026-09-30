-- Bucket privé des packs de hooks (PDF + tableur).
-- Aucune policy : seul stripe-webhook (clé service) y accède, pour générer
-- les liens signés envoyés au client après paiement.
insert into storage.buckets (id, name, public)
values ('hooks-packs', 'hooks-packs', false)
on conflict (id) do nothing;
