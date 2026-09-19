"use client";

import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, ArrowRight, Columns2, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { FormationCard } from "@/components/search/FormationCard";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { Input, Select } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { FORMATIONS } from "@/data/formations";
import { ACADEMIC_LEVEL_ORDER, type StudentProfile } from "@/types";
import {
  clearCompareIds,
  compareResultsHref,
  loadCompareIds,
  loadProfile,
  MAX_COMPARE_FORMATIONS,
  toggleCompareId,
} from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import { validateStoredProfile } from "@/lib/profile/validation";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";
import { CatalogueScopeNotice } from "@/components/ui/CatalogueScopeNotice";
import {
  ALL_CITIES,
  ALL_DOMAINS,
  ALL_LANGUAGES,
  ALL_LEVELS,
  filterFormations,
  uniqueSorted,
} from "@/lib/search/filters";

// Dérivés du catalogue réel (pas des référentiels complets de data/subjects.ts) :
// proposer un domaine, niveau, ville ou langue qui ne correspond à aucune
// formation mènerait systématiquement à "Aucune formation ne correspond".
const AVAILABLE_DOMAINS = uniqueSorted(FORMATIONS, (f) => f.field);
const AVAILABLE_LEVELS = ACADEMIC_LEVEL_ORDER.filter((l) => FORMATIONS.some((f) => f.level === l));
const AVAILABLE_CITIES = uniqueSorted(FORMATIONS, (f) => f.city);
const AVAILABLE_LANGUAGES = uniqueSorted(FORMATIONS, (f) => f.language);

export default function RecherchePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(ALL_LEVELS);
  const [domain, setDomain] = useState(ALL_DOMAINS);
  const [city, setCity] = useState(ALL_CITIES);
  const [language, setLanguage] = useState(ALL_LANGUAGES);

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la lecture doit se faire après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setCompareIds(loadCompareIds());
  }, []);

  function resetFilters() {
    setQuery("");
    setLevel(ALL_LEVELS);
    setDomain(ALL_DOMAINS);
    setCity(ALL_CITIES);
    setLanguage(ALL_LANGUAGES);
  }

  function handleToggleCompare(formationId: string) {
    setCompareIds(toggleCompareId(formationId));
  }

  function handleClearCompare() {
    clearCompareIds();
    setCompareIds([]);
  }

  const scores = useMemo(() => {
    if (!profile) return new Map<string, number>();
    return new Map(
      FORMATIONS.map((formation) => [formation.id, computeCompatibility(profile, formation).overallScore]),
    );
  }, [profile]);

  const filtered = useMemo(() => {
    return filterFormations(FORMATIONS, { query, level, domain, city, language }).sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );
  }, [query, level, domain, city, language, scores, profile]);

  const compareNames = compareIds
    .map((id) => FORMATIONS.find((f) => f.id === id)?.name)
    .filter(Boolean);

  return (
    <AppShell
      title="Rechercher une formation"
      description="Trouvez la formation française qui correspond à votre parcours. Cochez 2 ou 3 fiches pour les comparer."
    >
      {FORMATIONS.some((f) => f.demo) && (
        <div className="mb-6">
          <DemoDataBadge />
        </div>
      )}

      {!profile && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm text-blue-800">
            Renseignez votre profil académique pour voir votre compatibilité avec chaque formation.
          </p>
          <LinkButton href="/profil?next=/recherche" size="sm">
            Analyser mon profil
            <ArrowRight className="size-3.5" />
          </LinkButton>
        </div>
      )}

      {profile && (
        <ProfileReliabilityNotice
          className="mb-6"
          validation={validateStoredProfile(profile)}
          editHref="/profil?next=/recherche"
        />
      )}

      <CatalogueScopeNotice
        goal={profile?.goal}
        className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600"
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une formation, un établissement..."
            className="pl-10"
            aria-label="Rechercher une formation ou un établissement"
          />
        </div>
        {/*
          flex-wrap plutôt qu'une grille à colonnes fixes : la somme des
          largeurs des <Select> peut dépasser la largeur disponible entre sm
          et lg (débordement horizontal déjà constaté à ~900px sur 2
          filtres) — avec 4 filtres, le wrap est d'autant plus nécessaire.
        */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full sm:w-44"
            aria-label="Filtrer par niveau"
          >
            <option>{ALL_LEVELS}</option>
            {AVAILABLE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full sm:w-56"
            aria-label="Filtrer par domaine"
          >
            <option>{ALL_DOMAINS}</option>
            {AVAILABLE_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full sm:w-40"
            aria-label="Filtrer par ville"
          >
            <option>{ALL_CITIES}</option>
            {AVAILABLE_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full sm:w-44"
            aria-label="Filtrer par langue"
          >
            <option>{ALL_LANGUAGES}</option>
            {AVAILABLE_LANGUAGES.map((lg) => (
              <option key={lg} value={lg}>
                {lg}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {filtered.length} formation{filtered.length > 1 ? "s" : ""} trouvée
        {filtered.length > 1 ? "s" : ""}
        {compareIds.length > 0 && (
          <span className="text-slate-500">
            {" "}
            · {compareIds.length}/{MAX_COMPARE_FORMATIONS} à comparer
          </span>
        )}
      </p>

      <div className={compareIds.length > 0 ? "space-y-4 pb-24" : "space-y-4"}>
        {filtered.map((formation) => (
          <FormationCard
            key={formation.id}
            formation={formation}
            score={scores.get(formation.id) ?? null}
            selectedForCompare={compareIds.includes(formation.id)}
            compareCount={compareIds.length}
            onToggleCompare={handleToggleCompare}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-400">Aucune formation ne correspond à votre recherche.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Columns2 className="size-4 text-blue-600" />
                Comparaison ({compareIds.length}/{MAX_COMPARE_FORMATIONS})
              </p>
              <p className="truncate text-xs text-slate-500">
                {compareNames.join(" · ") || "Sélectionnez des formations"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClearCompare}>
                <X className="size-3.5" />
                Vider
              </Button>
              {compareIds.length >= 2 ? (
                <LinkButton href={compareResultsHref(compareIds)} size="sm">
                  Comparer maintenant
                  <ArrowRight className="size-3.5" />
                </LinkButton>
              ) : (
                <p className="text-xs text-slate-500">Ajoutez encore une formation</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
