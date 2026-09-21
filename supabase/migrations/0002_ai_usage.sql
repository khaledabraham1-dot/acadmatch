-- Phase 6 (fondations IA transverses) — voir docs/ai-integration.md.
--
-- Journal d'usage IA, pour appliquer un quota journalier par utilisateur
-- (lib/ai/rateLimit.ts). Une ligne par appel IA effectué, jamais modifiée
-- après coup — un simple journal, pas un compteur mutable.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_id_created_at_idx
  on public.ai_usage (user_id, created_at);

alter table public.ai_usage enable row level security;

-- Toujours interrogée/écrite depuis une route serveur avec la session de
-- l'utilisateur (jamais depuis le navigateur ni avec la clé admin) — RLS
-- reste la garantie de dernier recours si ce n'était pas le cas.
create policy "Un utilisateur lit son propre usage IA"
  on public.ai_usage for select
  using (auth.uid() = user_id);

create policy "Un utilisateur enregistre son propre usage IA"
  on public.ai_usage for insert
  with check (auth.uid() = user_id);

-- Pas de policy update/delete : un journal d'usage ne se modifie ni ne se
-- supprime unitairement (la suppression du compte, cascade, s'en charge).
