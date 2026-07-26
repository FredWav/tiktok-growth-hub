-- ============================================================================
-- RPC pour les écritures publiques + alignement du repo sur la base déployée
--
-- CONTEXTE. Les migrations de ce repo décrivaient des policies très ouvertes
-- (SELECT/UPDATE publics sur diagnostic_leads, SELECT public sur
-- express_analyses, UPDATE complet sur deep_links). La base réellement
-- déployée est BEAUCOUP plus stricte : ces policies n'y existent pas ou plus.
-- Le repo avait donc divergé du réel.
--
-- CONSÉQUENCE, et c'est le vrai sujet : du code front appelle des opérations
-- que la base refuse, en silence.
--
--   1. diagnostic_leads — INSERT est autorisé, mais il n'y a NI SELECT NI UPDATE.
--      Or le tunnel /start fait `insert(...).select("id").single()` : le
--      RETURNING est filtré par RLS, `.single()` échoue, l'id n'est jamais
--      mémorisé — et chaque étape suivante refait un INSERT. Résultat : une
--      ligne orpheline par étape au lieu d'un lead complet.
--
--   2. deep_links — SELECT par slug est autorisé, mais pas UPDATE. Le compteur
--      de clics de /go/:slug ne s'incrémente donc jamais.
--
-- SOLUTION. Deux fonctions SECURITY DEFINER, étroites et sur liste blanche :
-- elles font le travail côté serveur sans rouvrir les tables. La base reste
-- fermée, et les deux flux publics refonctionnent.
--
-- express_analyses n'est volontairement PAS traité ici : côté client, la page
-- de résultat passe par l'edge function express-analysis-status (design voulu).
--
-- Idempotent : rejouable sans erreur.
-- ============================================================================

-- ── 1. deep_links : incrément atomique du compteur de clics ────────────────
-- Corrige au passage une race condition de l'ancien code, qui lisait
-- clicks_count puis réécrivait clicks_count + 1 (deux clics simultanés = un
-- seul compté). Ici, l'incrément est fait par la base.
create or replace function public.increment_deep_link_click(p_slug text)
returns table (youtube_id text)
language sql
security definer
set search_path = public
as $$
  update public.deep_links
     set clicks_count = clicks_count + 1
   where slug = p_slug
  returning deep_links.youtube_id;
$$;

revoke all on function public.increment_deep_link_click(text) from public;
grant execute on function public.increment_deep_link_click(text) to anon, authenticated;

-- ── 2. diagnostic_leads : création + mise à jour au fil des étapes ─────────
-- Le tunnel n'a jamais besoin de LIRE la table : il lui faut seulement l'id de
-- la ligne qu'il vient de créer. Cette fonction le rend, et n'accepte en
-- écriture que les colonnes listées ci-dessous — rien d'autre ne peut être
-- écrit, même en modifiant l'appel côté navigateur.
create or replace function public.upsert_diagnostic_lead(
  p_id uuid,
  p_fields jsonb,
  p_step integer,
  p_completed boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_allowed text[] := array[
    'first_name', 'last_name', 'email', 'tiktok',
    'level', 'objective', 'budget', 'temps', 'blocker',
    'recommended_offer', 'origin_source', 'follower_since',
    'conversion_trigger', 'posthog_id'
  ];
  v_clean jsonb;
begin
  -- Ne conserve que les clés autorisées.
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    into v_clean
    from jsonb_each(coalesce(p_fields, '{}'::jsonb))
   where key = any(v_allowed);

  if p_id is null then
    insert into public.diagnostic_leads (current_step, completed)
    values (coalesce(p_step, 0), coalesce(p_completed, false))
    returning id into v_id;
  else
    v_id := p_id;
  end if;

  update public.diagnostic_leads d
     set first_name         = coalesce(v_clean->>'first_name', d.first_name),
         last_name          = coalesce(v_clean->>'last_name', d.last_name),
         email              = coalesce(v_clean->>'email', d.email),
         tiktok             = coalesce(v_clean->>'tiktok', d.tiktok),
         level              = coalesce(v_clean->>'level', d.level),
         objective          = coalesce(v_clean->>'objective', d.objective),
         budget             = coalesce(v_clean->>'budget', d.budget),
         temps              = coalesce(v_clean->>'temps', d.temps),
         blocker            = coalesce(v_clean->>'blocker', d.blocker),
         recommended_offer  = coalesce(v_clean->>'recommended_offer', d.recommended_offer),
         origin_source      = coalesce(v_clean->>'origin_source', d.origin_source),
         follower_since     = coalesce(v_clean->>'follower_since', d.follower_since),
         conversion_trigger = coalesce(v_clean->>'conversion_trigger', d.conversion_trigger),
         posthog_id         = coalesce(v_clean->>'posthog_id', d.posthog_id),
         current_step       = greatest(coalesce(p_step, d.current_step), d.current_step),
         completed          = d.completed or coalesce(p_completed, false),
         updated_at         = now()
   where d.id = v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_diagnostic_lead(uuid, jsonb, integer, boolean) from public;
grant execute on function public.upsert_diagnostic_lead(uuid, jsonb, integer, boolean) to anon, authenticated;

-- ── 3. Alignement du repo sur la base déployée ─────────────────────────────
-- Ces policies larges figurent dans d'anciennes migrations mais n'existent pas
-- sur la base réelle. Les supprimer ici évite qu'un futur `db reset` ou un
-- nouvel environnement ne les recrée par erreur. No-op sur la prod actuelle.
drop policy if exists "Anyone can increment clicks" on public.deep_links;
drop policy if exists "Anyone can select express_analyses by session_id" on public.express_analyses;
drop policy if exists "Anyone can select diagnostic_leads by id" on public.diagnostic_leads;
drop policy if exists "Anyone can update diagnostic_leads" on public.diagnostic_leads;
