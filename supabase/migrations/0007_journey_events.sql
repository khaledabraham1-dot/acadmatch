-- Mesure anonyme du parcours (2026-10-05) — voir lib/journey.ts.
--
-- La mesure d'audience Vercel (offre gratuite) compte les pages vues, pas
-- les étapes : impossible de savoir combien de visiteurs vont jusqu'au
-- résultat, importent un relevé ou ajoutent une candidature. Cette table
-- compte ces étapes, et rien d'autre.
--
-- Aucune donnée personnelle : ni identifiant, ni compte, ni session, ni
-- contenu du profil. Une ligne = « une étape franchie », avec seulement le
-- type d'appareil (mobile / ordinateur). Les lignes ne peuvent pas être
-- reliées entre elles : on lit des totaux par étape, pas des personnes.
--
-- Écriture ouverte à tous, lecture réservée au propriétaire du projet.
-- À exécuter dans Supabase (SQL Editor). Sans la table, les envois échouent
-- en silence (rien n'est gardé sur l'appareil).

create table if not exists public.journey_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  step text not null check (step in (
    'exemple-essaye',
    'profil-parcours',
    'profil-enregistre',
    'resultat-vu',
    'releve-importe',
    'candidature-ajoutee',
    'ia-utilisee',
    'partage'
  )),
  detail text check (char_length(detail) <= 40),
  device text check (device in ('mobile', 'ordinateur'))
);

alter table public.journey_events enable row level security;

grant insert on public.journey_events to anon, authenticated;

create policy "Tout le monde peut compter une étape"
  on public.journey_events for insert
  to anon, authenticated
  with check (true);

create index if not exists journey_events_created_at_idx on public.journey_events (created_at desc);

-- Lecture (tableau de bord Supabase, SQL Editor) — l'entonnoir des 30 derniers jours :
--
--   select step, detail, device, count(*) as total
--   from public.journey_events
--   where created_at > now() - interval '30 days'
--   group by step, detail, device
--   order by step, total desc;
