-- Phase 5 (comptes utilisateurs, fondations) — voir docs/accounts-setup.md.
--
-- Une seule table, volontairement : le compte ne synchronise pour l'instant
-- que le StudentProfile (types/index.ts), pas encore les candidatures,
-- documents ou CV (phases ultérieures de la roadmap, qui s'appuieront sur
-- cette fondation). `data` reste un blob JSON plutôt que des colonnes
-- structurées : il reflète directement la forme de StudentProfile côté
-- TypeScript, donc aucune migration de schéma n'est nécessaire quand ce type
-- évolue (comme il l'a déjà fait plusieurs fois — academicStanding, etc.).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Droits explicites : le projet Supabase est créé avec "Automatically expose
-- new tables" désactivé (recommandation Supabase), donc aucune table n'est
-- accessible via l'API tant qu'on ne l'accorde pas ici. Seul le rôle
-- `authenticated` (utilisateur connecté) y a accès — jamais `anon` — et RLS
-- ci-dessous restreint en plus chaque utilisateur à sa propre ligne.
grant select, insert, update, delete on public.profiles to authenticated;

-- Isolation des données imposée par Postgres, pas seulement par le code
-- applicatif : un utilisateur ne peut jamais lire ni écrire la ligne d'un
-- autre, même en cas de bug côté client.
create policy "Un utilisateur lit son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Un utilisateur écrit son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Un utilisateur met à jour son propre profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Un utilisateur supprime son propre profil"
  on public.profiles for delete
  using (auth.uid() = id);

-- Supprimer le compte (auth.users, via l'API admin — voir
-- app/api/account/delete/route.ts) supprime automatiquement cette ligne
-- (`on delete cascade` ci-dessus) : pas de nettoyage manuel à faire ailleurs.
