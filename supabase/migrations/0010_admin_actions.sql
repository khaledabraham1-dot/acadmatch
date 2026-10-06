-- Espace admin V2 (2026-10-06) — voir app/admin.
--
-- 1. Statut des demandes de formation (à traiter / ajoutée / refusée), pour
--    suivre ce qui a été fait de chaque demande.
-- 2. Journal des actions admin : qui a fait quoi et quand (changement de
--    statut, suppression d'un compte à la demande d'un étudiant…).
--
-- Seul le rôle serveur (clé secrète, utilisée après vérification de
-- l'administrateur) peut écrire : aucun droit pour les visiteurs ni pour les
-- comptes étudiants. À exécuter dans Supabase (SQL Editor). Réexécutable.

alter table public.formation_requests
  add column if not exists status text not null default 'a-traiter'
    check (status in ('a-traiter', 'ajoutee', 'refusee')),
  add column if not exists handled_at timestamptz;

grant update (status, handled_at) on public.formation_requests to service_role;

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  admin_email text not null check (char_length(admin_email) <= 320),
  action text not null check (char_length(action) between 1 and 60),
  detail text not null default '' check (char_length(detail) <= 500)
);

alter table public.admin_audit enable row level security;
-- Aucune politique pour anon ni authenticated : table invisible hors serveur.

grant select, insert on public.admin_audit to service_role;

create index if not exists admin_audit_created_at_idx on public.admin_audit (created_at desc);
