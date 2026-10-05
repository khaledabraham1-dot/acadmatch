-- Plafond anti-abus des tables anonymes (2026-10-05, audit avant lancement).
--
-- feedback, formation_requests et journey_events acceptent les insertions de
-- n'importe quel visiteur (clé publique) : c'est voulu, mais un script
-- pourrait les inonder et remplir la base. Ce déclencheur refuse une
-- insertion quand la table a déjà reçu trop de lignes dans la dernière
-- minute, tous visiteurs confondus (aucune donnée d'identification n'est
-- stockée, on ne peut donc pas limiter par visiteur).
--
-- Plafonds larges pour le trafic réel : un avis ou une demande prend du
-- temps à rédiger ; le comptage du parcours est plus fréquent. Côté site,
-- un refus est silencieux (avis et demandes restent en attente sur
-- l'appareil et repartent plus tard).
--
-- À exécuter dans Supabase (SQL Editor). Sans risque pour les données
-- existantes ; réexécutable.

create or replace function public.throttle_anonymous_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_minute integer := tg_argv[0]::integer;
  recent integer;
begin
  execute format(
    'select count(*) from public.%I where created_at > now() - interval ''1 minute''',
    tg_table_name
  ) into recent;
  if recent >= max_per_minute then
    raise exception 'Trop d''envois en ce moment, réessayez plus tard.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists throttle_feedback on public.feedback;
create trigger throttle_feedback
  before insert on public.feedback
  for each row execute function public.throttle_anonymous_insert('30');

drop trigger if exists throttle_formation_requests on public.formation_requests;
create trigger throttle_formation_requests
  before insert on public.formation_requests
  for each row execute function public.throttle_anonymous_insert('30');

drop trigger if exists throttle_journey_events on public.journey_events;
create trigger throttle_journey_events
  before insert on public.journey_events
  for each row execute function public.throttle_anonymous_insert('600');
