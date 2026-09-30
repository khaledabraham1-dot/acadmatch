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
  loadSavedFormationIds,
  MAX_COMPARE_FORMATIONS,
  toggleCompareId,
  toggleSavedFormationId,
} from "@/lib/storage";
import { acceptsStudentDomain, computeCompatibility } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import { getRecommendations } from "@/lib/matching/recommendations";
import { validateStoredProfile } from "@/lib/profile/validation";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";
import { CatalogueScopeNotice } from "@/components/ui/CatalogueScopeNotice";
import { HEALTH_DOMAIN, HealthStudiesNotice } from "@/components/ui/HealthStudiesNotice";
import { RecommendationsSection } from "@/components/recommendations/RecommendationsSection";
import {
  ALL_CITIES,
  ALL_DOMAINS,
  ALL_GOALS,
  ALL_LANGUAGES,
  ALL_LEVELS,
  filterFormations,
  uniqueSorted,
} from "@/lib/search/filters";

// Dérivés du catalogue réel (pas des référentiels complets de data/subjects.ts) :
// proposer un domaine, niveau, ville, langue ou diplôme qui ne correspond à
// aucune formation mènerait systématiquement à "Aucune formation ne correspond".
const AVAILABLE_DOMAINS = uniqueSorted(FORMATIONS, (f) => f.field);
const AVAILABLE_LEVELS = ACADEMIC_LEVEL_ORDER.filter((l) => FORMATIONS.some((f) => f.level === l));
const AVAILABLE_CITIES = uniqueSorted(FORMATIONS, (f) => f.institution.city);
const AVAILABLE_LANGUAGES = uniqueSorted(FORMATIONS, (f) => f.language);
const AVAILABLE_GOALS = uniqueSorted(FORMATIONS, (f) => f.goal);

