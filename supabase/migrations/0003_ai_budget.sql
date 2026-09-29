-- Audit pré-lancement (2026-09-29) — voir docs/ai-integration.md, « Budget IA ».
--
-- Remplace le quota « compter puis insérer » de lib/ai/rateLimit.ts, que des
-- requêtes simultanées contournaient (toutes lisaient le même compte avant
-- qu'aucune n'insère), par une réservation atomique qui protège aussi un
-- BUDGET GLOBAL en dollars : créer des dizaines de comptes gratuits ne
-- permet plus de dépasser la dépense quotidienne fixée.
--
-- À exécuter une fois dans le SQL Editor Supabase, après 0001 et 0002.

-- Coût de chaque appel : d'abord une estimation haute réservée avant
-- l'appel, puis le coût réel calculé depuis l'usage renvoyé par l'API.
alter table public.ai_usage add column if not exists cost_usd numeric(10, 5) not null default 0;

-- Plus aucune écriture depuis le navigateur : seule la fonction ci-dessous
-- (appelée par le serveur avec la clé secrète) enregistre un appel. Sinon un
-- utilisateur pourrait remplir le journal, ou simplement le lire pour sonder
-- les limites. La lecture de son propre usage reste permise.
revoke insert on public.ai_usage from authenticated;
drop policy if exists "Un utilisateur enregistre son propre usage IA" on public.ai_usage;

create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at);

-- Réserve un appel IA si les trois limites le permettent, sinon indique
-- laquelle bloque. Un verrou transactionnel sérialise les réservations :
-- deux requêtes simultanées ne peuvent plus lire le même état.
create or replace function public.reserve_ai_call(
  p_user_id uuid,
  p_feature text,
  p_limited_features text[],
  p_user_daily_limit integer,
  p_estimated_cost_usd numeric,
  p_global_daily_budget_usd numeric
) returns table (allowed boolean, reason text, usage_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  user_calls integer;
  spent numeric;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('acadmatch_ai_budget'));

  select count(*) into user_calls
    from ai_usage
    where user_id = p_user_id and created_at >= day_start and feature = any (p_limited_features);
  if user_calls >= p_user_daily_limit then
    return query select false, 'quota_exceeded'::text, null::uuid;
    return;
  end if;

  select coalesce(sum(cost_usd), 0) into spent from ai_usage where created_at >= day_start;
  if spent + p_estimated_cost_usd > p_global_daily_budget_usd then
    return query select false, 'budget_exhausted'::text, null::uuid;
    return;
  end if;

  insert into ai_usage (user_id, feature, cost_usd)
    values (p_user_id, p_feature, p_estimated_cost_usd)
    returning id into new_id;
  return query select true, null::text, new_id;
end;
$$;

-- Remplace l'estimation réservée par le coût réel (0 si l'appel a échoué
-- avant d'être facturé).
create or replace function public.settle_ai_call(p_usage_id uuid, p_cost_usd numeric)
returns void
language sql
security definer
set search_path = public
as $$
  update ai_usage set cost_usd = greatest(p_cost_usd, 0) where id = p_usage_id;
$$;

-- Réservées au serveur (clé secrète) : ni un visiteur ni un utilisateur
-- connecté ne peut les appeler, même via l'API REST de Supabase.
revoke all on function public.reserve_ai_call(uuid, text, text[], integer, numeric, numeric) from public, anon, authenticated;
revoke all on function public.settle_ai_call(uuid, numeric) from public, anon, authenticated;
grant execute on function public.reserve_ai_call(uuid, text, text[], integer, numeric, numeric) to service_role;
grant execute on function public.settle_ai_call(uuid, numeric) to service_role;

-- Profil synchronisé : écrit directement depuis le navigateur, donc borné
-- ici (un profil réel pèse quelques Ko ; 64 Ko laisse une large marge).
alter table public.profiles drop constraint if exists profiles_data_size;
alter table public.profiles add constraint profiles_data_size check (pg_column_size(data) <= 65536);
