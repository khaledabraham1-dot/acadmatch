-- Demandes de formations absentes du catalogue (2026-10-05) — voir
-- lib/formationRequests.ts.
--
-- Quand un étudiant ne trouve pas la formation qu'il vise, il peut la
-- signaler en une phrase. Ces demandes disent quelles fiches ajouter en
-- priorité au catalogue (aujourd'hui 48 formations).
--
-- Même modèle que la table feedback (0005) : demandes ANONYMES (aucun
-- identifiant, aucun e-mail), écriture ouverte à tous, lecture réservée au
-- propriétaire du projet (tableau de bord Supabase / clé secrète).
--
-- À exécuter dans Supabase (SQL Editor). Tant que la table n'existe pas, les
-- demandes restent en attente sur l'appareil et sont renvoyées plus tard.

create table if not exists public.formation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  wanted text not null check (char_length(wanted) between 2 and 200),
  institution text check (char_length(institution) <= 160),
  country text check (country in ('France', 'Belgique', 'Autre')),
  -- D'où vient la demande (recherche vide, bas de liste, catalogue…).
  source text not null check (char_length(source) between 1 and 40),
  search_query text check (char_length(search_query) <= 120),
  -- Contexte anonyme du profil, pour savoir QUI manque de formations.
  profile_field text check (char_length(profile_field) <= 80),
  profile_level text check (char_length(profile_level) <= 40),
  profile_goal text check (char_length(profile_goal) <= 40)
);

alter table public.formation_requests enable row level security;

grant insert on public.formation_requests to anon, authenticated;

create policy "Tout le monde peut demander une formation"
  on public.formation_requests for insert
  to anon, authenticated
  with check (true);

-- Pas de select/update/delete pour anon ni authenticated.

create index if not exists formation_requests_created_at_idx on public.formation_requests (created_at desc);