export default function RecherchePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(ALL_LEVELS);
  const [domain, setDomain] = useState(ALL_DOMAINS);
  const [city, setCity] = useState(ALL_CITIES);
  const [language, setLanguage] = useState(ALL_LANGUAGES);
  const [goal, setGoal] = useState(ALL_GOALS);
  const [showOtherDomains, setShowOtherDomains] = useState(false);

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la lecture doit se faire après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setCompareIds(loadCompareIds());
    setSavedIds(loadSavedFormationIds());
  }, []);

  function resetFilters() {
    setQuery("");
    setLevel(ALL_LEVELS);
    setDomain(ALL_DOMAINS);
    setCity(ALL_CITIES);
    setLanguage(ALL_LANGUAGES);
    setGoal(ALL_GOALS);
  }

  function handleToggleCompare(formationId: string) {
    setCompareIds(toggleCompareId(formationId));
  }

  function handleToggleSave(formationId: string) {
    setSavedIds(toggleSavedFormationId(formationId));
  }

  function handleClearCompare() {
    clearCompareIds();
    setCompareIds([]);
  }

  const results = useMemo(() => {
    if (!profile) return new Map<string, { score: number; estimate: boolean }>();
    return new Map(
      FORMATIONS.map((formation) => {
        const result = computeCompatibility(profile, formation);
        return [formation.id, { score: result.overallScore, estimate: Boolean(result.evidenceCapped || result.noContentMatch) }];
      }),
    );
  }, [profile]);
  const scores = useMemo(() => new Map([...results].map(([id, r]) => [id, r.score])), [results]);

  const filtered = useMemo(() => {
    return filterFormations(FORMATIONS, { query, level, domain, city, language, goal }).sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );
  }, [query, level, domain, city, language, goal, scores, profile]);

  // Avec un profil et sans domaine choisi, on montre d'abord le domaine de
  // l'étudiant et ceux que les formations acceptent officiellement : un
  // étudiant en Data & IA ne doit pas croire que 48 formations le concernent
  // (retour de Khaled, 2026-09-30). Les autres restent accessibles, repliées.
  const splitByDomain = profile !== null && domain === ALL_DOMAINS;
  const inDomain = splitByDomain ? filtered.filter((f) => acceptsStudentDomain(profile, f)) : filtered;
  const otherDomains = splitByDomain ? filtered.filter((f) => !acceptsStudentDomain(profile, f)) : [];
  // Une recherche qui ne trouve rien dans le domaine montre directement les autres.
  const othersVisible = showOtherDomains || (inDomain.length === 0 && otherDomains.length > 0);

  // Top picks catalogue entier, indépendants des filtres ci-dessous (Phase 9).
  const recommendations = useMemo(() => {
    if (!profile) return [];
    return getRecommendations(profile, FORMATIONS);
  }, [profile]);

  const hasActiveFilters =
    query !== "" ||
    level !== ALL_LEVELS ||
    domain !== ALL_DOMAINS ||
    city !== ALL_CITIES ||
    language !== ALL_LANGUAGES ||
    goal !== ALL_GOALS;

  const compareNames = compareIds
    .map((id) => FORMATIONS.find((f) => f.id === id)?.name)
    .filter(Boolean);

  return (
    <AppShell
      title="Rechercher une formation"
      description="Trouvez la formation qui correspond à votre parcours, en France et en Belgique. Cochez 2 ou 3 fiches pour les comparer."
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

      {profile?.fieldOfStudy === HEALTH_DOMAIN && <HealthStudiesNotice className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-slate-700" />}

      <RecommendationsSection
        recommendations={recommendations}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
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
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full sm:w-44"
            aria-label="Filtrer par diplôme visé"
          >
            <option>{ALL_GOALS}</option>
            {AVAILABLE_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {splitByDomain ? (
            <>
              <strong className="font-bold text-slate-900">
                {inDomain.length} formation{inDomain.length > 1 ? "s" : ""} dans votre domaine
              </strong>{" "}
              ({profile.fieldOfStudy} et domaines acceptés par les formations)
            </>
          ) : (
            <>
              {filtered.length} formation{filtered.length > 1 ? "s" : ""} trouvée
              {filtered.length > 1 ? "s" : ""}
            </>
          )}
          {compareIds.length > 0 && (
            <span className="text-slate-500">
              {" "}
              · {compareIds.length}/{MAX_COMPARE_FORMATIONS} à comparer
            </span>
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className={compareIds.length > 0 ? "space-y-4 pb-24" : "space-y-4"}>
        {inDomain.map((formation) => (
          <FormationCard
            key={formation.id}
            formation={formation}
            score={scores.get(formation.id) ?? null}
            estimate={results.get(formation.id)?.estimate ?? false}
            selectedForCompare={compareIds.includes(formation.id)}
            compareCount={compareIds.length}
            onToggleCompare={handleToggleCompare}
            saved={savedIds.includes(formation.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
        {otherDomains.length > 0 && (
          <section aria-labelledby="autres-domaines" className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <div>
                <h2 id="autres-domaines" className="text-base font-bold text-slate-900">
                  Autres domaines ({otherDomains.length})
                </h2>
                <p className="text-sm text-slate-500">Sans rapport direct avec votre parcours : utile seulement si vous envisagez une réorientation.</p>
              </div>
              {inDomain.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowOtherDomains((v) => !v)} aria-expanded={othersVisible}>
                  {othersVisible ? "Masquer les autres domaines" : `Voir les autres domaines (${otherDomains.length})`}
                </Button>
              )}
            </div>
            {othersVisible &&
              otherDomains.map((formation) => (
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  score={scores.get(formation.id) ?? null}
                  estimate={results.get(formation.id)?.estimate ?? false}
                  selectedForCompare={compareIds.includes(formation.id)}
                  compareCount={compareIds.length}
                  onToggleCompare={handleToggleCompare}
                  saved={savedIds.includes(formation.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
          </section>
        )}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">Aucune formation ne correspond à votre recherche.</p>
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
