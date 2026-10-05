-- Lecture des tables par l'espace admin (2026-10-06) — voir app/admin/page.tsx.
--
-- Le projet Supabase a été créé avec « Automatically expose new tables »
-- désactivé : les migrations précédentes n'ont accordé des droits qu'aux
-- rôles anon et authenticated. La clé secrète (rôle service_role), utilisée
-- uniquement côté serveur après vérification de l'administrateur, recevait
-- donc « permission denied ».
--
-- Droits accordés : LECTURE SEULE. Aucune écriture, aucune suppression.
-- La clé secrète ne quitte jamais le serveur (lib/supabase/admin.ts).
--
-- À exécuter dans Supabase (SQL Editor). Réexécutable sans risque.

grant usage on schema public to service_role;

grant select on public.profiles to service_role;
grant select on public.workspaces to service_role;
grant select on public.ai_usage to service_role;
grant select on public.feedback to service_role;
grant select on public.formation_requests to service_role;
grant select on public.journey_events to service_role;
