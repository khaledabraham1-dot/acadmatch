-- Avis sur les résultats, enregistrés en base (2026-10-01) — voir lib/feedback.ts.
--
-- Jusqu'ici les avis restaient dans le navigateur de l'étudiant : personne ne
-- les lisait. Ils sont désormais envoyés, ANONYMES (aucun identifiant, aucun
-- e-mail), avec le seul contexte utile pour améliorer le score.
--
-- Écriture ouverte à tous (anon et connectés), lecture réservée au
-- propriétaire du projet (tableau de bord Supabase / clé secrète) : aucune
-- politique de lecture n'est accordée aux rôles publics.
--
-- À exécuter dans Supabase (SQL Editor) AVANT de déployer le code qui s'en
-- sert : sans cette table, les avis restent en attente sur l'appareil et
-- sont renvoyés plus tard.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  formation_id text not null check (char_length(formation_id) between 1 and 120),
  score smallint check (score between 0 and 100),
  helpfulness text not null check (helpfulness in ('oui', 'partiellement', 'non')),
  score_fairness text check (score_fairness in ('trop-haut', 'juste', 'trop-bas')),
  comment text not null default '' check (char_length(comment) <= 1000),
  -- Contexte anonyme du profil, pour savoir OÙ le score paraît faux.
  profile_field text check (char_length(profile_field) <= 80),
  profile_level text check (char_length(profile_level) <= 40),
  score_estimate boolean not null default false,
  from_transcript boolean not null default false
);

alter table public.feedback enable row level security;

grant insert on public.feedback to anon, authenticated;

create policy "Tout le monde peut envoyer un avis"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- Pas de select/update/delete pour anon ni authenticated : un visiteur ne
-- peut ni lire ni modifier les avis des autres.

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
