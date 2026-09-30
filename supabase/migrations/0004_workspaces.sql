-- Synchronisation de tout l'espace étudiant (2026-09-30) — voir lib/sync/workspace.ts.
--
-- Jusqu'ici, seul le profil était sauvegardé, à la main (table profiles).
-- Candidatures, lettres, préparations d'entretien, budgets et réponses visa
-- ne vivaient que dans le navigateur : changer de téléphone les faisait
-- perdre. Une ligne par étudiant, en JSON : { version, entries: { <clé>:
-- { value: <JSON brut>, updatedAt } } }, fusionnée côté navigateur (la version
-- la plus récente gagne, clé par clé).
--
-- À exécuter dans Supabase (SQL Editor) AVANT de déployer le code qui s'en
-- sert : sans cette table, la synchronisation affiche une erreur et le site
-- continue de fonctionner en local.

create table if not exists public.workspaces (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  -- Aligné sur MAX_WORKSPACE_BYTES (lib/sync/workspace.ts) : un espace réel
  -- (lettres comprises) pèse quelques dizaines de Ko.
  constraint workspaces_data_size check (pg_column_size(data) <= 524288)
);

alter table public.workspaces enable row level security;

-- Même principe que profiles : seul l'utilisateur connecté y a accès, et
-- seulement à sa propre ligne (jamais anon, jamais la ligne d'un autre).
grant select, insert, update, delete on public.workspaces to authenticated;

create policy "Un utilisateur lit son propre espace"
  on public.workspaces for select
  using (auth.uid() = id);

create policy "Un utilisateur crée son propre espace"
  on public.workspaces for insert
  with check (auth.uid() = id);

create policy "Un utilisateur met à jour son propre espace"
  on public.workspaces for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Un utilisateur supprime son propre espace"
  on public.workspaces for delete
  using (auth.uid() = id);

-- Reprise des profils déjà sauvegardés : chacun devient l'entrée « profil »
-- de l'espace, datée de sa dernière sauvegarde. Sans effet si l'espace existe déjà.
insert into public.workspaces (id, data, updated_at)
select
  p.id,
  jsonb_build_object(
    'version', 1,
    'entries', jsonb_build_object(
      'acadmatch:profile',
      jsonb_build_object(
        'value', p.data::text,
        'updatedAt', to_char(p.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    )
  ),
  p.updated_at
from public.profiles p
on conflict (id) do nothing;

-- Supprimer le compte supprime aussi l'espace (`on delete cascade`).
